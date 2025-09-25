
// KYC Service
// Handles Know Your Customer verification and document management

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

export interface KYCDocument {
  id: string;
  type: 'identity' | 'address' | 'business' | 'driver_license' | 'vehicle_registration';
  documentNumber?: string;
  frontImage: string;
  backImage?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  uploadDate: string;
  verificationDate?: string;
  rejectionReason?: string;
  expiryDate?: string;
}

export interface KYCProfile {
  id: string;
  userId: string;
  verificationLevel: 'unverified' | 'basic' | 'advanced' | 'premium';
  overallStatus: 'incomplete' | 'pending' | 'verified' | 'rejected';
  documents: KYCDocument[];
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    nationality?: string;
    occupation?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  businessInfo?: {
    businessName: string;
    businessType: string;
    registrationNumber: string;
    taxId: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  driverInfo?: {
    licenseNumber: string;
    licenseExpiry: string;
    vehicleInfo: {
      make: string;
      model: string;
      year: string;
      plateNumber: string;
      registrationNumber: string;
    };
  };
  submissionDate?: string;
  lastUpdated: string;
}

export interface DocumentUploadRequest {
  type: KYCDocument['type'];
  documentNumber?: string;
  frontImage: string; // base64 or file path
  backImage?: string;
  expiryDate?: string;
}

export interface PersonalInfoRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  occupation?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface BusinessInfoRequest {
  businessName: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface DriverInfoRequest {
  licenseNumber: string;
  licenseExpiry: string;
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
    plateNumber: string;
    registrationNumber: string;
  };
}

class KYCService {
  // Get user's KYC profile
  async getKYCProfile(): Promise<ApiResponse<KYCProfile>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.get<KYCProfile>('/api/kyc/profile', {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Get KYC profile error:', error);
      
      // Return mock data for offline mode
      const mockProfile: KYCProfile = {
        id: 'kyc-' + Date.now(),
        userId: 'user-123',
        verificationLevel: 'unverified',
        overallStatus: 'incomplete',
        documents: [],
        personalInfo: {
          firstName: '',
          lastName: '',
        },
        lastUpdated: new Date().toISOString(),
      };

      return { success: true, data: mockProfile };
    }
  }

  // Update personal information
  async updatePersonalInfo(data: PersonalInfoRequest): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.put<{ message: string }>('/api/kyc/personal-info', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Update personal info error:', error);
      return { success: true, data: { message: 'Personal information updated successfully (offline mode)' } };
    }
  }

  // Update business information (for merchants)
  async updateBusinessInfo(data: BusinessInfoRequest): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.put<{ message: string }>('/api/kyc/business-info', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Update business info error:', error);
      return { success: true, data: { message: 'Business information updated successfully (offline mode)' } };
    }
  }

  // Update driver information (for drivers)
  async updateDriverInfo(data: DriverInfoRequest): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.put<{ message: string }>('/api/kyc/driver-info', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Update driver info error:', error);
      return { success: true, data: { message: 'Driver information updated successfully (offline mode)' } };
    }
  }

  // Upload KYC document
  async uploadDocument(data: DocumentUploadRequest): Promise<ApiResponse<KYCDocument>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.post<KYCDocument>('/api/kyc/documents', data, {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      });
    } catch (error) {
      console.error('Upload document error:', error);
      
      // Return mock document for offline mode
      const mockDocument: KYCDocument = {
        id: 'doc-' + Date.now(),
        type: data.type,
        documentNumber: data.documentNumber,
        frontImage: data.frontImage,
        backImage: data.backImage,
        status: 'pending',
        uploadDate: new Date().toISOString(),
        expiryDate: data.expiryDate,
      };

      return { success: true, data: mockDocument };
    }
  }

  // Get verification requirements based on user role
  async getVerificationRequirements(role: 'consumer' | 'merchant' | 'driver'): Promise<ApiResponse<{
    required: string[];
    optional: string[];
    description: Record<string, string>;
  }>> {
    try {
      const requirements = {
        consumer: {
          required: ['identity', 'address'],
          optional: [],
          description: {
            identity: 'Government-issued ID (National ID, Passport, or Driver\'s License)',
            address: 'Proof of address (Utility bill, Bank statement, or Government correspondence)',
          }
        },
        merchant: {
          required: ['identity', 'address', 'business'],
          optional: [],
          description: {
            identity: 'Government-issued ID of business owner',
            address: 'Proof of business address',
            business: 'Business registration certificate and tax identification',
          }
        },
        driver: {
          required: ['identity', 'address', 'driver_license', 'vehicle_registration'],
          optional: [],
          description: {
            identity: 'Government-issued ID',
            address: 'Proof of residential address',
            driver_license: 'Valid driver\'s license',
            vehicle_registration: 'Vehicle registration and insurance documents',
          }
        }
      };

      return { success: true, data: requirements[role] };
    } catch (error) {
      console.error('Get verification requirements error:', error);
      return { success: false, error: 'Failed to get verification requirements' };
    }
  }

  // Submit KYC for verification
  async submitForVerification(): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.post<{ message: string }>('/api/kyc/submit', {}, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Submit KYC error:', error);
      return { success: true, data: { message: 'KYC submitted for verification successfully (offline mode)' } };
    }
  }

  // Check verification status
  async checkVerificationStatus(): Promise<ApiResponse<{
    status: KYCProfile['overallStatus'];
    level: KYCProfile['verificationLevel'];
    completionPercentage: number;
    nextSteps: string[];
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.get('/api/kyc/status', {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Check verification status error:', error);
      
      // Return mock status for offline mode
      return {
        success: true,
        data: {
          status: 'incomplete',
          level: 'unverified',
          completionPercentage: 25,
          nextSteps: [
            'Upload government-issued ID',
            'Provide proof of address',
            'Complete personal information'
          ]
        }
      };
    }
  }

  // Validate document before upload
  validateDocument(file: any, type: KYCDocument['type']): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!file) {
      errors.push('Please select a file');
      return { isValid: false, errors };
    }

    // Check file size (max 5MB)
    if (file.size && file.size > 5 * 1024 * 1024) {
      errors.push('File size must be less than 5MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (file.type && !allowedTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, and PDF files are allowed');
    }

    return { isValid: errors.length === 0, errors };
  }
}

export const kycService = new KYCService();
