import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  image: string;
  merchant: string;
  rating: number;
  category: string;
}

export default function Favorites() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    {
      id: '1',
      name: 'Premium Rice',
      price: 2500,
      image: require('../../attached_assets/stock_images/3d_shopping_bag_icon_da3fd56f.jpg'),
      merchant: 'Prime Store',
      rating: 4.8,
      category: 'Groceries'
    },
    {
      id: '2',
      name: 'Cooking Oil',
      price: 1200,
      image: require('../../attached_assets/stock_images/3d_package_box_icon,_7337f405.jpg'),
      merchant: 'Fresh Market',
      rating: 4.5,
      category: 'Groceries'
    },
    {
      id: '3',
      name: 'Organic Beans',
      price: 800,
      image: require('../../attached_assets/stock_images/3d_heart_icon,_favor_cc7abce4.jpg'),
      merchant: 'Green Farm',
      rating: 4.7,
      category: 'Groceries'
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadFavorites();

    return () => subscription?.remove();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const savedFavorites = await AsyncStorage.getItem('userFavorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (itemId: string) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this item from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedFavorites = favorites.filter(item => item.id !== itemId);
              setFavorites(updatedFavorites);
              await AsyncStorage.setItem('userFavorites', JSON.stringify(updatedFavorites));
            } catch (error) {
              console.error('Error removing favorite:', error);
              Alert.alert('Error', 'Failed to remove item from favorites');
            }
          }
        }
      ]
    );
  };

  const addToCart = async (item: FavoriteItem) => {
    try {
      const cartItems = await AsyncStorage.getItem('cartItems');
      const cart = cartItems ? JSON.parse(cartItems) : [];

      const existingItem = cart.find((cartItem: any) => cartItem.id === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ ...item, quantity: 1 });
      }

      await AsyncStorage.setItem('cartItems', JSON.stringify(cart));
      Alert.alert('Success', 'Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const viewProduct = (itemId: string) => {
    router.push(`/commodity/${itemId}`);
  };

  const styles = getResponsiveStyles(screenData);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Favorites</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="cart-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyDescription}>
              Start adding items to your favorites by tapping the heart icon on products you love!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/commodity/commodities')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.favoritesGrid}>
            {favorites.map((item) => (
              <View key={item.id} style={styles.favoriteCard}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromFavorites(item.id)}
                >
                  <Ionicons name="heart" size={20} color="#e74c3c" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.productInfo}
                  onPress={() => viewProduct(item.id)}
                >
                  <Image source={item.image} style={styles.productImage} />
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.merchantName}>{item.merchant}</Text>

                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#ffd700" />
                    <Text style={styles.rating}>{item.rating}</Text>
                  </View>

                  <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={() => addToCart(item)}
                >
                  <Ionicons name="cart-outline" size={16} color="white" />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: 'white',
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "white",
    },
    cartButton: {
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingTop: Math.max(24, height * 0.03),
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Math.max(60, height * 0.1),
    },
    emptyTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginTop: 20,
      marginBottom: 10,
    },
    emptyDescription: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#7f8c8d',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 30,
      paddingHorizontal: 20,
    },
    browseButton: {
      backgroundColor: '#4682B4',
      paddingHorizontal: Math.max(24, width * 0.08),
      paddingVertical: Math.max(12, height * 0.015),
      borderRadius: 25,
    },
    browseButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
    favoritesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Math.max(12, width * 0.03),
      paddingBottom: Math.max(24, height * 0.04),
    },
    favoriteCard: {
      width: isTablet ? '31%' : '47%',
      backgroundColor: 'white',
      borderRadius: 15,
      padding: Math.max(12, width * 0.03),
      borderWidth: 1,
      borderColor: '#e9ecef',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
    },
    removeButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 1,
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    productInfo: {
      alignItems: 'center',
    },
    productImage: {
      width: isTablet ? 80 : 60,
      height: isTablet ? 80 : 60,
      borderRadius: 10,
      marginBottom: 8,
    },
    productName: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#2c3e50',
      textAlign: 'center',
      marginBottom: 4,
    },
    merchantName: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#7f8c8d',
      textAlign: 'center',
      marginBottom: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
    },
    rating: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#7f8c8d',
    },
    price: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
      color: '#4682B4',
      marginBottom: 12,
    },
    addToCartButton: {
      backgroundColor: '#4682B4',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Math.max(8, height * 0.01),
      borderRadius: 20,
      gap: 4,
    },
    addToCartText: {
      color: 'white',
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
    },
  });
};

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  merchantName: string;
  merchantLocation: string;
  category: string;
  dateAdded: string;
  inStock: boolean;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadFavorites();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem('favoriteItems');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (itemId: string) => {
    try {
      const updatedFavorites = favorites.filter(item => item.id !== itemId);
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem('favoriteItems', JSON.stringify(updatedFavorites));
      
      // Also update favorite IDs
      const favoriteIds = updatedFavorites.map(item => item.id);
      await AsyncStorage.setItem('favoriteItemIds', JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handleItemPress = (item: FavoriteItem) => {
    router.push(`/commodity/${item.id}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fuel': return '⛽';
      case 'food': return '🍽️';
      case 'groceries': return '🛒';
      case 'electronics': return '📱';
      default: return '📦';
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading favorites...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyDescription}>
              Items you mark as favorites will appear here
            </Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/commodity/commodities')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: responsivePadding }}>
            {favorites.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.favoriteCard}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.favoriteContent}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
                  
                  <View style={styles.favoriteInfo}>
                    <Text style={styles.favoriteName}>{item.name}</Text>
                    <Text style={styles.favoriteDescription}>{item.description}</Text>
                    <Text style={styles.favoriteMerchant}>From {item.merchantName}</Text>
                    <Text style={styles.favoritePrice}>₦{item.price}/{item.unit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      Alert.alert(
                        'Remove Favorite',
                        'Remove this item from favorites?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', onPress: () => removeFavorite(item.id) }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="heart" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                </View>

                <View style={styles.favoriteFooter}>
                  <Text style={styles.dateAdded}>
                    Added {new Date(item.dateAdded).toLocaleDateString()}
                  </Text>
                  <View style={[
                    styles.stockBadge,
                    { backgroundColor: item.inStock ? '#e8f5e8' : '#fdeaea' }
                  ]}>
                    <Text style={[
                      styles.stockText,
                      { color: item.inStock ? '#2ecc71' : '#e74c3c' }
                    ]}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  favoriteDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  favoriteMerchant: {
    fontSize: 14,
    color: '#4682B4',
    marginBottom: 8,
  },
  favoritePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateAdded: {
    fontSize: 12,
    color: '#999',
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
