declare module 'react-native-maps' {
    import React from 'react';
    import { ViewStyle } from 'react-native';

    export interface LatLng {
        latitude: number;
        longitude: number;
    }

    export interface Region {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    }

    export interface MarkerProps {
        coordinate: LatLng;
        title?: string;
        description?: string;
        children?: React.ReactNode;
    }

    export interface PolylineProps {
        coordinates: LatLng[];
        strokeColor?: string;
        strokeWidth?: number;
    }

    export interface MapViewProps {
        style?: ViewStyle;
        region?: Region;
        onRegionChange?: (region: Region) => void;
        showsUserLocation?: boolean;
        children?: React.ReactNode;
    }

    export const MapView: React.ComponentType<MapViewProps>;
    export const Marker: React.ComponentType<MarkerProps>;
    export const Polyline: React.ComponentType<PolylineProps>;
}
