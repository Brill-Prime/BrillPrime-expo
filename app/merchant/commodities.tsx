
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  { id: 'all', name: 'All', color: '#4682B4' },
  { id: 'petrol', name: 'Petrol', color: '#4682B4' },
  { id: 'lubricant', name: 'Car Lubricant', color: '#4682B4' },
  { id: 'aviation', name: 'Aviation', color: '#4682B4' },
  { id: 'industrial', name: 'Industrial', color: '#4682B4' },
];

const UNITS = [
  'Litres',
  'Kilograms',
  'Pieces',
  'Boxes',
  'Gallons',
  'Tons',
  'Meters',
];

export default function MerchantCommoditiesScreen() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'petrol',
    unit: 'Litres',
    price: '',
    image: '',
  });

  useEffect(() => {
    loadCommodities();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadCommodities = async () => {
    try {
      setLoading(true);
      const savedCommodities = await AsyncStorage.getItem('merchantCommodities');
      if (savedCommodities) {
        setCommodities(JSON.parse(savedCommodities));
      } else {
        // Load sample data for demo
        const sampleCommodities: Commodity[] = [
          {
            id: '1',
            name: 'Premium Petrol',
            description: 'High-quality unleaded petrol with engine cleaning additives',
            category: 'petrol',
            unit: 'Litres',
            price: 650,
            image: require('../../assets/images/consumer_order_fuel_icon.png'),
            inStock: true,
            createdAt: new Date().toISOString(),
            merchantId: 'merchant1',
          },
          {
            id: '2',
            name: 'Diesel Fuel',
            description: 'Clean burning diesel fuel for vehicles and generators',
            category: 'petrol',
            unit: 'Litres',
            price: 580,
            image: require('../../assets/images/order_fuel_icon.png'),
            inStock: true,
            createdAt: new Date().toISOString(),
            merchantId: 'merchant1',
          }
        ];
        setCommodities(sampleCommodities);
        await AsyncStorage.setItem('merchantCommodities', JSON.stringify(sampleCommodities));
      }
    } catch (error) {
      console.error('Error loading commodities:', error);
      showError('Error', 'Failed to load commodities');
    } finally {
      setLoading(false);
    }
  };

  const saveCommodities = async (updatedCommodities: Commodity[]) => {
    try {
      await AsyncStorage.setItem('merchantCommodities', JSON.stringify(updatedCommodities));
      setCommodities(updatedCommodities);
    } catch (error) {
      console.error('Error saving commodities:', error);
      showError('Error', 'Failed to save commodities');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleAddCommodity = () => {
    setEditingCommodity(null);
    setFormData({
      name: '',
      description: '',
      category: 'petrol',
      unit: 'Litres',
      price: '',
      image: '',
    });
    setShowAddModal(true);
  };

  const handleEditCommodity = (commodity: Commodity) => {
    setEditingCommodity(commodity);
    setFormData({
      name: commodity.name,
      description: commodity.description,
      category: commodity.category,
      unit: commodity.unit,
      price: commodity.price.toString(),
      image: commodity.image,
    });
    setShowAddModal(true);
  };

  const handleDeleteCommodity = (commodity: Commodity) => {
    showConfirmDialog(
      'Delete Commodity',
      `Are you sure you want to delete "${commodity.name}"?`,
      () => {
        const updatedCommodities = commodities.filter(c => c.id !== commodity.id);
        saveCommodities(updatedCommodities);
        showSuccess('Success', 'Commodity deleted successfully');
      }
    );
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
        quality: 1,
      });

      if (!result.canceled) {
        setFormData({ ...formData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showError('Error', 'Failed to select image');
    }
  };

  const handleSaveCommodity = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.price.trim()) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      showError('Validation Error', 'Please enter a valid price');
      return;
    }

    try {
      let updatedCommodities: Commodity[];

      if (editingCommodity) {
        // Update existing commodity
        updatedCommodities = commodities.map(c =>
          c.id === editingCommodity.id
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

        updatedCommodities = [...commodities, newCommodity];
        showSuccess('Success', 'Commodity added successfully');
      }

      await saveCommodities(updatedCommodities);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving commodity:', error);
      showError('Error', 'Failed to save commodity');
    }
  };

  const filteredCommodities = selectedCategory === 'all' 
    ? commodities 
    : commodities.filter(c => c.category === selectedCategory);

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  const renderCommodityItem = (commodity: Commodity) => (
    <View key={commodity.id} style={styles.commodityCard}>
      <View style={styles.commodityHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: '#4682B4' }]}>
          <Text style={styles.categoryText}>
            {CATEGORIES.find(c => c.id === commodity.category)?.name || commodity.category}
          </Text>
        </View>
      </View>

      <View style={styles.commodityContent}>
        <View style={styles.imageContainer}>
          <Image 
            source={typeof commodity.image === 'string' ? { uri: commodity.image } : commodity.image}
            style={styles.commodityImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.commodityDetails}>
          <View style={styles.commodityInfo}>
            <View style={styles.unitContainer}>
              <Text style={styles.unitLabel}>Unit</Text>
              <Text style={styles.unitValue}>{commodity.unit}</Text>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>₦{commodity.price.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.descriptionBadge}>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {commodity.description}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.commodityActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCommodity(commodity)}
        >
          <Ionicons name="pencil" size={18} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCommodity(commodity)}
        >
          <Ionicons name="trash" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commodities</Text>
      </View>

      {/* Category Filters */}
      <View style={[styles.categoriesContainer, { paddingHorizontal: responsivePadding }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.selectedCategoryButtonText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.addCategoryButton} onPress={handleAddCommodity}>
            <Text style={styles.addCategoryText}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Commodities List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading commodities...</Text>
            </View>
          ) : filteredCommodities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No commodities found</Text>
              <Text style={styles.emptyText}>
                {selectedCategory === 'all' 
                  ? "You haven't added any commodities yet"
                  : `No commodities in ${CATEGORIES.find(c => c.id === selectedCategory)?.name} category`
                }
              </Text>
            </View>
          ) : (
            <View style={styles.commoditiesGrid}>
              {filteredCommodities.map(renderCommodityItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add New Commodity Button */}
      <View style={[styles.addButtonContainer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCommodity}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New Commodities</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddModal(false)}
              style={styles.modalBackButton}
            >
              <View style={styles.backButtonCircle}>
                <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
              </View>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCommodity ? 'Edit Commodity' : 'Add New Commodities'}
            </Text>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              {/* Category Filter */}
              <View style={styles.modalCategoriesContainer}>
                <TouchableOpacity style={styles.modalCategoryButton}>
                  <Text style={styles.modalCategoryText}>All</Text>
                </TouchableOpacity>
              </View>

              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePickerContainer} onPress={handleSelectImage}>
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
                  </View>
                )}
              </TouchableOpacity>

              {/* Form Fields */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Name of Item"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholderTextColor="#B7B7B7"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Description"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholderTextColor="#B7B7B7"
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    // Show unit picker
                    Alert.alert(
                      'Select Unit',
                      '',
                      UNITS.map(unit => ({
                        text: unit,
                        onPress: () => setFormData({ ...formData, unit })
                      }))
                    );
                  }}
                >
                  <Text style={[styles.textInput, { color: formData.unit ? '#131313' : '#B7B7B7' }]}>
                    {formData.unit || 'Basic Unit Of Item'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#4682B4" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Price per Item"
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholderTextColor="#B7B7B7"
                  keyboardType="numeric"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCommodity}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 5,
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
  addCategoryButton: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4682B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCategoryText: {
    fontSize: 16,
    color: '#131313',
    fontFamily: 'Montserrat-Regular',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  commoditiesGrid: {
    paddingBottom: 100,
  },
  commodityCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  commodityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  categoryBadge: {
    paddingHorizontal: 38,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Montserrat-Bold',
  },
  commodityContent: {
    flexDirection: 'row',
    padding: 8,
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commodityImage: {
    width: 79,
    height: 79,
  },
  commodityDetails: {
    flex: 1,
  },
  commodityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  unitContainer: {
    flex: 1,
  },
  unitLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4682B4',
    fontFamily: 'Montserrat-Bold',
  },
  unitValue: {
    fontSize: 12,
    color: '#0B1A51',
    fontFamily: 'Montserrat-Regular',
    marginTop: 3,
  },
  priceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4682B4',
    fontFamily: 'Montserrat-Bold',
  },
  priceValue: {
    fontSize: 13,
    color: '#0B1A51',
    fontFamily: 'Montserrat-Regular',
    marginTop: 3,
  },
  descriptionBadge: {
    backgroundColor: '#4682B4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  descriptionText: {
    fontSize: 10,
    fontWeight: '300',
    color: 'white',
    fontFamily: 'Montserrat-Light',
  },
  commodityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    gap: 10,
  },
  editButton: {
    width: 30,
    height: 30,
    backgroundColor: '#4682B4',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 30,
    height: 30,
    backgroundColor: '#4682B4',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1A51',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 10,
    fontFamily: 'Montserrat-Regular',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 25,
    backgroundColor: '#fff',
  },
  modalBackButton: {
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'Montserrat-ExtraBold',
  },
  modalContent: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 29,
    paddingTop: 20,
  },
  modalCategoriesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalCategoryButton: {
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  modalCategoryText: {
    fontSize: 12,
    color: '#131313',
    fontFamily: 'Montserrat-Regular',
  },
  imagePickerContainer: {
    width: 250,
    height: 250,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4682B4',
    alignSelf: 'center',
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 10,
    fontFamily: 'Montserrat-Regular',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
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
  },
  saveButton: {
    backgroundColor: '#0B1A51',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Montserrat-Regular',
  },
});
