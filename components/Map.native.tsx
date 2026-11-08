import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import type MapboxGLModule from '@rnmapbox/maps';
import type * as ReactNativeMapsModule from 'react-native-maps';

type MapboxGLType = typeof MapboxGLModule;
type ReactNativeMapsType = typeof ReactNativeMapsModule;

const loadMapboxModule = (): MapboxGLType | null => {
  if (!NativeModules.RNMBXModule) {
    console.warn(
      '[Map.native] Mapbox native module is not installed in this app binary; using the native Google Maps fallback. Rebuild with the Mapbox config plugin to enable Mapbox.',
    );
    return null;
  }

  try {
    const mapbox = require('@rnmapbox/maps') as { default?: MapboxGLType } & MapboxGLType;
    return mapbox.default ?? mapbox;
  } catch (error) {
    console.error('[Map.native] Failed to load the linked Mapbox native module:', error);
    return null;
  }
};

const MapboxGL = loadMapboxModule();

const loadReactNativeMapsModule = (): ReactNativeMapsType | null => {
  try {
    return require('react-native-maps') as ReactNativeMapsType;
  } catch (error) {
    console.error('[Map.native] Failed to load the native Google Maps fallback:', error);
    return null;
  }
};

const ReactNativeMaps = MapboxGL ? null : loadReactNativeMapsModule();
const NativeGoogleMapView = ReactNativeMaps?.default;

type Coordinate = { latitude: number; longitude: number };
type Region = Coordinate & { latitudeDelta?: number; longitudeDelta?: number };
type EdgePadding = { top?: number; right?: number; bottom?: number; left?: number };
type MapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (
    coordinates: Coordinate[],
    options?: { edgePadding?: EdgePadding; animated?: boolean },
  ) => void;
};

interface ExtendedMapViewProps {
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  onMapReady?: () => void;
  onError?: (error: Error) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
  style?: React.ComponentProps<typeof MapboxGL.MapView>['style'];
  provider?: string;
  customMapStyle?: unknown;
  showsMyLocationButton?: boolean;
  origin?: Coordinate;
  destination?: Coordinate;
  waypoints?: Coordinate[];
  showRoute?: boolean;
  eta?: string;
  userType?: 'consumer' | 'merchant' | 'driver';
}

interface MarkerProps {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

interface PolylineProps {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  lineJoin?: 'bevel' | 'round' | 'miter';
  lineCap?: 'butt' | 'round' | 'square';
}

const DEFAULT_REGION: Region = {
  latitude: 9.0765,
  longitude: 7.3986,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

const MAP_PROVIDER = MapboxGL ? 'mapbox' : (ReactNativeMaps?.PROVIDER_GOOGLE ?? 'google');
const PROVIDER_GOOGLE = ReactNativeMaps?.PROVIDER_GOOGLE ?? 'google';

const TOKEN = (
  Constants.expoConfig?.extra?.mapboxAccessToken ??
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  ''
).trim();

const regionToZoom = (region: Region) => {
  const delta = region.latitudeDelta;
  return delta && delta > 0 ? Math.max(0, Math.min(22, Math.log2(360 / delta))) : 13;
};

const toRegion = (state: MapboxGLModule.MapState): Region | null => {
  const { center, bounds } = state.properties;
  if (!center || !bounds?.ne || !bounds?.sw) return null;

  return {
    latitude: center[1],
    longitude: center[0],
    latitudeDelta: Math.abs(bounds.ne[1] - bounds.sw[1]),
    longitudeDelta: Math.abs(bounds.ne[0] - bounds.sw[0]),
  };
};

const ExtendedMapView = forwardRef<MapHandle, ExtendedMapViewProps>((props, ref) => {
  const {
    zoomEnabled = true,
    scrollEnabled = true,
    rotateEnabled = true,
    pitchEnabled = true,
    region = DEFAULT_REGION,
    onRegionChangeComplete,
    onMapReady,
    onError,
    showsUserLocation = false,
    children,
    style,
    provider: _provider,
    customMapStyle: _customMapStyle,
    showsMyLocationButton = false,
    origin,
    destination,
    waypoints = [],
    showRoute = false,
    eta: _eta,
    userType: _userType,
    ...mapProps
  } = props;
  const cameraRef = useRef<MapboxGLModule.Camera>(null);
  const nativeMapRef = useRef<React.ElementRef<
    NonNullable<typeof NativeGoogleMapView>
  > | null>(null);
  const lastRegionRef = useRef<Region>(region);
  const [userCoordinate, setUserCoordinate] = useState<Coordinate | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!MapboxGL) {
      setTokenReady(true);
      return () => {
        active = false;
      };
    }

    if (!TOKEN || !TOKEN.startsWith('pk.')) {
      setTokenError(
        'A public Mapbox token is required. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to a token beginning with pk.',
      );
      return () => {
        active = false;
      };
    }

    MapboxGL.setAccessToken(TOKEN)
      .then(() => {
        if (active) {
          setTokenError(null);
          setTokenReady(true);
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Map.native] Failed to configure Mapbox access token:', error);
        if (active) setTokenError(`Mapbox could not be configured: ${message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;

    const previous = lastRegionRef.current;
    const isSignificant =
      Math.abs(region.latitude - previous.latitude) >= 0.0001 ||
      Math.abs(region.longitude - previous.longitude) >= 0.0001 ||
      Math.abs((region.latitudeDelta ?? 0) - (previous.latitudeDelta ?? 0)) >= 0.1 ||
      Math.abs((region.longitudeDelta ?? 0) - (previous.longitudeDelta ?? 0)) >= 0.1;

    if (!isSignificant) return;

    lastRegionRef.current = region;
    cameraRef.current?.setCamera({
      centerCoordinate: [region.longitude, region.latitude],
      zoomLevel: regionToZoom(region),
      animationDuration: 0,
      animationMode: 'moveTo',
    });
  }, [mapReady, region.latitude, region.longitude, region.latitudeDelta, region.longitudeDelta]);

  const animateToRegion = useCallback((nextRegion: Region, duration = 1000) => {
    lastRegionRef.current = nextRegion;
    cameraRef.current?.setCamera({
      centerCoordinate: [nextRegion.longitude, nextRegion.latitude],
      zoomLevel: regionToZoom(nextRegion),
      animationDuration: duration,
      animationMode: 'easeTo',
    });
  }, []);

  const fitToCoordinates = useCallback<MapHandle['fitToCoordinates']>((coordinates, options) => {
    const valid = coordinates.filter(
      ({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude),
    );
    if (valid.length === 0) return;

    if (valid.length === 1) {
      animateToRegion(
        { ...valid[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
        options?.animated === false ? 0 : 1000,
      );
      return;
    }

    const latitudes = valid.map(({ latitude }) => latitude);
    const longitudes = valid.map(({ longitude }) => longitude);
    const north = Math.max(...latitudes);
    const south = Math.min(...latitudes);
    const east = Math.max(...longitudes);
    const west = Math.min(...longitudes);
    const padding = options?.edgePadding;

    cameraRef.current?.fitBounds(
      [east, north],
      [west, south],
      [
        padding?.top ?? 40,
        padding?.right ?? 40,
        padding?.bottom ?? 40,
        padding?.left ?? 40,
      ],
      options?.animated === false ? 0 : 1000,
    );
  }, [animateToRegion]);

  useImperativeHandle(ref, () => ({ animateToRegion, fitToCoordinates }), [
    animateToRegion,
    fitToCoordinates,
  ]);

  const handleMapIdle = useCallback((state: MapboxGLModule.MapState) => {
    const nextRegion = toRegion(state);
    if (!nextRegion) return;
    lastRegionRef.current = nextRegion;
    onRegionChangeComplete?.(nextRegion);
  }, [onRegionChangeComplete]);

  const handleMapReady = useCallback(() => {
    setMapError(null);
    setMapReady(true);
    onMapReady?.();
  }, [onMapReady]);

  const handleMapError = useCallback((payload?: { error: string }) => {
    const message = payload?.error || 'The Mapbox map failed to load.';
    console.error('[Map.native] Mapbox map failed to load:', message);
    setMapError(message);
    onError?.(new Error(message));
  }, [onError]);

  const routeCoordinates = useMemo(
    () => (showRoute && origin && destination ? [origin, ...waypoints, destination] : []),
    [destination, origin, showRoute, waypoints],
  );
  const recenterOnUser = useCallback(() => {
    if (!userCoordinate) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [userCoordinate.longitude, userCoordinate.latitude],
      zoomLevel: 14,
      animationDuration: 500,
      animationMode: 'easeTo',
    });
  }, [userCoordinate]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (nextRegion, duration = 1000) => {
      if (MapboxGL) {
        animateToRegion(nextRegion, duration);
      } else {
        nativeMapRef.current?.animateToRegion({
          ...nextRegion,
          latitudeDelta: nextRegion.latitudeDelta ?? 0.0922,
          longitudeDelta: nextRegion.longitudeDelta ?? 0.0421,
        }, duration);
      }
    },
    fitToCoordinates: (coordinates, options) => {
      if (MapboxGL) {
        fitToCoordinates(coordinates, options);
      } else {
        nativeMapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: {
            top: options?.edgePadding?.top ?? 40,
            right: options?.edgePadding?.right ?? 40,
            bottom: options?.edgePadding?.bottom ?? 40,
            left: options?.edgePadding?.left ?? 40,
          },
          animated: options?.animated,
        });
      }
    },
  }), [animateToRegion, fitToCoordinates]);

  if (!MapboxGL && NativeGoogleMapView) {
    return (
      <View style={[styles.container, style]}>
        <NativeGoogleMapView
          {...mapProps}
          ref={nativeMapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            ...region,
            latitudeDelta: region.latitudeDelta ?? 0.0922,
            longitudeDelta: region.longitudeDelta ?? 0.0421,
          }}
          zoomEnabled={zoomEnabled}
          scrollEnabled={scrollEnabled}
          rotateEnabled={rotateEnabled}
          pitchEnabled={pitchEnabled}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={showsMyLocationButton}
          onRegionChangeComplete={(nextRegion) => onRegionChangeComplete?.(nextRegion)}
          onMapReady={onMapReady}
        >
          {showRoute && origin && destination ? (
            <Polyline
              coordinates={[origin, ...waypoints, destination]}
              strokeColor="#4682B4"
              strokeWidth={5}
            />
          ) : null}
          {children}
        </NativeGoogleMapView>
      </View>
    );
  }

  if (!MapboxGL) {
    return (
      <View style={[styles.messageContainer, style]}>
        <Text style={styles.errorTitle}>Map unavailable</Text>
        <Text style={styles.errorText}>
          This app build does not include a native map provider. Rebuild the app with its native map dependencies.
        </Text>
      </View>
    );
  }

  if (tokenError) {
    return (
      <View style={[styles.messageContainer, style]}>
        <Text style={styles.errorTitle}>Mapbox configuration error</Text>
        <Text style={styles.errorText}>{tokenError}</Text>
      </View>
    );
  }

  if (!tokenReady) {
    return (
      <View style={[styles.messageContainer, style]}>
        <ActivityIndicator color="#4682B4" />
        <Text style={styles.loadingText}>Preparing map…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        {...mapProps}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        zoomEnabled={zoomEnabled}
        scrollEnabled={scrollEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        logoEnabled
        attributionEnabled
        compassEnabled
        onMapIdle={handleMapIdle}
        onDidFinishLoadingMap={handleMapReady}
        onMapLoadingError={handleMapError}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [region.longitude, region.latitude],
            zoomLevel: regionToZoom(region),
          }}
        />
        {showsUserLocation && (
          <MapboxGL.UserLocation
            visible
            onUpdate={({ coords }) =>
              setUserCoordinate({ latitude: coords.latitude, longitude: coords.longitude })
            }
          />
        )}
        {routeCoordinates.length >= 2 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#4682B4" strokeWidth={5} />
        )}
        {children}
      </MapboxGL.MapView>
      {showsMyLocationButton && showsUserLocation && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center map on my location"
          disabled={!userCoordinate}
          onPress={recenterOnUser}
          style={[styles.locationButton, !userCoordinate && styles.locationButtonDisabled]}
        >
          <Ionicons name="locate" size={22} color="#344054" />
        </Pressable>
      )}
      {mapError ? (
        <View pointerEvents="none" style={styles.mapErrorOverlay}>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      ) : null}
    </View>
  );
});

ExtendedMapView.displayName = 'ExtendedMapView';

const Marker: React.FC<MarkerProps> = ({
  coordinate,
  title,
  description: _description,
  pinColor = '#4682B4',
  onPress,
  children,
}) => {
  const [calloutVisible, setCalloutVisible] = useState(false);
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (title || _description) {
      setCalloutVisible((visible) => !visible);
    }
  };
  const content = children ? (
    <View>{children}</View>
  ) : (
    <View style={[styles.marker, { backgroundColor: pinColor }]}>
      <Ionicons name="location-sharp" size={22} color="#fff" />
    </View>
  );

  if (!MapboxGL && ReactNativeMaps) {
    return (
      <ReactNativeMaps.Marker
        coordinate={coordinate}
        title={title}
        description={_description}
        pinColor={pinColor}
        onPress={onPress}
      >
        {children}
      </ReactNativeMaps.Marker>
    );
  }

  if (!MapboxGL) return null;

  return (
    <MapboxGL.MarkerView
      coordinate={[coordinate.longitude, coordinate.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      allowOverlap
    >
      <Pressable onPress={handlePress}>
        {calloutVisible && (title || _description) ? (
          <View pointerEvents="none" style={styles.markerCallout}>
            {title ? <Text style={styles.markerTitle}>{title}</Text> : null}
            {_description ? <Text style={styles.markerDescription}>{_description}</Text> : null}
          </View>
        ) : null}
        {content}
      </Pressable>
    </MapboxGL.MarkerView>
  );
};

const Polyline: React.FC<PolylineProps> = ({
  coordinates,
  strokeColor = '#4682B4',
  strokeWidth = 4,
  lineJoin = 'round',
  lineCap = 'round',
}) => {
  const sourceId = `route-${React.useId().replace(/:/g, '')}`;
  const shape = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    const points = coordinates
      .filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude))
      .map(({ latitude, longitude }) => [longitude, latitude] as [number, number]);
    if (points.length < 2) return null;

    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: points },
    };
  }, [coordinates]);

  if (!shape) return null;

  if (!MapboxGL && ReactNativeMaps) {
    return (
      <ReactNativeMaps.Polyline
        coordinates={coordinates}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        lineJoin={lineJoin}
        lineCap={lineCap}
      />
    );
  }

  if (!MapboxGL) return null;

  return (
    <MapboxGL.ShapeSource id={sourceId} shape={shape}>
      <MapboxGL.LineLayer
        id={`${sourceId}-line`}
        style={{
          lineColor: strokeColor,
          lineWidth: strokeWidth,
          lineJoin,
          lineCap,
        }}
      />
    </MapboxGL.ShapeSource>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  errorTitle: {
    color: '#b42318',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    color: '#7a271a',
    fontSize: 13,
    textAlign: 'center',
  },
  loadingText: {
    color: '#667085',
    fontSize: 13,
    marginTop: 10,
  },
  mapErrorOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#fff',
    elevation: 4,
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  marker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerCallout: {
    position: 'absolute',
    bottom: 40,
    left: -68,
    minWidth: 140,
    maxWidth: 220,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 4,
  },
  markerTitle: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '600',
  },
  markerDescription: {
    color: '#475467',
    fontSize: 11,
    marginTop: 2,
    elevation: 4,
  },
});

export { Marker, Polyline, MAP_PROVIDER, PROVIDER_GOOGLE };

export default ExtendedMapView;
