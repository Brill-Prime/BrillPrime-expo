
import * as Location from 'expo-location';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  formattedAddress?: string;
  placeId?: string;
  addressComponents?: AddressComponent[];
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Validate address using Google Places API
export const validateAddressWithGooglePlaces = async (
  address: string
): Promise<AddressValidationResult> => {
  if (!address.trim()) {
    return { isValid: false, error: 'Address is required' };
  }

  if (address.trim().length < 10) {
    return { isValid: false, error: 'Please enter a complete address (at least 10 characters)' };
  }

  try {
    // Use Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;

      // Check if address is in Nigeria
      const isInNigeria = 
        lat >= 4.0 && lat <= 14.0 && 
        lng >= 2.5 && lng <= 15.0;

      if (!isInNigeria) {
        return {
          isValid: false,
          error: 'Address appears to be outside Nigeria. Please verify.',
          coordinates: { latitude: lat, longitude: lng }
        };
      }

      return {
        isValid: true,
        coordinates: { latitude: lat, longitude: lng },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components
      };
    } else {
      return { isValid: false, error: 'Could not verify this address. Please check and try again.' };
    }
  } catch (error) {
    console.error('Google Places validation error:', error);
    // Fallback to basic geocoding
    return validateAddressWithGeolocation(address);
  }
};

// Fallback geocoding using Expo Location
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
    const geocoded = await Location.geocodeAsync(address);
    
    if (geocoded.length === 0) {
      return { isValid: false, error: 'Could not verify this address. Please check and try again.' };
    }

    const { latitude, longitude } = geocoded[0];
    
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
    return { 
      isValid: true, 
      error: 'Could not verify address location, but it will be saved.'
    };
  }
};

// Get address suggestions using Google Places Autocomplete
export const getAddressSuggestions = async (
  input: string,
  country: string = 'ng'
): Promise<PlaceSuggestion[]> => {
  if (!input || input.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:${country}&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK') {
      return data.predictions;
    }

    return [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
};

// Get place details by place ID
export const getPlaceDetails = async (
  placeId: string
): Promise<AddressValidationResult> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      const result = data.result;
      const { lat, lng } = result.geometry.location;

      return {
        isValid: true,
        coordinates: { latitude: lat, longitude: lng },
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components
      };
    }

    return { isValid: false, error: 'Could not get place details' };
  } catch (error) {
    console.error('Error fetching place details:', error);
    return { isValid: false, error: 'Failed to get place details' };
  }
};

export const formatNigerianAddress = (address: string): string => {
  let formatted = address.replace(/\s+/g, ' ').trim();
  formatted = formatted.replace(/\b\w/g, char => char.toUpperCase());
  return formatted;
};
