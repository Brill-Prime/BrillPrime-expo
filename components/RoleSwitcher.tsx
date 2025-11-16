import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { roleManagementService } from '../services/roleManagementService';
import { theme } from '../config/theme';

interface Role {
  role: 'consumer' | 'merchant' | 'driver';
  isVerified: boolean;
  verificationStatus: string;
}

interface RoleSwitcherProps {
  visible: boolean;
  onClose: () => void;
  onRoleSwitch?: (role: 'consumer' | 'merchant' | 'driver') => void;
}

export default function RoleSwitcher({ visible, onClose, onRoleSwitch }: RoleSwitcherProps) {
  const router = useRouter();
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRoles();
    }
  }, [visible]);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const [roles, current] = await Promise.all([
        roleManagementService.getAvailableRoles(),
        roleManagementService.getCurrentRole(),
      ]);
      setAvailableRoles(roles);
      setCurrentRole(current);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSwitch = async (role: 'consumer' | 'merchant' | 'driver') => {
    if (role === currentRole) {
      onClose();
      return;
    }

    setIsSwitching(true);
    try {
      const response = await roleManagementService.switchRole(role);

      if (response.success) {
        setCurrentRole(role);
        
        Alert.alert(
          'Role Switched',
          `You are now using the app as a ${role}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                if (onRoleSwitch) {
                  onRoleSwitch(role);
                } else {
                  switch (role) {
                    case 'consumer':
                      router.replace('/home/consumer');
                      break;
                    case 'merchant':
                      router.replace('/home/merchant');
                      break;
                    case 'driver':
                      router.replace('/home/driver');
                      break;
                  }
                }
              },
            },
          ]
        );
      } else if (response.requiresRedirect) {
        Alert.alert(
          'Authentication Required',
          `To become a ${role}, you need to sign up for this role first.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Sign Up Now',
              onPress: async () => {
                onClose();
                await AsyncStorage.setItem('selectedRole', role);
                await AsyncStorage.setItem('pendingRoleSwitch', role);
                router.push('/auth/role-selection');
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to switch role');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'consumer':
        return '🛒';
      case 'merchant':
        return '🏪';
      case 'driver':
        return '🚗';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'consumer':
        return theme.colors.success;
      case 'merchant':
        return theme.colors.warning;
      case 'driver':
        return theme.colors.info;
      default:
        return theme.colors.textLight;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Switch Role</Text>
            <Text style={styles.subtitle}>
              Select the role you want to use
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.rolesContainer}>
              {availableRoles.map((roleItem) => (
                <TouchableOpacity
                  key={roleItem.role}
                  style={[
                    styles.roleCard,
                    currentRole === roleItem.role && styles.roleCardActive,
                    !roleItem.isVerified && styles.roleCardDisabled,
                  ]}
                  onPress={() => handleRoleSwitch(roleItem.role)}
                  disabled={!roleItem.isVerified || isSwitching}
                >
                  <View style={styles.roleCardContent}>
                    <Text style={styles.roleIcon}>{getRoleIcon(roleItem.role)}</Text>
                    <View style={styles.roleInfo}>
                      <Text style={styles.roleName}>
                        {roleItem.role.charAt(0).toUpperCase() + roleItem.role.slice(1)}
                      </Text>
                      {currentRole === roleItem.role && (
                        <Text style={styles.currentBadge}>Current</Text>
                      )}
                      {!roleItem.isVerified && (
                        <Text style={styles.statusBadge}>
                          {roleItem.verificationStatus === 'pending'
                            ? 'Pending Verification'
                            : 'Not Verified'}
                        </Text>
                      )}
                    </View>
                  </View>
                  {roleItem.isVerified && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              {availableRoles.length < 3 && (
                <View style={styles.registerSection}>
                  <Text style={styles.registerTitle}>Want to add another role?</Text>
                  <View style={styles.registerButtons}>
                    {!availableRoles.some((r) => r.role === 'merchant') && (
                      <TouchableOpacity
                        style={styles.registerButton}
                        onPress={async () => {
                          onClose();
                          await AsyncStorage.setItem('selectedRole', 'merchant');
                          await AsyncStorage.setItem('pendingRoleSwitch', 'merchant');
                          router.push('/auth/role-selection');
                        }}
                      >
                        <Text style={styles.registerButtonText}>
                          🏪 Sign Up as Merchant
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!availableRoles.some((r) => r.role === 'driver') && (
                      <TouchableOpacity
                        style={styles.registerButton}
                        onPress={async () => {
                          onClose();
                          await AsyncStorage.setItem('selectedRole', 'driver');
                          await AsyncStorage.setItem('pendingRoleSwitch', 'driver');
                          router.push('/auth/role-selection');
                        }}
                      >
                        <Text style={styles.registerButtonText}>
                          🚗 Sign Up as Driver
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isSwitching}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    padding: theme.spacing['3xl'],
    alignItems: 'center',
  },
  rolesContainer: {
    marginBottom: theme.spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  roleCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  roleCardDisabled: {
    opacity: 0.5,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  currentBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 24,
    color: theme.colors.success,
  },
  registerSection: {
    marginTop: theme.spacing.base,
    padding: theme.spacing.base,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
  },
  registerTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  registerButtons: {
    gap: theme.spacing.sm,
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  registerButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  closeButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
