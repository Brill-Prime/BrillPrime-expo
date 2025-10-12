import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';

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

// Import merchantService at the top
import { merchantService } from '../../services/merchantService';
import { useMerchant } from '../../contexts/MerchantContext';

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
  const { merchantId, loadMerchantId } = useMerchant();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadMerchantId();
  }, [loadMerchantId]);

  useEffect(() => {
    const fetchCommodities = async () => {
      if (!merchantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await merchantService.getMerchantCommodities(merchantId);
        if (response.success && Array.isArray(response.data)) {
          setCommodities(response.data);
        } else {
          setCommodities([]);
        }
      } catch (error) {
        console.error('Error loading commodities:', error);
        showError('Error', 'Failed to load commodities');
      } finally {
        setLoading(false);
      }
    };

    fetchCommodities();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    // Clean up subscription only
    return () => {
      subscription?.remove();
    };
  }, [merchantId]);

  // Remove saveCommodities and AsyncStorage usage for real API

  const handleGoBack = () => {
    router.back();
  };

  const handleAddCommodity = () => {
    router.push('/merchant/add-commodity');
  };

  const handleEditCommodity = (commodity: Commodity) => {
    router.push({
      pathname: '/merchant/add-commodity',
      params: { commodityId: commodity.id }
    });
  };

  const handleDeleteCommodity = (commodity: Commodity) => {
    showConfirmDialog(
      'Delete Commodity',
      `Are you sure you want to delete "${commodity.name}"?`,
      () => {
        const updatedCommodities = commodities.filter(c => c.id !== commodity.id);
        setCommodities(updatedCommodities);
        showSuccess('Success', 'Commodity deleted successfully');
      }
    );
  };

  const handleToggleStock = async (commodity: Commodity) => {
    try {
      const updatedCommodities = commodities.map(c =>
        c.id === commodity.id
          ? { ...c, inStock: !c.inStock }
          : c
      );
      setCommodities(updatedCommodities);
      showSuccess(
        'Stock Updated', 
        `${commodity.name} is now ${!commodity.inStock ? 'in stock' : 'out of stock'}`
      );
    } catch (error) {
      console.error('Error toggling stock:', error);
      showError('Error', 'Failed to update stock status');
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

      <View style={styles.commodityFooter}>
        <View style={styles.stockStatus}>
          <TouchableOpacity
            style={[
              styles.stockToggle,
              { backgroundColor: commodity.inStock ? '#4CAF50' : '#FF9800' }
            ]}
            onPress={() => handleToggleStock(commodity)}
          >
            <Text style={styles.stockText}>
              {commodity.inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
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
  commodityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  stockStatus: {
    flex: 1,
  },
  stockToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  commodityActions: {
    flexDirection: 'row',
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

});