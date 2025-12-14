import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const theme = {
  colors: {
    primary: '#4682B4',
    white: '#fff',
    success: '#00C853',
    error: '#e74c3c',
  },
  shadows: {
    small: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {},
    }),
    medium: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {},
    }),
  },
};

interface UserMarkerProps {
  isMoving?: boolean;
  heading?: number;
}

export const UserMarker: React.FC<UserMarkerProps> = ({ isMoving, heading }) => (
  <View
    style={[
      styles.userLocationPin,
      isMoving && heading && { transform: [{ rotate: `${heading}deg` }] },
    ]}
  >
    <View style={styles.pinTop}>
      <Ionicons name="person" size={16} color={theme.colors.white} />
    </View>
    <View style={styles.pinPoint} />
    <View style={styles.pinShadow} />
  </View>
);

interface MerchantMarkerProps {
  category?: string;
}

export const MerchantMarker: React.FC<MerchantMarkerProps> = ({ category }) => (
  <View style={styles.merchantMarker}>
    <View style={styles.merchantMarkerIcon}>
      <Ionicons name="storefront" size={20} color={theme.colors.white} />
    </View>
  </View>
);

interface DriverMarkerProps {
  status?: 'available' | 'busy' | 'offline';
}

export const DriverMarker: React.FC<DriverMarkerProps> = ({ status = 'available' }) => (
  <View style={styles.driverMarker}>
    <View style={styles.driverMarkerIcon}>
      <Ionicons name="car" size={18} color={theme.colors.white} />
    </View>
    <View
      style={[
        styles.statusIndicator,
        {
          backgroundColor:
            status === 'available'
              ? theme.colors.success
              : status === 'busy'
              ? '#FFA500'
              : theme.colors.error,
        },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  // User Location Marker - 3D Pin Style
  userLocationPin: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 50,
    height: 60,
    zIndex: 200,
    position: 'relative',
  },
  pinTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
    ...theme.shadows.medium,
    ...(Platform.OS === 'ios' && {
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.4,
    }),
    ...(Platform.OS === 'android' && {
      elevation: 8,
    }),
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.primary,
    marginTop: -2,
  },
  pinShadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: 2,
  },

  // Merchant Marker
  merchantMarker: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 8,
    ...theme.shadows.small,
    zIndex: 50,
    position: 'relative',
  },
  merchantMarkerIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Driver Marker
  driverMarker: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 8,
    ...theme.shadows.small,
    zIndex: 100,
    position: 'relative',
  },
  driverMarkerIcon: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
});
