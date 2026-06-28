import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface LocationSetupCardProps {
  isLoadingLocation: boolean;
  onSetAutomatically: () => void;
  onSetLater: () => void;
}

const LocationSetupCard: React.FC<LocationSetupCardProps> = ({
  isLoadingLocation,
  onSetAutomatically,
  onSetLater,
}) => {
  return (
    <View style={styles.bottomCard}>
      <View style={styles.locationIconContainer}>
        <View style={styles.locationIconInner}>
          <View style={styles.globeIcon}>
            {/* Add globe/location icon */}
          </View>
        </View>
      </View>
      <Text style={styles.whereAreYouText}>Where are you?</Text>
      <Text style={styles.descriptionText}>
        We need your location to show nearby merchants and provide accurate delivery services.
      </Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.setAutomaticallyButton}
          onPress={onSetAutomatically}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.setAutomaticallyText}>Set Location Automatically</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.setLaterButton} onPress={onSetLater}>
          <Text style={styles.setLaterText}>Set Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  locationIconContainer: {
    position: 'absolute',
    top: -30,
    width: 80,
    height: 80,
    backgroundColor: '#4682B4',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  locationIconInner: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeIcon: {
    width: 25,
    height: 25,
  },
  whereAreYouText: {
    color: '#0B1A51',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
  },
  descriptionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '200',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  setAutomaticallyButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4682B4',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setAutomaticallyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  setLaterButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#4682B4',
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLaterText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LocationSetupCard;
