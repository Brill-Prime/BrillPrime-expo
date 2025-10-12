import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { merchantService } from '../../services/merchantService';
import { cartService } from '../../services/cartService';
import { useAppContext } from '../../contexts/AppContext';
import { FormErrorBoundary } from '../../components/FormErrorBoundary';

const { width } = Dimensions.get('window');

// Interface definitions from the original code
interface Category {
  id: number;
  name: string;
  icon: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  minimumOrder: number;
  categoryId: number;
  merchantId: string;
  merchantName: string;
  merchantLocation: string;
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productUnit: string;
  merchantId: string;
  merchantName: string;
}

export default function CommoditiesScreen() {
  const router = useRouter();
  const { updateCartCount } = useAppContext();
  const [commodities, setCommodities] = useState<any[]>([]);
  const [filteredCommodities, setFilteredCommodities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [viewMode, setViewMode] = useState<'categories' | 'products'>('categories');
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);


  // Static categories (can be fetched from API if available)
  const categories: Category[] = [
    { id: 1, name: 'Fuel & Energy', icon: 'car-outline', description: 'Petrol, Diesel, Gas' },
    { id: 2, name: 'Food & Beverages', icon: 'restaurant-outline', description: 'Fresh food, drinks' },
    { id: 3, name: 'Supermarket/Convenience Store', icon: 'storefront-outline', description: 'Daily essentials, groceries' },
    { id: 4, name: 'Medical & Health', icon: 'medical-outline', description: 'Healthcare products & services' },
    { id: 5, name: 'Electronics', icon: 'phone-portrait-outline', description: 'Tech gadgets' },
    { id: 6, name: 'Apparel & Clothing', icon: 'shirt-outline', description: 'Fashion & accessories' },
    { id: 7, name: 'Beauty, Cosmetics & Personal Care', icon: 'rose-outline', description: 'Beauty & personal care' },
    { id: 8, name: 'Art & Entertainment', icon: 'brush-outline', description: 'Creative arts & entertainment' },
    { id: 9, name: 'Education', icon: 'school-outline', description: 'Educational services & materials' },
    { id: 10, name: 'Event Planner', icon: 'calendar-outline', description: 'Event planning services' },
    { id: 11, name: 'Finance', icon: 'card-outline', description: 'Financial services' },
    { id: 12, name: 'Hotel', icon: 'bed-outline', description: 'Hospitality & accommodation' },
    { id: 13, name: 'Non-profit Organisation', icon: 'heart-outline', description: 'Community & social services' },
    { id: 14, name: 'Oil & Gas', icon: 'water-outline', description: 'Oil & gas products' },
    { id: 15, name: 'Restaurant', icon: 'restaurant-outline', description: 'Dining & food services' },
    { id: 16, name: 'Shopping & Retail', icon: 'bag-outline', description: 'Retail shopping' },
    { id: 17, name: 'Ticket', icon: 'ticket-outline', description: 'Event & travel tickets' },
    { id: 18, name: 'Toll Gate', icon: 'car-sport-outline', description: 'Toll gate services' },
    { id: 19, name: 'Vehicle Service', icon: 'build-outline', description: 'Auto repair & maintenance' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadCommodities();
      loadCartCount();
      loadCartItems();
      loadFavorites();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCommodities();
    await loadCartCount();
    await loadCartItems();
    await loadFavorites();
    setRefreshing(false);
  }, []);

  const loadCommodities = async () => {
    try {
      setLoading(true);
      const response = await merchantService.getCommodities();
      if (response.success && response.data && Array.isArray(response.data)) {
        const processedData = response.data.map((item: any) => ({
          ...item,
          id: item.id || item._id || `commodity_${Date.now()}_${Math.random()}`,
          image: item.image || require('../../assets/images/generated-icon.png'),
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
          merchantId: item.merchantId || item.merchant?.id || '',
          merchantName: item.merchantName || item.merchant?.name || 'Unknown Merchant',
        }));
        setCommodities(processedData);
        setFilteredCommodities(processedData);
      } else {
        // Load mock data if API fails
        const mockCommodities = [
          {
            id: '1',
            name: 'Premium Petrol',
            price: 800,
            unit: 'liter',
            category: 'fuel',
            merchantId: 'merchant_1',
            merchantName: 'Shell Station',
            image: require('../../assets/images/generated-icon.png'),
            description: 'High quality premium petrol',
          },
          {
            id: '2',
            name: 'Diesel',
            price: 750,
            unit: 'liter',
            category: 'fuel',
            merchantId: 'merchant_1',
            merchantName: 'Shell Station',
            image: require('../../assets/images/generated-icon.png'),
            description: 'Standard diesel fuel',
          },
        ];
        setCommodities(mockCommodities);
        setFilteredCommodities(mockCommodities);
      }
    } catch (error) {
      console.error('Error loading commodities:', error);
      Alert.alert('Error', 'Failed to load commodities. Showing sample data.');
      // Show sample data on error
      const sampleData = [
        {
          id: 'sample_1',
          name: 'Sample Product',
          price: 1000,
          unit: 'piece',
          category: 'groceries',
          merchantId: 'sample_merchant',
          merchantName: 'Sample Store',
          image: require('../../assets/images/generated-icon.png'),
          description: 'Sample product',
        },
      ];
      setCommodities(sampleData);
      setFilteredCommodities(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cartItems');
      const cart = savedCart ? JSON.parse(savedCart) : [];
      setCartCount(cart.reduce((total: number, item: any) => total + item.quantity, 0));
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  const loadCartItems = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('commoditiesCart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  const saveCartItems = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem('commoditiesCart', JSON.stringify(items));
      setCartItems(items);
    } catch (error) {
      console.error('Error saving cart items:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favoriteItemIds');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (product: Product) => {
    try {
      const isFavorite = favorites.includes(product.id);
      let updatedFavorites: string[];

      if (isFavorite) {
        updatedFavorites = favorites.filter(id => id !== product.id);
        // Remove from detailed favorites
        const savedDetailedFavorites = await AsyncStorage.getItem('favoriteItems');
        if (savedDetailedFavorites) {
          const detailedFavorites = JSON.parse(savedDetailedFavorites);
          const updatedDetailedFavorites = detailedFavorites.filter((item: any) => item.id !== product.id);
          await AsyncStorage.setItem('favoriteItems', JSON.stringify(updatedDetailedFavorites));
        }
      } else {
        updatedFavorites = [...favorites, product.id];
        // Add to detailed favorites
        const favoriteItem = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          unit: product.unit,
          merchantName: product.merchantName,
          merchantLocation: product.merchantLocation,
          category: categories.find(c => c.id === product.categoryId)?.name.toLowerCase() || 'product',
          dateAdded: new Date().toISOString(),
          inStock: product.inStock,
        };

        const savedDetailedFavorites = await AsyncStorage.getItem('favoriteItems');
        const detailedFavorites = savedDetailedFavorites ? JSON.parse(savedDetailedFavorites) : [];
        detailedFavorites.push(favoriteItem);
        await AsyncStorage.setItem('favoriteItems', JSON.stringify(detailedFavorites));
      }

      setFavorites(updatedFavorites);
      await AsyncStorage.setItem('favoriteItemIds', JSON.stringify(updatedFavorites));

      Alert.alert(
        isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
        isFavorite
          ? `${product.name} has been removed from your favorites`
          : `${product.name} has been added to your favorites`,
        [
          { text: 'OK', style: 'default' },
          ...(isFavorite ? [] : [{ text: 'View Favorites', onPress: () => router.push('/favorites') }])
        ]
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setViewMode('products');
  };


  const addToCart = async (commodity: any) => {
    try {
      const cartItem = {
        id: `cart_${commodity.id}_${Date.now()}`,
        commodityId: commodity.id,
        commodityName: commodity.name,
        merchantId: commodity.merchantId || 'unknown',
        merchantName: commodity.merchantName || 'Unknown Merchant',
        price: commodity.price,
        quantity: 1,
        unit: commodity.unit,
        category: commodity.category || 'product',
        image: commodity.image,
      };

      // Get existing cart
      const existingCartData = await AsyncStorage.getItem('cartItems');
      const existingCart = existingCartData ? JSON.parse(existingCartData) : [];

      // Check if item already exists
      const existingItemIndex = existingCart.findIndex(
        (item: any) => item.commodityId === commodity.id
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        existingCart[existingItemIndex].quantity += 1;
      } else {
        // Add new item
        existingCart.push(cartItem);
      }

      await AsyncStorage.setItem('cartItems', JSON.stringify(existingCart));

      // Update commodities cart for consistency
      const commoditiesCartItems = existingCart.map((item: any) => ({
        productId: item.commodityId,
        quantity: item.quantity,
        price: item.price,
        productName: item.commodityName,
        productUnit: item.unit,
        merchantId: item.merchantId,
        merchantName: item.merchantName,
      }));
      await AsyncStorage.setItem('commoditiesCart', JSON.stringify(commoditiesCartItems));

      // Update cart count in context
      await updateCartCount();
      await loadCartCount();

      Alert.alert(
        'Added to Cart',
        `${commodity.name} has been added to your cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/cart') }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    const existingItem = cartItems.find(item => item.productId === productId);

    if (existingItem && existingItem.quantity > 1) {
      const updatedCart = cartItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      saveCartItems(updatedCart);
    } else {
      const updatedCart = cartItems.filter(item => item.productId !== productId);
      saveCartItems(updatedCart);
    }
  };

  const getCartQuantity = (productId: string) => {
    const item = cartItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const viewCommodityDetails = (commodity: any) => {
    router.push(`/commodity/${commodity.id}`);
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = commodities.filter(product => {
    const matchesCategory = selectedCategory === 'all' ? true : product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <FormErrorBoundary fallbackMessage="Failed to load products. Please try again.">
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Browse Products</Text>
          <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="#1b1b1b" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { paddingHorizontal: responsivePadding }]}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={viewMode === 'categories' ? 'Search categories...' : 'Search products...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4682B4']}
              tintColor="#4682B4"
            />
          }
        >
          <View style={{ paddingHorizontal: responsivePadding }}>

            {/* Categories View */}
            {viewMode === 'categories' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Browse Categories</Text>
                <View style={styles.categoriesGrid}>
                  {filteredCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCard}
                      onPress={() => handleCategorySelect(category.id)}
                    >
                      <View style={styles.categoryIcon}>
                        <Ionicons name={category.icon as any} size={32} color="#4682B4" />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Products View */}
            {viewMode === 'products' && (
              <View style={styles.section}>
                <View style={styles.productsHeader}>
                  <TouchableOpacity
                    style={styles.backToCategoriesButton}
                    onPress={() => {
                      setViewMode('categories');
                      setSelectedCategory('all');
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#4682B4" />
                    <Text style={styles.backToCategoriesText}>Back to Categories</Text>
                  </TouchableOpacity>
                  <Text style={styles.productsCount}>
                    {filteredProducts.length} products found
                  </Text>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4682B4" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                  </View>
                ) : filteredProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="basket-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No products found</Text>
                    <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={loadCommodities}
                    >
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.productsGrid}>
                    {filteredProducts.map((commodity) => (
                      <TouchableOpacity
                        key={commodity.id}
                        style={styles.productCard}
                        onPress={() => viewCommodityDetails(commodity)}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={commodity.image}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={2}>{commodity.name}</Text>
                          <Text style={styles.merchantName} numberOfLines={1}>{commodity.merchantName}</Text>
                          <Text style={styles.productPrice}>₦{commodity.price.toLocaleString()}/{commodity.unit}</Text>
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              addToCart(commodity);
                            }}
                          >
                            <Ionicons name="cart-outline" size={16} color="#fff" />
                            <Text style={styles.addButtonText}>Add to Cart</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </FormErrorBoundary>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
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
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4682B4',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 20,
    fontFamily: 'Montserrat-Bold',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f7ff',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backToCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backToCategoriesText: {
    fontSize: 16,
    color: '#4682B4',
    marginLeft: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  productsGrid: {
    gap: 15,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat-Bold',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});