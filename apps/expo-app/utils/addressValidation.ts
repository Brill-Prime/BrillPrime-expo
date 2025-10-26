
import * as Location from 'expo-location';

export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export const validateAddressWithGeolocation = async (
  address: string
): Promise<AddressValidationResult> => {
  if (!address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }

  if (address.trim().length < 10) {
    return { isValid: false, error: 'Please enter a complete address (at least 10 characters)' };
  }

  try {
    // Geocode the address to validate it
    const geocoded = await Location.geocodeAsync(address);
    
    if (geocoded.length === 0) {
      return { isValid: false, error: 'Could not verify this address. Please check and try again.' };
    }

    const { latitude, longitude } = geocoded[0];
    
    // Verify the address is within reasonable bounds (e.g., Nigeria)
    const isInNigeria = 
      latitude >= 4.0 && latitude <= 14.0 && 
      longitude >= 2.5 && longitude <= 15.0;

    if (!isInNigeria) {
      return { 
        isValid: false, 
        error: 'Address appears to be outside Nigeria. Please verify.',
        coordinates: { latitude, longitude }
      };
    }

    return { 
      isValid: true, 
      coordinates: { latitude, longitude }
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    // If geocoding fails, still allow the address but warn the user
    return { 
      isValid: true, 
      error: 'Could not verify address location, but it will be saved.'
    };
  }
};

export const formatNigerianAddress = (address: string): string => {
  // Remove excessive whitespace
  let formatted = address.replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter of each word
  formatted = formatted.replace(/\b\w/g, char => char.toUpperCase());
  
  return formatted;
};
