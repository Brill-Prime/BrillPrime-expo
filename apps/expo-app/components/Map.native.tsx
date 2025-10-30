
import React from 'react';
import MapboxGL from '@rnmapbox/maps';

// Configure Mapbox access token - you'll need to set this
MapboxGL.setAccessToken('pk.YOUR_MAPBOX_TOKEN'); // Replace with your actual token

// Export Mapbox components with react-native-maps compatible names
export const Marker = MapboxGL.PointAnnotation;
export const PROVIDER_MAPBOX = 'mapbox';

// Create a wrapper component that matches react-native-maps API
const MapView = React.forwardRef<any, any>((props, ref) => {
  const {
    region,
    initialRegion,
    onRegionChangeComplete,
    style,
    children,
    customMapStyle,
    ...otherProps
  } = props;

  const displayRegion = region || initialRegion;

  return (
    <MapboxGL.MapView
      ref={ref}
      style={style}
      styleURL={customMapStyle || MapboxGL.StyleURL.Street}
      onRegionDidChange={(feature) => {
        if (onRegionChangeComplete) {
          const { geometry } = feature;
          const [longitude, latitude] = geometry.coordinates;
          onRegionChangeComplete({
            latitude,
            longitude,
            latitudeDelta: 0.01, // You might want to calculate this based on zoom
            longitudeDelta: 0.01,
          });
        }
      }}
      {...otherProps}
    >
      {displayRegion && (
        <MapboxGL.Camera
          centerCoordinate={[displayRegion.longitude, displayRegion.latitude]}
          zoomLevel={Math.round(Math.log(360 / displayRegion.latitudeDelta) / Math.LN2)}
          animationMode="flyTo"
          animationDuration={1000}
        />
      )}
      
      {children}
    </MapboxGL.MapView>
  );
});

export default MapView;
