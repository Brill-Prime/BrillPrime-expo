
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
  created: string;
}

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadAddresses();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadAddresses = async () => {
    try {
      const savedAddresses = await AsyncStorage.getItem('savedAddresses');
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
      } else {
        // Load current address as default if no saved addresses
        const currentAddress = await AsyncStorage.getItem('userAddress');
        if (currentAddress) {
          const defaultAddress: Address = {
            id: '1',
            label: 'Current Location',
            address: currentAddress,
            isDefault: true,
            created: new Date().toISOString()
          };
          setAddresses([defaultAddress]);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const saveAddresses = async (updatedAddresses: Address[]) => {
    try {
      await AsyncStorage.setItem('savedAddresses', JSON.stringify(updatedAddresses));
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error saving addresses:', error);
    }
  };

  const handleAddAddress = () => {
    if (!newAddress.label.trim() || !newAddress.address.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    const address: Address = {
      id: Date.now().toString(),
      label: newAddress.label,
      address: newAddress.address,
      isDefault: addresses.length === 0,
      created: new Date().toISOString()
    };

    saveAddresses([...addresses, address]);
    setNewAddress({ label: '', address: '' });
    setShowAddModal(false);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setNewAddress({ label: address.label, address: address.address });
    setShowAddModal(true);
  };

  const handleUpdateAddress = () => {
    if (!editingAddress || !newAddress.label.trim() || !newAddress.address.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    const updatedAddresses = addresses.map(addr =>
      addr.id === editingAddress.id
        ? { ...addr, label: newAddress.label, address: newAddress.address }
        : addr
    );

    saveAddresses(updatedAddresses);
    setEditingAddress(null);
    setNewAddress({ label: '', address: '' });
    setShowAddModal(false);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
            // If deleted address was default, make first remaining address default
            if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
              updatedAddresses[0].isDefault = true;
            }
            saveAddresses(updatedAddresses);
          }
        }
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    // Update user's current address
    const defaultAddress = updatedAddresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      await AsyncStorage.setItem('userAddress', defaultAddress.address);
    }

    saveAddresses(updatedAddresses);
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setEditingAddress(null);
            setNewAddress({ label: '', address: '' });
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#2f75c2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No saved addresses</Text>
              <Text style={styles.emptyStateText}>Add your frequently used addresses for faster checkout</Text>
            </View>
          ) : (
            addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditAddress(address)}
                    >
                      <Ionicons name="create-outline" size={20} color="#2f75c2" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteAddress(address.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.addressText}>{address.address}</Text>
                
                {!address.isDefault && (
                  <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(address.id)}
                  >
                    <Text style={styles.setDefaultText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingAddress ? 'Edit Address' : 'Add Address'}
            </Text>
            <TouchableOpacity
              onPress={editingAddress ? handleUpdateAddress : handleAddAddress}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Label</Text>
              <TextInput
                style={styles.textInput}
                value={newAddress.label}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, label: text }))}
                placeholder="e.g. Home, Office, etc."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newAddress.address}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, address: text }))}
                placeholder="Enter full address"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginRight: 10,
  },
  defaultBadge: {
    backgroundColor: '#2f75c2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2f75c2',
  },
  setDefaultText: {
    fontSize: 12,
    color: '#2f75c2',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
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
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  saveText: {
    fontSize: 16,
    color: '#2f75c2',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
