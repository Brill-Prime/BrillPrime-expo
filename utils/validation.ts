import { Alert } from 'react-native';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

// International phone number validation
export const validatePhone = (phone: string, country: string = 'NG'): { isValid: boolean; error?: string } => {
  if (!phone.trim()) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Country-specific validation
  const phonePatterns: Record<string, { regex: RegExp; format: string }> = {
    'NG': {
      regex: /^(\+234|234|0)[7-9][0-1]\d{8}$/,
      format: '+234XXXXXXXXXX or 0XXXXXXXXXX'
    },
    'US': {
      regex: /^(\+1|1)?[2-9]\d{9}$/,
      format: '+1XXXXXXXXXX or XXXXXXXXXX'
    },
    'GB': {
      regex: /^(\+44|44|0)[1-9]\d{9,10}$/,
      format: '+44XXXXXXXXXX or 0XXXXXXXXXX'
    },
    'GH': {
      regex: /^(\+233|233|0)[2-5]\d{8}$/,
      format: '+233XXXXXXXXX or 0XXXXXXXXX'
    },
    'KE': {
      regex: /^(\+254|254|0)[17]\d{8}$/,
      format: '+254XXXXXXXXX or 0XXXXXXXXX'
    },
  };

  const pattern = phonePatterns[country] || phonePatterns['NG'];

  if (!pattern.regex.test(cleanPhone)) {
    return {
      isValid: false,
      error: `Invalid phone number. Format: ${pattern.format}`
    };
  }

  return { isValid: true };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string, country: string = 'NG'): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  if (country === 'NG') {
    if (cleanPhone.startsWith('+234')) {
      const number = cleanPhone.slice(4);
      return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    } else if (cleanPhone.startsWith('0')) {
      return `0${cleanPhone.slice(1, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7)}`;
    }
  }

  return phone;
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (!/[@$!%*?&#]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (@$!%*?&#)' };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string, fieldName: string = 'Name'): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} must not exceed 50 characters` };
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { isValid: true };
};

// Address validation
export const validateAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }

  if (address.trim().length < 10) {
    return { isValid: false, error: 'Please enter a complete address (at least 10 characters)' };
  }

  if (address.trim().length > 200) {
    return { isValid: false, error: 'Address is too long (maximum 200 characters)' };
  }

  return { isValid: true };
};

// Business name validation
export const validateBusinessName = (name: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Business name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Business name must be at least 2 characters long' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Business name must not exceed 100 characters' };
  }

  return { isValid: true };
};

// Number validation
export const validateNumber = (
  value: string,
  fieldName: string,
  options: { min?: number; max?: number; allowDecimals?: boolean } = {}
): { isValid: boolean; error?: string } => {
  if (!value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const regex = options.allowDecimals ? /^\d+(\.\d+)?$/ : /^\d+$/;
  if (!regex.test(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  const numValue = parseFloat(value);

  if (options.min !== undefined && numValue < options.min) {
    return { isValid: false, error: `${fieldName} must be at least ${options.min}` };
  }

  if (options.max !== undefined && numValue > options.max) {
    return { isValid: false, error: `${fieldName} must not exceed ${options.max}` };
  }

  return { isValid: true };
};

// Date validation (YYYY-MM-DD format)
export const validateDate = (date: string, fieldName: string = 'Date'): { isValid: boolean; error?: string } => {
  if (!date.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }

  return { isValid: true };
};

// Age validation (for date of birth)
export const validateAge = (dateOfBirth: string, minAge: number = 18): { isValid: boolean; error?: string } => {
  const dateValidation = validateDate(dateOfBirth, 'Date of birth');
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < minAge) {
    return { isValid: false, error: `You must be at least ${minAge} years old` };
  }

  if (age > 120) {
    return { isValid: false, error: 'Please enter a valid date of birth' };
  }

  return { isValid: true };
};

// Bank account number validation
export const validateAccountNumber = (accountNumber: string): { isValid: boolean; error?: string } => {
  if (!accountNumber.trim()) {
    return { isValid: false, error: 'Account number is required' };
  }

  const cleanNumber = accountNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(cleanNumber)) {
    return { isValid: false, error: 'Account number must contain only digits' };
  }

  if (cleanNumber.length !== 10) {
    return { isValid: false, error: 'Account number must be 10 digits' };
  }

  return { isValid: true };
};

// BVN validation
export const validateBVN = (bvn: string): { isValid: boolean; error?: string } => {
  if (!bvn.trim()) {
    return { isValid: false, error: 'BVN is required' };
  }

  const cleanBVN = bvn.replace(/\s/g, '');

  if (!/^\d+$/.test(cleanBVN)) {
    return { isValid: false, error: 'BVN must contain only digits' };
  }

  if (cleanBVN.length !== 11) {
    return { isValid: false, error: 'BVN must be 11 digits' };
  }

  return { isValid: true };
};

// License number validation
export const validateLicenseNumber = (licenseNumber: string): { isValid: boolean; error?: string } => {
  if (!licenseNumber.trim()) {
    return { isValid: false, error: 'License number is required' };
  }

  if (licenseNumber.trim().length < 5) {
    return { isValid: false, error: 'License number must be at least 5 characters' };
  }

  if (licenseNumber.trim().length > 20) {
    return { isValid: false, error: 'License number must not exceed 20 characters' };
  }

  return { isValid: true };
};

// Vehicle plate number validation
export const validatePlateNumber = (plateNumber: string): { isValid: boolean; error?: string } => {
  if (!plateNumber.trim()) {
    return { isValid: false, error: 'Plate number is required' };
  }

  const cleanPlate = plateNumber.trim().toUpperCase();

  // Nigerian plate format: ABC-123-DE or ABC123DE
  const plateRegex = /^[A-Z]{3}[-]?\d{3}[-]?[A-Z]{2}$/;
  if (!plateRegex.test(cleanPlate)) {
    return { isValid: false, error: 'Please enter a valid plate number (e.g., ABC-123-DE)' };
  }

  return { isValid: true };
};

// Order quantity validation
export const validateOrderQuantity = (
  quantity: string,
  min: number = 1,
  max: number = 1000
): { isValid: boolean; error?: string } => {
  const numValidation = validateNumber(quantity, 'Quantity', { min, max, allowDecimals: true });

  if (!numValidation.isValid) {
    return numValidation;
  }

  return { isValid: true };
};

// Price validation
export const validatePrice = (price: string): { isValid: boolean; error?: string } => {
  if (!price.trim()) {
    return { isValid: false, error: 'Price is required' };
  }

  const numValidation = validateNumber(price, 'Price', { min: 0.01, allowDecimals: true });

  return numValidation;
};

// Description validation
export const validateDescription = (
  description: string,
  minLength: number = 10,
  maxLength: number = 500
): { isValid: boolean; error?: string } => {
  if (!description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }

  if (description.trim().length < minLength) {
    return { isValid: false, error: `Description must be at least ${minLength} characters` };
  }

  if (description.trim().length > maxLength) {
    return { isValid: false, error: `Description must not exceed ${maxLength} characters` };
  }

  return { isValid: true };
};

// URL validation
export const validateURL = (url: string): { isValid: boolean; error?: string } => {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

// Form validation helper
export const validateForm = (
  validations: Array<{ isValid: boolean; error?: string }>
): ValidationResult => {
  const errors: ValidationError[] = [];

  validations.forEach((validation, index) => {
    if (!validation.isValid && validation.error) {
      errors.push({
        field: `field_${index}`,
        message: validation.error,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Show validation errors
export const showValidationErrors = (errors: ValidationError[]): void => {
  if (errors.length === 0) return;

  const errorMessages = errors.map(e => e.message).join('\n');
  Alert.alert('Validation Error', errorMessages);
};

// Card number validation
export const validateCardNumber = (cardNumber: string): { isValid: boolean; error?: string } => {
  if (!cardNumber.trim()) {
    return { isValid: false, error: 'Card number is required' };
  }

  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Check if it contains only digits
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: 'Card number must contain only digits' };
  }

  // Check length (13-19 digits for most cards)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false, error: 'Card number must be between 13 and 19 digits' };
  }

  // Luhn algorithm validation
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { isValid: false, error: 'Invalid card number (Luhn check failed)' };
  }

  return { isValid: true };
};

// CVV validation
export const validateCVV = (cvv: string): { isValid: boolean; error?: string } => {
  if (!cvv.trim()) {
    return { isValid: false, error: 'CVV is required' };
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    return { isValid: false, error: 'CVV must be 3 or 4 digits' };
  }

  return { isValid: true };
};

// Expiry date validation
export const validateExpiryDate = (expiry: string): { isValid: boolean; error?: string } => {
  if (!expiry.trim()) {
    return { isValid: false, error: 'Expiry date is required' };
  }

  // Format: MM/YY or MM/YYYY
  const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
  if (!expiryRegex.test(expiry)) {
    return { isValid: false, error: 'Expiry date must be in MM/YY or MM/YYYY format' };
  }

  const [month, year] = expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const expiryYear = year.length === 2
    ? 2000 + parseInt(year, 10)
    : parseInt(year, 10);
  const expiryMonth = parseInt(month, 10);

  if (expiryYear < currentYear) {
    return { isValid: false, error: 'Expiry year cannot be in the past' };
  }

  if (expiryYear === currentYear && expiryMonth < currentMonth) {
    return { isValid: false, error: 'Expiry month cannot be in the past for the current year' };
  }

  return { isValid: true };
};