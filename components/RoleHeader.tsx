import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { roleManagementService } from '../services/roleManagementService';
import RoleSwitcher from './RoleSwitcher';
import { theme } from '../config/theme';

interface RoleHeaderProps {
  onRoleChange?: () => void;
}

export default function RoleHeader({ onRoleChange }: RoleHeaderProps) {
  const [currentRole, setCurrentRole] = useState<'consumer' | 'merchant' | 'driver'>('consumer');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [availableRolesCount, setAvailableRolesCount] = useState(1);

  useEffect(() => {
    loadRoleInfo();
  }, []);

  const loadRoleInfo = async () => {
    try {
      const [role, availableRoles] = await Promise.all([
        roleManagementService.getCurrentRole(),
        roleManagementService.getAvailableRoles(),
      ]);
      setCurrentRole(role);
      setAvailableRolesCount(availableRoles.length);
    } catch (error) {
      console.error('Error loading role info:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'consumer':
        return 'person';
      case 'merchant':
        return 'storefront';
      case 'driver':
        return 'car';
      default:
        return 'person';
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

  const handleRoleSwitch = () => {
    loadRoleInfo();
    if (onRoleChange) {
      onRoleChange();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { borderColor: getRoleColor(currentRole) }]}
        onPress={() => setShowRoleSwitcher(true)}
      >
        <View style={styles.roleInfo}>
          <View style={[styles.iconContainer, { backgroundColor: getRoleColor(currentRole) + '20' }]}>
            <Ionicons 
              name={getRoleIcon(currentRole) as any} 
              size={20} 
              color={getRoleColor(currentRole)} 
            />
          </View>
          <View>
            <Text style={styles.roleLabel}>Current Mode</Text>
            <Text style={styles.roleName}>
              {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
            </Text>
          </View>
        </View>
        {availableRolesCount > 1 && (
          <View style={styles.switchButton}>
            <Text style={styles.switchText}>Switch</Text>
            <Ionicons name="swap-horizontal" size={16} color={theme.colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>

      <RoleSwitcher
        visible={showRoleSwitcher}
        onClose={() => setShowRoleSwitcher(false)}
        onRoleSwitch={handleRoleSwitch}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    marginBottom: theme.spacing.base,
    ...theme.shadows.base,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  roleName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
  },
  switchText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
