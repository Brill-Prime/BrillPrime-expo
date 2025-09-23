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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'products'>('categories');
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Mock data for categories
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

  // Mock data for products
  const products: Product[] = [
    {
      id: '1',
      name: 'Premium Petrol',
      description: 'High-quality unleaded petrol with engine cleaning additives',
      price: '650',
      unit: 'liter',
      inStock: true,
      rating: 4.5,
      reviewCount: 125,
      minimumOrder: 5,
      categoryId: 1,
      merchantId: '1',
      merchantName: 'Lagos Fuel Station',
      merchantLocation: 'Victoria Island, Lagos'
    },
    {
      id: '2',
      name: 'Fresh Tomatoes',
      description: 'Farm-fresh locally sourced tomatoes, perfect for cooking',
      price: '800',
      unit: 'kg',
      inStock: true,
      rating: 4.2,
      reviewCount: 89,
      minimumOrder: 1,
      categoryId: 2,
      merchantId: '2',
      merchantName: 'Victoria Island Market',
      merchantLocation: 'Victoria Island, Lagos'
    },
    {
      id: '3',
      name: 'Rice (Local)',
      description: 'Premium quality local rice, well processed and clean',
      price: '1200',
      unit: 'kg',
      inStock: true,
      rating: 4.7,
      reviewCount: 234,
      minimumOrder: 2,
      categoryId: 3,
      merchantId: '3',
      merchantName: 'Alaba Market',
      merchantLocation: 'Alaba, Lagos'
    },
    {
      id: '4',
      name: 'Paracetamol Tablets',
      description: 'Pain relief and fever reducer, 500mg tablets',
      price: '150',
      unit: 'pack',
      inStock: true,
      rating: 4.8,
      reviewCount: 67,
      minimumOrder: 1,
      categoryId: 4,
      merchantId: '4',
      merchantName: 'HealthPlus Pharmacy',
      merchantLocation: 'Ikeja, Lagos'
    }
  ];

  useEffect(() => {
    loadCartItems();
    loadFavorites();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

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

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.productId === product.id);

    if (existingItem) {
      const updatedCart = cartItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCartItems(updatedCart);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        quantity: 1,
        price: parseFloat(product.price),
        productName: product.name,
        productUnit: product.unit,
        merchantId: product.merchantId,
        merchantName: product.merchantName,
      };
      saveCartItems([...cartItems, newItem]);
    }

    Alert.alert(
      'Added to Cart',
      `${product.name} has been added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/cart') }
      ]
    );
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

  const handleProductPress = (product: Product) => {
    // Navigate to commodity details screen
    router.push({
      pathname: `/commodity/${product.id}`,
      params: {
        commodityId: product.id,
        commodityName: product.name,
        commodityType: categories.find(c => c.id === product.categoryId)?.name || 'Product',
        merchantId: product.merchantId,
        merchantName: product.merchantName,
        unitPrice: product.price,
        unit: product.unit,
      }
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {viewMode === 'categories' ? 'Marketplace' : 'Products'}
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/cart')} 
          style={styles.cartButton}
        >
          <Ionicons name="cart-outline" size={24} color="#0c1a2a" />
          {getTotalCartItems() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalCartItems()}</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                    onPressIn={() => {}} // Placeholder for potential hover effects if needed later
                    onPressOut={() => {}} // Placeholder for potential hover effects if needed later
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
                    setSelectedCategory(null);
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
              ) : (
                <View style={styles.productsGrid}>
                  {filteredProducts.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      onPress={() => handleProductPress(product)}
                      onPressIn={(e) => {
                        if (e.nativeEvent.source.module && e.nativeEvent.source.module.startsWith('TouchableOpacity')) {
                          e.currentTarget.setNativeProps({ style: { backgroundColor: '#0B1A51' } });
                        }
                      }}
                      onPressOut={(e) => {
                        e.currentTarget.setNativeProps({ style: { backgroundColor: '#fff' } });
                      }}
                    >
                      <View style={styles.productHeader}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={[
                          styles.stockBadge, 
                          { backgroundColor: product.inStock ? '#e8f5e8' : '#f5e8e8' }
                        ]}>
                          <Text style={[
                            styles.stockText, 
                            { color: product.inStock ? '#2d5a2d' : '#8b0000' }
                          ]}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.productDescription} numberOfLines={2}>
                        {product.description}
                      </Text>

                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {product.rating} ({product.reviewCount} reviews)
                        </Text>
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>₦{parseFloat(product.price).toLocaleString()}</Text>
                        <Text style={styles.unit}>/ {product.unit}</Text>
                      </View>

                      <View style={styles.merchantInfo}>
                        <View style={styles.merchantAvatar}>
                          <Text style={styles.merchantInitial}>
                            {product.merchantName.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.merchantDetails}>
                          <Text style={styles.merchantName}>{product.merchantName}</Text>
                          <Text style={styles.merchantLocation}>{product.merchantLocation}</Text>
                        </View>
                      </View>

                      <View style={styles.productActions}>
                        <View style={styles.actionRow}>
                          {getCartQuantity(product.id) > 0 ? (
                            <View style={styles.quantityControls}>
                              <TouchableOpacity
                                style={[styles.quantityButton, styles.quantityButtonHover]}
                                onPress={() => handleRemoveFromCart(product.id)}
                                onPressIn={(e) => { e.currentTarget.setNativeProps({ style: [styles.quantityButton, styles.quantityButtonHover, { backgroundColor: '#0B1A51' }] }); }}
                                onPressOut={(e) => { e.currentTarget.setNativeProps({ style: [styles.quantityButton, styles.quantityButtonHover, { backgroundColor: '#fff' }] }); }}
                              >
                                <Ionicons name="remove" size={16} color="#4682B4" />
                              </TouchableOpacity>
                              <Text style={styles.quantityText}>{getCartQuantity(product.id)}</Text>
                              <TouchableOpacity
                                style={[styles.quantityButton, styles.quantityButtonHover]}
                                onPress={() => handleAddToCart(product)}
                                onPressIn={(e) => { e.currentTarget.setNativeProps({ style: [styles.quantityButton, styles.quantityButtonHover, { backgroundColor: '#0B1A51' }] }); }}
                                onPressOut={(e) => { e.currentTarget.setNativeProps({ style: [styles.quantityButton, styles.quantityButtonHover, { backgroundColor: '#fff' }] }); }}
                              >
                                <Ionicons name="add" size={16} color="#4682B4" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[
                                styles.addToCartButton,
                                !product.inStock && styles.disabledButton,
                                styles.addToCartButtonHover
                              ]}
                              onPress={() => handleAddToCart(product)}
                              disabled={!product.inStock}
                              onPressIn={(e) => {
                                if (!product.inStock) return; // Do not apply hover effect if disabled
                                e.currentTarget.setNativeProps({ style: [styles.addToCartButton, styles.addToCartButtonHover, { backgroundColor: '#0B1A51' }] });
                              }}
                              onPressOut={(e) => {
                                if (!product.inStock) return; // Do not apply hover effect if disabled
                                e.currentTarget.setNativeProps({ style: [styles.addToCartButton, styles.addToCartButtonHover, { backgroundColor: '#4682B4' }] });
                              }}
                            >
                              <Ionicons name="cart-outline" size={16} color="#fff" />
                              <Text style={styles.addToCartText}>Add to Cart</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={() => toggleFavorite(product)}
                            onPressIn={(e) => { e.currentTarget.setNativeProps({ style: [styles.favoriteButton, { backgroundColor: '#0B1A51' }] }); }}
                            onPressOut={(e) => { e.currentTarget.setNativeProps({ style: [styles.favoriteButton, { backgroundColor: '#f8f9fa' }] }); }}
                          >
                            <Ionicons 
                              name={favorites.includes(product.id) ? "heart" : "heart-outline"} 
                              size={20} 
                              color={favorites.includes(product.id) ? "#e74c3c" : "#666"} 
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.minimumOrder}>
                          Min: {product.minimumOrder} {product.unit}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!loading && filteredProducts.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyStateTitle}>No products found</Text>
                  <Text style={styles.emptyStateText}>
                    Try adjusting your search or browse different categories
                  </Text>
                </View>
              )}
            </View>
          )}
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Montserrat-Regular',
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
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    marginRight: 10,
    fontFamily: 'Montserrat-Bold',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
    fontFamily: 'Montserrat-Regular',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
    fontFamily: 'Montserrat-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat-Bold',
  },
  unit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    fontFamily: 'Montserrat-Regular',
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  merchantAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  merchantInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat-Bold',
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1a2a',
    fontFamily: 'Montserrat-SemiBold',
  },
  merchantLocation: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  productActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  quantityButtonHover: {
    backgroundColor: '#4682B4', // Default color, will be changed on hover
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    paddingHorizontal: 15,
    fontFamily: 'Montserrat-Bold',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4682B4',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addToCartButtonHover: {
    backgroundColor: '#0B1A51', // Default color, will be changed on hover
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  minimumOrder: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginTop: 15,
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
});