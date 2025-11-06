import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';
import * as ImagePicker from 'expo-image-picker';
import { 
  validateCommodityForm, 
  COMMODITY_CATEGORIES, 
  COMMODITY_UNITS,
} from '../../utils/commodityUtils';
import { commodityService, type CommodityFormData } from '../../services/commodityService';

const { width } = Dimensions.get('window');

export default function AddCommodityScreen() {
  const router = useRouter();
  const { commodityId } = useLocalSearchParams<{ commodityId?: string }>();
  const { showError, showSuccess } = useAlert();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>();

  const [formData, setFormData] = useState<CommodityFormData>({
    name: '',
    description: '',
    category: 'electronics',
    unit: 'piece',
    price: '',
    availableQuantity: '1',
    minOrderQuantity: '1',
    images: [],
    specifications: {},
    tags: [],
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
      if (!commodityId) return;

      const result = await commodityService.getCommodityById(commodityId);
      
      if (result.success && result.commodity) {
        const commodity = result.commodity;
        setFormData({
          name: commodity.name,
          description: commodity.description,
          category: commodity.category,
          unit: commodity.unit,
          price: commodity.price.toString(),
          availableQuantity: commodity.stock_quantity?.toString() || '1',
          minOrderQuantity: '1',
          images: commodity.image_url ? [commodity.image_url] : [],
          specifications: {},
          tags: [],
        });
        setExistingImageUrl(commodity.image_url);
      } else {
        showError('Error', result.error || 'Failed to load commodity details');
      }
    } catch (error) {
      console.error('Error loading commodity for edit:', error);
      showError('Error', 'Failed to load commodity details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const validation = validateCommodityForm(formData);
    setErrors({
      name: validation.errors.name || '',
      description: validation.errors.description || '',
      price: validation.errors.price || '',
    });
    return validation.isValid;
  };

  const handleSelectImage = async () => {
    if (Platform.OS === 'web') {
      imageInputRef.current?.click();
      return;
    }

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
        setFormData({ ...formData, images: [result.assets[0].uri] });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showError('Error', 'Failed to select image');
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      showError('Not Available', 'Camera is not available on web. Please select an image instead.');
      return;
    }

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
        setFormData({ ...formData, images: [result.assets[0].uri] });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Error', 'Failed to take photo');
    }
  };

  const handleWebImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData({ ...formData, images: [reader.result] });
      }
    };
    reader.readAsDataURL(file);
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      handleSelectImage();
    } else {
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          { text: 'Camera', onPress: handleTakePhoto },
          { text: 'Gallery', onPress: handleSelectImage },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors and try again');
      return;
    }

    try {
      setLoading(true);

      let result;
      if (isEditing && commodityId) {
        result = await commodityService.updateCommodity(commodityId, formData, existingImageUrl);
        
        if (result.success) {
          showSuccess('Success', 'Commodity updated successfully');
        } else {
          showError('Error', result.error || 'Failed to update commodity');
          return;
        }
      } else {
        result = await commodityService.createCommodity(formData);
        
        if (result.success) {
          showSuccess('Success', 'Commodity added successfully');
          
          // Reset form for new entry
          setFormData({
            name: '',
            description: '',
            category: 'electronics',
            unit: 'piece',
            price: '',
            availableQuantity: '1',
            minOrderQuantity: '1',
            images: [],
            specifications: {},
            tags: [],
          });
        } else {
          showError('Error', result.error || 'Failed to add commodity');
          return;
        }
      }

      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error saving commodity:', error);
      showError('Error', 'Failed to save commodity. Please try again.');
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

  const mainImage = formData.images.length > 0 ? formData.images[0] : '';

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebImageChange}
        />
      )}

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
          <View style={styles.categoriesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {COMMODITY_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    formData.category === category.value && styles.selectedCategoryButton,
                  ]}
                  onPress={() => setFormData({ ...formData, category: category.value })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === category.value && styles.selectedCategoryButtonText,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.imagePickerContainer} onPress={showImageOptions}>
            {mainImage ? (
              <Image 
                source={{ uri: mainImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="camera" size={40} color="#4682B4" />
                <Text style={styles.imagePickerText}>Add Image</Text>
                <Text style={styles.imagePickerSubtext}>
                  {Platform.OS === 'web' ? 'Tap to select image' : 'Tap to select from gallery or take photo'}
                </Text>
              </View>
            )}
            {mainImage && (
              <View style={styles.imageEditOverlay}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>

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
                  COMMODITY_UNITS.map(unit => ({
                    text: unit.label,
                    onPress: () => setFormData({ ...formData, unit: unit.value })
                  }))
                );
              }}
            >
              <Text style={[styles.textInput, { color: '#131313' }]}>
                {COMMODITY_UNITS.find(u => u.value === formData.unit)?.label || formData.unit}
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
                const numericValue = text.replace(/[^0-9.]/g, '');
                setFormData({ ...formData, price: numericValue });
                setErrors({ ...errors, price: '' });
              }}
              placeholderTextColor="#B7B7B7"
              keyboardType="numeric"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Available Quantity *"
              value={formData.availableQuantity}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setFormData({ ...formData, availableQuantity: numericValue });
              }}
              placeholderTextColor="#B7B7B7"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Minimum Order Quantity *"
              value={formData.minOrderQuantity}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setFormData({ ...formData, minOrderQuantity: numericValue });
              }}
              placeholderTextColor="#B7B7B7"
              keyboardType="numeric"
            />
          </View>

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
