
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { merchantService } from '../../services/merchantService';
import { useMerchant } from '../../contexts/MerchantContext';
import { useAlert } from '../../components/AlertProvider';

interface StoreSettings {
  businessHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
  isOpen: boolean;
  acceptsOrders: boolean;
  storeName: string;
  storeDescription: string;
  phoneNumber: string;
  email: string;
  address: string;
  category: string;
}

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const CATEGORIES = [
  'Fuel Station', 'General Store', 'Restaurant', 'Pharmacy', 'Electronics', 'Grocery', 'Other'
];

export default function StoreSettings() {
  const router = useRouter();
  const { merchantId, loadMerchantId } = useMerchant();
  const { showSuccess, showError } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    businessHours: {
      monday: { open: '08:00', close: '18:00', isOpen: true },
      tuesday: { open: '08:00', close: '18:00', isOpen: true },
      wednesday: { open: '08:00', close: '18:00', isOpen: true },
      thursday: { open: '08:00', close: '18:00', isOpen: true },
      friday: { open: '08:00', close: '18:00', isOpen: true },
      saturday: { open: '08:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    deliveryRadius: 5,
    minimumOrder: 1000,
    deliveryFee: 500,
    isOpen: true,
    acceptsOrders: true,
    storeName: '',
    storeDescription: '',
    phoneNumber: '',
    email: '',
    address: '',
    category: 'General Store'
  });

  useEffect(() => {
    loadMerchantId();
  }, [loadMerchantId]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (merchantId) {
      loadStoreSettings();
    }
  }, [merchantId]);

  const loadStoreSettings = async () => {
    try {
      setLoading(true);
      const response = await merchantService.getStoreSettings(merchantId!);
      if (response.success && response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await merchantService.updateStoreSettings(merchantId!, settings);
      if (response.success) {
        showSuccess('Success', 'Store settings updated successfully');
      } else {
        showError('Error', 'Failed to update store settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Error', 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const renderBusinessHoursSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Business Hours</Text>
      {DAYS_OF_WEEK.map(day => (
        <View key={day} style={styles.dayRow}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
            <Switch
              value={settings.businessHours[day].isOpen}
              onValueChange={(value) => updateBusinessHours(day, 'isOpen', value)}
              trackColor={{ false: '#767577', true: '#4682B4' }}
              thumbColor={settings.businessHours[day].isOpen ? '#fff' : '#f4f3f4'}
            />
          </View>
          {settings.businessHours[day].isOpen && (
            <View style={styles.timeInputs}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Open</Text>
                <TextInput
                  style={styles.timeInput}
                  value={settings.businessHours[day].open}
                  onChangeText={(value) => updateBusinessHours(day, 'open', value)}
                  placeholder="08:00"
                />
              </View>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeLabel}>Close</Text>
                <TextInput
                  style={styles.timeInput}
                  value={settings.businessHours[day].close}
                  onChangeText={(value) => updateBusinessHours(day, 'close', value)}
                  placeholder="18:00"
                />
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderStoreInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Store Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Store Name</Text>
        <TextInput
          style={styles.textInput}
          value={settings.storeName}
          onChangeText={(value) => setSettings(prev => ({ ...prev, storeName: value }))}
          placeholder="Enter store name"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={settings.storeDescription}
          onChangeText={(value) => setSettings(prev => ({ ...prev, storeDescription: value }))}
          placeholder="Describe your store"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                settings.category === category && styles.selectedCategoryChip
              ]}
              onPress={() => setSettings(prev => ({ ...prev, category }))}
            >
              <Text style={[
                styles.categoryChipText,
                settings.category === category && styles.selectedCategoryChipText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.textInput}
          value={settings.phoneNumber}
          onChangeText={(value) => setSettings(prev => ({ ...prev, phoneNumber: value }))}
          placeholder="+234 XXX XXX XXXX"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={settings.email}
          onChangeText={(value) => setSettings(prev => ({ ...prev, email: value }))}
          placeholder="store@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={settings.address}
          onChangeText={(value) => setSettings(prev => ({ ...prev, address: value }))}
          placeholder="Enter store address"
          multiline
          numberOfLines={2}
        />
      </View>
    </View>
  );

  const renderDeliverySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Settings</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Delivery Radius (km)</Text>
        <TextInput
          style={styles.textInput}
          value={settings.deliveryRadius.toString()}
          onChangeText={(value) => setSettings(prev => ({ ...prev, deliveryRadius: parseInt(value) || 0 }))}
          placeholder="5"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Minimum Order (₦)</Text>
        <TextInput
          style={styles.textInput}
          value={settings.minimumOrder.toString()}
          onChangeText={(value) => setSettings(prev => ({ ...prev, minimumOrder: parseInt(value) || 0 }))}
          placeholder="1000"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Delivery Fee (₦)</Text>
        <TextInput
          style={styles.textInput}
          value={settings.deliveryFee.toString()}
          onChangeText={(value) => setSettings(prev => ({ ...prev, deliveryFee: parseInt(value) || 0 }))}
          placeholder="500"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  const renderOperationalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Operational Settings</Text>
      
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Store Open</Text>
          <Text style={styles.switchDescription}>
            Controls whether your store appears as open to customers
          </Text>
        </View>
        <Switch
          value={settings.isOpen}
          onValueChange={(value) => setSettings(prev => ({ ...prev, isOpen: value }))}
          trackColor={{ false: '#767577', true: '#4682B4' }}
          thumbColor={settings.isOpen ? '#fff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Accept Orders</Text>
          <Text style={styles.switchDescription}>
            Enable or disable order acceptance from customers
          </Text>
        </View>
        <Switch
          value={settings.acceptsOrders}
          onValueChange={(value) => setSettings(prev => ({ ...prev, acceptsOrders: value }))}
          trackColor={{ false: '#767577', true: '#4682B4' }}
          thumbColor={settings.acceptsOrders ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading store settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Settings</Text>
        <TouchableOpacity 
          onPress={saveSettings} 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStoreInfoSection()}
        {renderBusinessHoursSection()}
        {renderDeliverySection()}
        {renderOperationalSection()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#4682B4',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#333',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  dayRow: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});
