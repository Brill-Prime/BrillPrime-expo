
import React from 'react';
import { Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Default fallback component
const FallbackMap = ({ children, style, ...props }: any) => {
  return (
    <View 
      style={[
        { 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f0f8ff',
          borderRadius: 15,
          minHeight: 200
        }, 
        style
      ]}
    >
      <Ionicons name="map" size={32} color="#4682B4" />
      <Text style={{ marginTop: 10, color: '#666' }}>Map loading...</Text>
      {children}
    </View>
  );
};

// Export Map component properly
let MapComponent;

try {
  if (Platform.OS === 'web') {
    MapComponent = FallbackMap;
  } else {
    // Try to load native map component
    try {
      const { default: NativeMap } = require('./Map.native');
      MapComponent = NativeMap || FallbackMap;
    } catch {
      MapComponent = FallbackMap;
    }
  }
} catch (error) {
  console.warn('Map component error:', error);
  MapComponent = FallbackMap;
}

export default MapComponent;
export { FallbackMap };

// Named exports for compatibility
export const MapView = MapComponent;
export const PROVIDER_GOOGLE = 'google';
export const Marker = ({ children, ...props }: any) => children;

const FallbackMarker = ({ children }: any) => children;

// Platform-specific Map exports
let MapComponent: any = FallbackMap;
let ProviderGoogle: any = 'web';
let MarkerComponent: any = FallbackMarker;

if (Platform.OS === 'web') {
  try {
    const WebMapModule = require('./Map.web');
    MapComponent = WebMapModule.default || WebMapModule.MapWeb || FallbackMap;
    ProviderGoogle = WebMapModule.PROVIDER_GOOGLE || 'web';
    MarkerComponent = WebMapModule.Marker || FallbackMarker;
  } catch (error) {
    console.warn('Web Map component failed to load, using fallback:', error);
  }
} else {
  try {
    const NativeMapModule = require('./Map.native');
    MapComponent = NativeMapModule.default || FallbackMap;
    ProviderGoogle = NativeMapModule.PROVIDER_GOOGLE || 'google';
    MarkerComponent = NativeMapModule.Marker || FallbackMarker;
  } catch (error) {
    console.warn('Native Map component failed to load, using web fallback:', error);
    try {
      const WebMapModule = require('./Map.web');
      MapComponent = WebMapModule.default || WebMapModule.MapWeb || FallbackMap;
      ProviderGoogle = 'web';
      MarkerComponent = WebMapModule.Marker || FallbackMarker;
    } catch (webError) {
      console.warn('Fallback to web map also failed:', webError);
    }
  }
}

// Enhanced Map component with live tracking and store locator
const EnhancedMap = React.memo(React.forwardRef<any, any>((props, ref) => {
  const {
    enableLiveTracking,
    trackingUserId,
    onLiveLocationUpdate,
    enableStoreLocator,
    storeLocations = [],
    onLocationSelect,
    markers = [],
    ...otherProps
  } = props;

  const [liveMarkers, setLiveMarkers] = React.useState<any[]>([]);
  const [clusteredMarkers, setClustered] = React.useState<any[]>([]);
  const trackingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Live tracking effect
  React.useEffect(() => {
    if (enableLiveTracking && trackingUserId) {
      const startTracking = async () => {
        try {
          const { locationService } = require('../services/locationService');
          
          trackingIntervalRef.current = setInterval(async () => {
            const response = await locationService.getLiveLocation(trackingUserId);
            if (response.success && response.data) {
              const newMarker = {
                coordinate: {
                  latitude: response.data.latitude,
                  longitude: response.data.longitude,
                },
                title: 'Live Location',
                description: 'Updated just now',
                isLive: true,
              };
              
              setLiveMarkers([newMarker]);
              
              if (onLiveLocationUpdate) {
                onLiveLocationUpdate(response.data);
              }
            }
          }, 5000); // Update every 5 seconds
        } catch (error) {
          console.error('Live tracking error:', error);
        }
      };

      startTracking();
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [enableLiveTracking, trackingUserId, onLiveLocationUpdate]);

  // Marker clustering effect
  React.useEffect(() => {
    const allMarkers = [...markers, ...liveMarkers];
    
    if (enableStoreLocator && storeLocations.length > 0) {
      const storeMarkers = storeLocations.map((store: any) => ({
        coordinate: {
          latitude: store.coords?.lat || store.latitude,
          longitude: store.coords?.lng || store.longitude,
        },
        title: store.title || store.name,
        description: store.address,
        isStore: true,
        onPress: () => onLocationSelect?.(store),
      }));
      
      allMarkers.push(...storeMarkers);
    }

    // Simple clustering logic for performance
    if (allMarkers.length > 20) {
      const clustered = performClustering(allMarkers);
      setClustered(clustered);
    } else {
      setClustered(allMarkers);
    }
  }, [markers, liveMarkers, storeLocations, enableStoreLocator, onLocationSelect]);

  const performClustering = (markers: any[]) => {
    // Simple grid-based clustering
    const clusters: { [key: string]: any[] } = {};
    const gridSize = 0.01; // Approximate clustering distance
    
    markers.forEach(marker => {
      const gridX = Math.floor(marker.coordinate.latitude / gridSize);
      const gridY = Math.floor(marker.coordinate.longitude / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(marker);
    });

    return Object.values(clusters).map(clusterMarkers => {
      if (clusterMarkers.length === 1) {
        return clusterMarkers[0];
      }
      
      // Create cluster marker
      const avgLat = clusterMarkers.reduce((sum, m) => sum + m.coordinate.latitude, 0) / clusterMarkers.length;
      const avgLng = clusterMarkers.reduce((sum, m) => sum + m.coordinate.longitude, 0) / clusterMarkers.length;
      
      return {
        coordinate: { latitude: avgLat, longitude: avgLng },
        title: `${clusterMarkers.length} locations`,
        description: 'Clustered markers',
        isCluster: true,
        clusterSize: clusterMarkers.length,
        clusterMarkers,
      };
    });
  };

  return React.createElement(MapComponent, {
    ref,
    ...otherProps,
    children: [
      props.children,
      ...clusteredMarkers.map((marker, index) => 
        React.createElement(MarkerComponent, {
          key: `marker-${index}`,
          coordinate: marker.coordinate,
          title: marker.title,
          description: marker.description,
          pinColor: marker.isLive ? '#00ff00' : marker.isStore ? '#ff0000' : '#007bff',
          onPress: marker.onPress,
        }, marker.isCluster ? React.createElement(
          require('react-native').View,
          {
            style: {
              backgroundColor: '#007bff',
              borderRadius: 15,
              width: 30,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center',
            }
          },
          React.createElement(
            require('react-native').Text,
            { style: { color: 'white', fontSize: 12, fontWeight: 'bold' } },
            marker.clusterSize.toString()
          )
        ) : null)
      )
    ]
  });
}));

// Ensure we always export valid components
const SafeMapComponent = EnhancedMap;
const SafeMarkerComponent = React.memo(MarkerComponent);

export default SafeMapComponent;
export const PROVIDER_GOOGLE = ProviderGoogle;
export const Marker = SafeMarkerComponent;
