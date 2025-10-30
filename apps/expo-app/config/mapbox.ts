
// Mapbox Configuration
export const MAPBOX_CONFIG = {
  // You'll need to replace this with your actual Mapbox access token
  ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  
  // Default map styles
  STYLES: {
    STREET: 'mapbox://styles/mapbox/streets-v12',
    SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
    OUTDOORS: 'mapbox://styles/mapbox/outdoors-v12',
    LIGHT: 'mapbox://styles/mapbox/light-v11',
    DARK: 'mapbox://styles/mapbox/dark-v11',
    NAVIGATION_DAY: 'mapbox://styles/mapbox/navigation-day-v1',
    NAVIGATION_NIGHT: 'mapbox://styles/mapbox/navigation-night-v1',
  },
  
  // Default map settings
  DEFAULT_SETTINGS: {
    zoom: 10,
    pitch: 0,
    bearing: 0,
    animationMode: 'flyTo',
    animationDuration: 1000,
  },
  
  // Nigeria-specific settings
  NIGERIA: {
    center: [7.4951, 9.0579], // [longitude, latitude] for Nigeria center
    bounds: [
      [2.6917, 4.2407], // Southwest coordinates [lng, lat]
      [14.5771, 13.8659], // Northeast coordinates [lng, lat]
    ],
  },
};

// Helper function to validate Mapbox token
export const isValidMapboxToken = (token: string): boolean => {
  return token && token.startsWith('pk.') && token.length > 20;
};

// Helper function to get map style URL
export const getMapStyleUrl = (styleName: keyof typeof MAPBOX_CONFIG.STYLES): string => {
  return MAPBOX_CONFIG.STYLES[styleName] || MAPBOX_CONFIG.STYLES.STREET;
};
