
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';
import * as Location from 'expo-location';
import { profileService } from '../../services/profileService';
import { validateAddress } from '../../utils/addressValidation';

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export default function AddressesScreen() {
  const router = useRouter();
  const { showSuccess, showError, showConfirmDialog } = useAlert();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postalCode: '',
    isDefault: false,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await profileService.getAddresses();
      
      if (response.success && response.data) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      showError('Error', 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (geocoded.length > 0) {
        const address = geocoded[0];
        setFormData(prev => ({
          ...prev,
          street: `${address.street || ''} ${address.name || ''}`.trim(),
          city: address.city || address.subregion || '',
          state: address.region || '',
          country: address.country || 'Nigeria',
          postalCode: address.postalCode || '',
          latitude,
          longitude,
        }));
        
        showSuccess('Location Found', 'Address auto-filled from your location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      showError('Error', 'Failed to get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSaveAddress = async () => {
    // Validate form
    const validation = validateAddress(
      `${formData.street}, ${formData.city}, ${formData.state}`
    );
    
    if (!validation.isValid) {
      showError('Validation Error', validation.error || 'Please fill all required fields');
      return;
    }

    if (!formData.label.trim()) {
      showError('Validation Error', 'Please enter a label for this address');
      return;
    }

    try {
      setLoading(true);
      
      const addressData = {
        label: formData.label,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        isDefault: formData.isDefault,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      let response;
      if (editingAddress) {
        response = await profileService.updateAddress(editingAddress.id.toString(), addressData);
      } else {
        response = await profileService.addAddress(addressData);
      }

      if (response.success) {
        showSuccess('Success', `Address ${editingAddress ? 'updated' : 'added'} successfully`);
        setShowAddForm(false);
        setEditingAddress(null);
        resetForm();
        await loadAddresses();
      } else {
        showError('Error', response.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      showError('Error', 'Failed to save address');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
      latitude: address.latitude,
      longitude: address.longitude,
    });
    setShowAddForm(true);
  };

  const handleDeleteAddress = (address: Address) => {
    showConfirmDialog(
      'Delete Address',
      `Are you sure you want to delete "${address.label}"?`,
      async () => {
        try {
          setLoading(true);
          const response = await profileService.deleteAddress(address.id.toString());
          
          if (response.success) {
            showSuccess('Success', 'Address deleted successfully');
            await loadAddresses();
          } else {
            showError('Error', response.error || 'Failed to delete address');
          }
        } catch (error) {
          console.error('Error deleting address:', error);
          showError('Error', 'Failed to delete address');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSetDefault = async (address: Address) => {
    try {
      setLoading(true);
      const response = await profileService.updateAddress(address.id.toString(), {
        ...address,
        isDefault: true,
      });
      
      if (response.success) {
        showSuccess('Success', 'Default address updated');
        await loadAddresses();
      } else {
        showError('Error', response.error || 'Failed to update default address');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      showError('Error', 'Failed to update default address');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postalCode: '',
      isDefault: false,
      latitude: undefined,
      longitude: undefined,
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAddress(null);
    resetForm();
  };

  if (loading && addresses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading addresses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {showAddForm ? (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Label *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Home, Office, School"
                value={formData.label}
                onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
              />
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color="#4682B4" />
              ) : (
                <Ionicons name="location" size={20} color="#4682B4" />
              )}
              <Text style={styles.locationButtonText}>
                {gettingLocation ? 'Getting location...' : 'Use Current Location'}
              </Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter street address"
                value={formData.street}
                onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  value={formData.state}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Country *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  value={formData.country}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Postal Code"
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, postalCode: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
            >
              <Ionicons
                name={formData.isDefault ? 'checkbox' : 'square-outline'}
                size={24}
                color="#4682B4"
              />
              <Text style={styles.checkboxLabel}>Set as default address</Text>
            </TouchableOpacity>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveAddress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingAddress ? 'Update' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Addresses</Text>
            <Text style={styles.emptyText}>
              Add your first address to make ordering easier
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addFirstButtonText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTitleRow}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleEditAddress(address)}
                    >
                      <Ionicons name="create-outline" size={20} color="#4682B4" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteAddress(address)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.addressText}>
                  {address.street}
                </Text>
                <Text style={styles.addressText}>
                  {address.city}, {address.state} {address.postalCode}
                </Text>
                <Text style={styles.addressText}>
                  {address.country}
                </Text>

                {!address.isDefault && (
                  <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(address)}
                  >
                    <Text style={styles.setDefaultButtonText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4682B4',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    gap: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4682B4',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addressesList: {
    gap: 15,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    padding: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  setDefaultButton: {
    marginTop: 12,
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  setDefaultButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4682B4',
  },
});
