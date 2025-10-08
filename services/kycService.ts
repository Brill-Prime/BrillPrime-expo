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
      return { success: false, error: 'Failed to fetch KYC profile' };
    }
  }

  // Validate personal information
  private validatePersonalInfo(data: PersonalInfoRequest): { isValid: boolean; error?: string } {
    const { validateName, validateDate, validateAge, validateAddress } = require('../utils/validation');

    const firstNameValidation = validateName(data.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      return firstNameValidation;
    }

    const lastNameValidation = validateName(data.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      return lastNameValidation;
    }

    const dobValidation = validateAge(data.dateOfBirth, 18);
    if (!dobValidation.isValid) {
      return dobValidation;
    }

    const addressValidation = validateAddress(data.address.street);
    if (!addressValidation.isValid) {
      return { isValid: false, error: 'Street ' + addressValidation.error };
    }

    if (!data.address.city.trim()) {
      return { isValid: false, error: 'City is required' };
    }

    if (!data.address.state.trim()) {
      return { isValid: false, error: 'State is required' };
    }

    return { isValid: true };
  }

  // Update personal information
  async updatePersonalInfo(data: PersonalInfoRequest): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    const validation = this.validatePersonalInfo(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    try {
      return await apiClient.put<{ message: string }>('/api/kyc/personal-info', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Update personal info error:', error);
      return { success: false, error: 'Failed to update personal information' };
    }
  }

  // Validate business information
  private validateBusinessInfo(data: BusinessInfoRequest): { isValid: boolean; error?: string } {
    const { validateBusinessName, validateAddress } = require('../utils/validation');

    const businessNameValidation = validateBusinessName(data.businessName);
    if (!businessNameValidation.isValid) {
      return businessNameValidation;
    }

    if (!data.businessType.trim()) {
      return { isValid: false, error: 'Business type is required' };
    }

    if (!data.registrationNumber.trim()) {
      return { isValid: false, error: 'Registration number is required' };
    }

    if (data.registrationNumber.length < 5) {
      return { isValid: false, error: 'Registration number must be at least 5 characters' };
    }

    if (!data.taxId.trim()) {
      return { isValid: false, error: 'Tax ID is required' };
    }

    const addressValidation = validateAddress(data.businessAddress.street);
    if (!addressValidation.isValid) {
      return { isValid: false, error: 'Business address: ' + addressValidation.error };
    }

    return { isValid: true };
  }

  // Update business information (for merchants)
  async updateBusinessInfo(data: BusinessInfoRequest): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    const validation = this.validateBusinessInfo(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    try {
      return await apiClient.put<{ message: string }>('/api/kyc/business-info', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Update business info error:', error);
      return { success: false, error: 'Failed to update business information' };
    }
  }

  // Validate driver information
  private validateDriverInfo(data: DriverInfoRequest): { isValid: boolean; error?: string } {
    const { validateLicenseNumber, validatePlateNumber, validateDate } = require('../utils/validation');

    const licenseValidation = validateLicenseNumber(data.licenseNumber);
    if (!licenseValidation.isValid) {
      return licenseValidation;
    }

    const expiryValidation = validateDate(data.licenseExpiry, 'License expiry date');
    if (!expiryValidation.isValid) {
      return expiryValidation;
    }

    // Check if license is not expired
    const expiryDate = new Date(data.licenseExpiry);
    if (expiryDate < new Date()) {
      return { isValid: false, error: 'License has expired' };
    }

    if (!data.vehicleInfo.make.trim()) {
      return { isValid: false, error: 'Vehicle make is required' };
    }

    if (!data.vehicleInfo.model.trim()) {
      return { isValid: false, error: 'Vehicle model is required' };
    }

    const yearNum = parseInt(data.vehicleInfo.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      return { isValid: false, error: 'Please enter a valid vehicle year' };
    }

    const plateValidation = validatePlateNumber(data.vehicleInfo.plateNumber);
    if (!plateValidation.isValid) {
      return plateValidation;
    }

    if (!data.vehicleInfo.registrationNumber.trim()) {
      return { isValid: false, error: 'Vehicle registration number is required' };
    }

    return { isValid: true };
  }

  // Update driver information (for drivers)
  async updateDriverInfo(data: DriverInfoRequest): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    const validation = this.validateDriverInfo(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    try {
      return await apiClient.put<{ message: string }>('/api/kyc/driver-info', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Update driver info error:', error);
      return { success: false, error: 'Failed to update driver information' };
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
      return { success: false, error: 'Failed to upload document' };
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
      return { success: false, error: 'Failed to submit KYC for verification' };
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
      return { success: false, error: 'Failed to check verification status' };
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