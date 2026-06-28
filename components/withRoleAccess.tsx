import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { roleManagementService } from '../services/roleManagementService';
import { theme } from '../config/theme';

interface WithRoleAccessOptions {
  requiredRole: 'consumer' | 'merchant' | 'driver';
  fallbackRoute?: string;
  showUnauthorizedMessage?: boolean;
}

export function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  options: WithRoleAccessOptions
) {
  return function WithRoleAccessWrapper(props: P) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [accessInfo, setAccessInfo] = useState<{
      reason?: string;
      requiresRegistration?: boolean;
      requiresVerification?: boolean;
    }>({});

    useEffect(() => {
      checkAccess();
    }, []);

    const checkAccess = async () => {
      setIsChecking(true);
      try {
        const access = await roleManagementService.checkRoleAccess(options.requiredRole);
        setHasAccess(access.hasAccess);
        setAccessInfo({
          reason: access.reason,
          requiresRegistration: access.requiresRegistration,
          requiresVerification: access.requiresVerification,
        });

        if (!access.hasAccess && options.fallbackRoute) {
          setTimeout(() => {
            router.replace(options.fallbackRoute as any);
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking role access:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (isChecking) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Checking access permissions...</Text>
        </View>
      );
    }

    if (!hasAccess) {
      if (options.showUnauthorizedMessage !== false) {
        return (
          <View style={styles.container}>
            <View style={styles.messageCard}>
              <Text style={styles.icon}>🔒</Text>
              <Text style={styles.title}>Access Restricted</Text>
              <Text style={styles.message}>
                {accessInfo.reason || 'You do not have access to this feature'}
              </Text>
              
              {accessInfo.requiresRegistration && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/role-registration/${options.requiredRole}` as any)}
                >
                  <Text style={styles.actionButtonText}>
                    Register as {options.requiredRole.charAt(0).toUpperCase() + options.requiredRole.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
              
              {accessInfo.requiresVerification && (
                <View style={styles.verificationInfo}>
                  <Text style={styles.verificationText}>
                    Your {options.requiredRole} registration is pending verification.
                    You'll receive a notification once approved.
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      return null;
    }

    return <Component {...props} />;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.base,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  messageCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...theme.shadows.md,
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing.base,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.base,
    width: '100%',
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  verificationInfo: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.base,
    width: '100%',
  },
  verificationText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: '#856404',
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  backButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
