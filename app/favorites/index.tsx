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
  image: any;
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
      image: require('../../assets/images/logo.png'),
      merchant: 'Prime Store',
      rating: 4.8,
      category: 'Groceries'
    },
    {
      id: '2',
      name: 'Cooking Oil',
      price: 1200,
      image: require('../../assets/images/logo.png'),
      merchant: 'Fresh Market',
      rating: 4.5,
      category: 'Groceries'
    },
    {
      id: '3',
      name: 'Organic Beans',
      price: 800,
      image: require('../../assets/images/logo.png'),
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
      const { favoritesService } = require('../../services/favoritesService');
      const result = await favoritesService.getFavorites();
      
      if (result.success && result.data) {
        // Map favorites to display format
        setFavorites(result.data);
      } else {
        // Fallback to AsyncStorage
        const savedFavorites = await AsyncStorage.getItem('userFavorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
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