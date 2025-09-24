
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface Commodity {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  image: string;
  inStock: boolean;
  createdAt: string;
  merchantId: string;
}

const CATEGORIES = [
  { id: 'petrol', name: 'Petrol', color: '#4682B4' },
  { id: 'lubricant', name: 'Car Lubricant', color: '#4682B4' },
  { id: 'aviation', name: 'Aviation', color: '#4682B4' },
  { id: 'industrial', name: 'Industrial', color: '#4682B4' },
  { id: 'food', name: 'Food & Beverages', color: '#4682B4' },
  { id: 'electronics', name: 'Electronics', color: '#4682B4' },
];

const UNITS = [
  'Litres',
  'Kilograms',
  'Pieces',
  'Boxes',
  'Gallons',
  'Tons',
  'Meters',
  'Grams',
  'Bottles',
  'Packets',
];

export default function AddCommodityScreen() {
  const router = useRouter();
  const { commodityId } = useLocalSearchParams<{ commodityId?: string }>();
  const { showError, showSuccess } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'petrol',
    unit: 'Litres',
    price: '',
    image: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    price: '',
  });

  useEffect(() => {
    if (commodityId) {
      setIsEditing(true);
      loadCommodityForEdit();
    }

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, [commodityId]);

  const loadCommodityForEdit = async () => {
    try {
      setLoading(true);
      const savedCommodities = await AsyncStorage.getItem('merchantCommodities');
      if (savedCommodities) {
        const commodities: Commodity[] = JSON.parse(savedCommodities);
        const commodity = commodities.find(c => c.id === commodityId);
        if (commodity) {
          setFormData({
            name: commodity.name,
            description: commodity.description,
            category: commodity.category,
            unit: commodity.unit,
            price: commodity.price.toString(),
            image: commodity.image,
          });
        }
      }
    } catch (error) {
      console.error('Error loading commodity for edit:', error);
      showError('Error', 'Failed to load commodity details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      description: '',
      price: '',
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Commodity name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Please enter a valid price';
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Camera roll permissions are required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showError('Error', 'Failed to select image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission Required', 'Camera permissions are required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Error', 'Failed to take photo');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: handleTakePhoto },
        { text: 'Gallery', onPress: handleSelectImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      setLoading(true);
      const savedCommodities = await AsyncStorage.getItem('merchantCommodities');
      let commodities: Commodity[] = savedCommodities ? JSON.parse(savedCommodities) : [];

      const price = parseFloat(formData.price);

      if (isEditing && commodityId) {
        // Update existing commodity
        commodities = commodities.map(c =>
          c.id === commodityId
            ? {
                ...c,
                name: formData.name.trim(),
                description: formData.description.trim(),
                category: formData.category,
                unit: formData.unit,
                price: price,
                image: formData.image || c.image,
              }
            : c
        );
        showSuccess('Success', 'Commodity updated successfully');
      } else {
        // Add new commodity
        const newCommodity: Commodity = {
          id: Date.now().toString(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          unit: formData.unit,
          price: price,
          image: formData.image || require('../../assets/images/consumer_order_fuel_icon.png'),
          inStock: true,
          createdAt: new Date().toISOString(),
          merchantId: 'merchant1',
        };

        commodities.push(newCommodity);
        showSuccess('Success', 'Commodity added successfully');
      }

      await AsyncStorage.setItem('merchantCommodities', JSON.stringify(commodities));
      router.back();
    } catch (error) {
      console.error('Error saving commodity:', error);
      showError('Error', 'Failed to save commodity');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  if (loading && isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading commodity details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Commodity' : 'Add New Commodity'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.formContainer, { paddingHorizontal: responsivePadding }]}>
          {/* Category Filter */}
          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    formData.category === category.id && styles.selectedCategoryButton,
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.id })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === category.id && styles.selectedCategoryButtonText,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePickerContainer} onPress={showImageOptions}>
            {formData.image ? (
              <Image 
                source={typeof formData.image === 'string' ? { uri: formData.image } : formData.image}
                style={styles.selectedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="camera" size={40} color="#4682B4" />
                <Text style={styles.imagePickerText}>Add Image</Text>
                <Text style={styles.imagePickerSubtext}>Tap to select from gallery or take photo</Text>
              </View>
            )}
            <View style={styles.imageEditOverlay}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              placeholder="Name of Item *"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                setErrors({ ...errors, name: '' });
              }}
              placeholderTextColor="#B7B7B7"
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, styles.textAreaInput, errors.description && styles.inputError]}
              placeholder="Description *"
              value={formData.description}
              onChangeText={(text) => {
                setFormData({ ...formData, description: text });
                setErrors({ ...errors, description: '' });
              }}
              placeholderTextColor="#B7B7B7"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.charCount}>{formData.description.length}/200</Text>
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Select Unit',
                  'Choose the basic unit for this item',
                  UNITS.map(unit => ({
                    text: unit,
                    onPress: () => setFormData({ ...formData, unit })
                  }))
                );
              }}
            >
              <Text style={[styles.textInput, { color: '#131313' }]}>
                {formData.unit}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#4682B4" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.textInput, errors.price && styles.inputError]}
              placeholder="Price per Item (₦) *"
              value={formData.price}
              onChangeText={(text) => {
                // Allow only numbers and decimal point
                const numericValue = text.replace(/[^0-9.]/g, '');
                setFormData({ ...formData, price: numericValue });
                setErrors({ ...errors, price: '' });
              }}
              placeholderTextColor="#B7B7B7"
              keyboardType="numeric"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Commodity' : 'Save Commodity'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonCircle: {
    width: 24,
    height: 24,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Montserrat-ExtraBold',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  formContainer: {
    paddingBottom: 40,
  },
  categoriesContainer: {
    marginBottom: 30,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4682B4',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#4682B4',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#131313',
    fontFamily: 'Montserrat-Regular',
  },
  selectedCategoryButtonText: {
    color: 'white',
  },
  imagePickerContainer: {
    width: 250,
    height: 250,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4682B4',
    borderStyle: 'dashed',
    alignSelf: 'center',
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 10,
    fontFamily: 'Montserrat-Medium',
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imageEditOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    backgroundColor: 'rgba(70, 130, 180, 0.8)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#4682B4',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    color: '#131313',
    minHeight: 50,
    backgroundColor: 'white',
  },
  textAreaInput: {
    borderRadius: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 16,
    fontFamily: 'Montserrat-Regular',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
    fontFamily: 'Montserrat-Regular',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#4682B4',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    backgroundColor: 'white',
  },
  saveButton: {
    backgroundColor: '#0B1A51',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0B1A51',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
});
