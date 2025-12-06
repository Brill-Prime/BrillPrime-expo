import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Export for iOS and Android - uses Google Maps
export { Marker, PROVIDER_GOOGLE };

// Extend MapView props to include route directions props
interface ExtendedMapViewProps extends React.ComponentProps<typeof MapView> {
    // Route directions props (for web compatibility)
    origin?: { latitude: number; longitude: number };
    destination?: { latitude: number; longitude: number };
    waypoints?: Array<{ latitude: number; longitude: number }>;
    showRoute?: boolean;
    eta?: string;
    userType?: 'consumer' | 'merchant' | 'driver';
}

const ExtendedMapView: React.FC<ExtendedMapViewProps> = (props) => {
    // Filter out web-specific props
    const {
        origin,
        destination,
        waypoints,
        showRoute,
        eta,
        userType,
        ...mapViewProps
    } = props;

    return <MapView {...mapViewProps} />;
};

export default ExtendedMapView;