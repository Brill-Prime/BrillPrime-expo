import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import {
  User,
  UserRoleStatus,
  RoleVerification,
  RoleRegistrationRequest,
  ApiResponse,
} from './types';

class RoleManagementService {
  private readonly ROLE_STATUS_KEY = 'userRoleStatus';
  private readonly CURRENT_ROLE_KEY = 'currentRole';
  private readonly PRIMARY_ROLE_KEY = 'userRole';

  async getRoleStatus(): Promise<UserRoleStatus | null> {
    try {
      const roleStatusJson = await AsyncStorage.getItem(this.ROLE_STATUS_KEY);
      if (roleStatusJson) {
        return JSON.parse(roleStatusJson);
      }
      return this.getDefaultRoleStatus();
    } catch (error) {
      console.error('Error getting role status:', error);
      return this.getDefaultRoleStatus();
    }
  }

  private getDefaultRoleStatus(): UserRoleStatus {
    return {
      consumer: {
        isRegistered: true,
        isVerified: true,
        registeredAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        verificationStatus: 'approved',
      },
      merchant: {
        isRegistered: false,
        isVerified: false,
        verificationStatus: 'pending',
      },
      driver: {
        isRegistered: false,
        isVerified: false,
        verificationStatus: 'pending',
      },
    };
  }

  async setRoleStatus(roleStatus: UserRoleStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ROLE_STATUS_KEY, JSON.stringify(roleStatus));
    } catch (error) {
      console.error('Error setting role status:', error);
    }
  }

  async getCurrentRole(): Promise<'consumer' | 'merchant' | 'driver'> {
    try {
      const currentRole = await AsyncStorage.getItem(this.CURRENT_ROLE_KEY);
      if (currentRole) {
        return currentRole as 'consumer' | 'merchant' | 'driver';
      }
      const primaryRole = await AsyncStorage.getItem(this.PRIMARY_ROLE_KEY);
      return (primaryRole as 'consumer' | 'merchant' | 'driver') || 'consumer';
    } catch (error) {
      console.error('Error getting current role:', error);
      return 'consumer';
    }
  }

  async switchRole(role: 'consumer' | 'merchant' | 'driver'): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const roleStatus = await this.getRoleStatus();
      
      if (!roleStatus) {
        return {
          success: false,
          error: 'Role status not found',
        };
      }

      const targetRoleStatus = roleStatus[role];
      
      if (!targetRoleStatus.isRegistered) {
        return {
          success: false,
          error: `You need to register as a ${role} first`,
          requiresRedirect: true,
        };
      }

      if (!targetRoleStatus.isVerified) {
        return {
          success: false,
          error: `Your ${role} account is not verified yet. Verification status: ${targetRoleStatus.verificationStatus}`,
        };
      }

      await AsyncStorage.multiSet([
        [this.CURRENT_ROLE_KEY, role],
        [this.PRIMARY_ROLE_KEY, role],
        ['userRole', role],
        ['selectedRole', role],
      ]);

      return {
        success: true,
        data: { success: true },
      };
    } catch (error) {
      console.error('Error switching role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch role',
      };
    }
  }

  async checkRoleAccess(role: 'consumer' | 'merchant' | 'driver'): Promise<{
    hasAccess: boolean;
    reason?: string;
    requiresRegistration?: boolean;
    requiresVerification?: boolean;
  }> {
    try {
      const roleStatus = await this.getRoleStatus();
      
      if (!roleStatus) {
        return {
          hasAccess: role === 'consumer',
          reason: role !== 'consumer' ? 'Role status not initialized' : undefined,
        };
      }

      const targetRoleStatus = roleStatus[role];
      
      if (role === 'consumer') {
        return { hasAccess: true };
      }

      if (!targetRoleStatus.isRegistered) {
        return {
          hasAccess: false,
          reason: `You need to register as a ${role} to access this feature`,
          requiresRegistration: true,
        };
      }

      if (!targetRoleStatus.isVerified) {
        return {
          hasAccess: false,
          reason: `Your ${role} account is pending verification`,
          requiresVerification: true,
        };
      }

      return { hasAccess: true };
    } catch (error) {
      console.error('Error checking role access:', error);
      return {
        hasAccess: false,
        reason: 'Error checking access permissions',
      };
    }
  }

  async registerForRole(request: RoleRegistrationRequest): Promise<ApiResponse<RoleVerification>> {
    try {
      const response = await apiClient.post<RoleVerification>(
        '/api/profile/register-role',
        request
      );

      if (response.success && response.data) {
        const roleStatus = await this.getRoleStatus();
        if (roleStatus) {
          roleStatus[request.role] = {
            ...response.data,
            isRegistered: true,
          };
          await this.setRoleStatus(roleStatus);
        }
      }

      return response;
    } catch (error) {
      console.error('Error registering for role:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register for role',
      };
    }
  }

  async syncRoleStatusFromBackend(): Promise<ApiResponse<UserRoleStatus>> {
    try {
      const response = await apiClient.get<{ roleStatus: UserRoleStatus }>(
        '/api/profile/role-status'
      );

      if (response.success && response.data?.roleStatus) {
        await this.setRoleStatus(response.data.roleStatus);
        return {
          success: true,
          data: response.data.roleStatus,
        };
      }

      return {
        success: false,
        error: 'Failed to sync role status',
      };
    } catch (error) {
      console.error('Error syncing role status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync role status',
      };
    }
  }

  async initializeRoleStatus(primaryRole: 'consumer' | 'merchant' | 'driver'): Promise<void> {
    try {
      const existingStatus = await this.getRoleStatus();
      
      if (!existingStatus) {
        const defaultStatus = this.getDefaultRoleStatus();
        
        if (primaryRole === 'merchant') {
          defaultStatus.merchant = {
            isRegistered: true,
            isVerified: true,
            registeredAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            verificationStatus: 'approved',
          };
        } else if (primaryRole === 'driver') {
          defaultStatus.driver = {
            isRegistered: true,
            isVerified: true,
            registeredAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            verificationStatus: 'approved',
          };
        }
        
        await this.setRoleStatus(defaultStatus);
        await AsyncStorage.setItem(this.CURRENT_ROLE_KEY, primaryRole);
      }
    } catch (error) {
      console.error('Error initializing role status:', error);
    }
  }

  async getAvailableRoles(): Promise<Array<{
    role: 'consumer' | 'merchant' | 'driver';
    isVerified: boolean;
    verificationStatus: string;
  }>> {
    try {
      const roleStatus = await this.getRoleStatus();
      if (!roleStatus) return [];

      const roles: Array<{
        role: 'consumer' | 'merchant' | 'driver';
        isVerified: boolean;
        verificationStatus: string;
      }> = [];

      Object.entries(roleStatus).forEach(([roleName, status]) => {
        if (status.isRegistered) {
          roles.push({
            role: roleName as 'consumer' | 'merchant' | 'driver',
            isVerified: status.isVerified,
            verificationStatus: status.verificationStatus || 'pending',
          });
        }
      });

      return roles;
    } catch (error) {
      console.error('Error getting available roles:', error);
      return [];
    }
  }

  async canAccessMerchantFeatures(): Promise<boolean> {
    const access = await this.checkRoleAccess('merchant');
    return access.hasAccess;
  }

  async canAccessDriverFeatures(): Promise<boolean> {
    const access = await this.checkRoleAccess('driver');
    return access.hasAccess;
  }
}

export const roleManagementService = new RoleManagementService();
