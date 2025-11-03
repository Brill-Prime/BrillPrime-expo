
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapProps {
  location?: Location;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  }>;
  onLocationSelect?: (location: Location) => void;
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: any) => void;
  children?: React.ReactNode;
}

export default function MapWeb({ location, markers = [], onLocationSelect, style, region, onRegionChangeComplete }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLeaflet, setUseLeaflet] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
        
        // Check if Mapbox token is available and valid
        if (mapboxToken && mapboxToken.startsWith('pk.') && mapboxToken.length > 20) {
          // Try to use Mapbox
          try {
            const mapboxgl = await import('mapbox-gl');
            await import('mapbox-gl/dist/mapbox-gl.css');
            
            mapboxgl.default.accessToken = mapboxToken;

            mapInstance.current = new mapboxgl.default.Map({
              container: mapContainer.current!,
              style: 'mapbox://styles/mapbox/streets-v12',
              center: [
                region?.longitude || location?.longitude || 0,
                region?.latitude || location?.latitude || 0
              ],
              zoom: region?.latitudeDelta ? Math.log2(360 / region.latitudeDelta) : 13,
            });

            mapInstance.current.on('load', () => {
              setIsLoading(false);
            });

            mapInstance.current.on('error', (e: any) => {
              console.error('Mapbox error:', e);
              throw new Error('Mapbox failed to load');
            });

            // Add click handler
            if (onLocationSelect) {
              mapInstance.current.on('click', (e: any) => {
                onLocationSelect({
                  latitude: e.lngLat.lat,
                  longitude: e.lngLat.lng,
                });
              });
            }

            // Add markers
            markers.forEach((marker) => {
              if (mapInstance.current) {
                new mapboxgl.default.Marker()
                  .setLngLat([marker.longitude, marker.latitude])
                  .setPopup(
                    new mapboxgl.default.Popup().setHTML(
                      `<h3>${marker.title || ''}</h3><p>${marker.description || ''}</p>`
                    )
                  )
                  .addTo(mapInstance.current);
              }
            });

            // Add navigation controls
            mapInstance.current.addControl(new mapboxgl.default.NavigationControl());

            return;
          } catch (mapboxError) {
            console.warn('Mapbox failed, falling back to Leaflet:', mapboxError);
          }
        }

        // Fallback to Leaflet with OpenStreetMap
        console.log('Using Leaflet with OpenStreetMap as map provider');
        setUseLeaflet(true);
        setError(null); // Clear error since we have a working fallback
        
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix for default marker icon
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        mapInstance.current = L.map(mapContainer.current!, {
          center: [
            region?.latitude || location?.latitude || 0,
            region?.longitude || location?.longitude || 0
          ],
          zoom: region?.latitudeDelta ? Math.log2(360 / region.latitudeDelta) : 13,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        // Add markers
        markers.forEach((marker) => {
          if (mapInstance.current) {
            const leafletMarker = L.marker([marker.latitude, marker.longitude])
              .addTo(mapInstance.current);
            
            if (marker.title || marker.description) {
              leafletMarker.bindPopup(`
                <h3>${marker.title || ''}</h3>
                <p>${marker.description || ''}</p>
              `);
            }
          }
        });

        // Add click handler
        if (onLocationSelect) {
          mapInstance.current.on('click', (e: any) => {
            onLocationSelect({
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            });
          });
        }

        setIsLoading(false);

      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map. Please check your internet connection.');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        if (mapInstance.current.remove) {
          mapInstance.current.remove();
        }
      }
    };
  }, [location, markers, onLocationSelect, region]);

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B1A51" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>
            {!process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.length < 20
              ? 'No Mapbox token found. Add EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file. Using fallback map.'
              : 'Using OpenStreetMap as fallback. For better performance, ensure you have a valid Mapbox token.'}
          </Text>
        </View>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

export const PROVIDER_MAPBOX = 'mapbox';
export const Marker = ({ coordinate, title, description }: any) => null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0B1A51',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
