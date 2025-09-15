
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
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

    const unsubscribe = router.addListener?.('focus', () => {
      loadFavorites();
    });

    return () => {
      subscription?.remove();
      unsubscribe?.();
    };
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const savedFavorites = await AsyncStorage.getItem('favoriteItems');
      if (savedFavorites) {
        const favoritesData = JSON.parse(savedFavorites);
        setFavorites(favoritesData);
      } else {
        // Mock data for demonstration
        const mockFavorites: FavoriteItem[] = [
          {
            id: '1',
            name: 'Premium Petrol',
            description: 'High-quality unleaded petrol with engine cleaning additives',
            price: '650',
            unit: 'liter',
            merchantName: 'Lagos Fuel Station',
            merchantLocation: 'Victoria Island, Lagos',
            category: 'fuel',
            dateAdded: '2024-01-15',
            inStock: true,
          },
          {
            id: '2',
            name: 'Fresh Tomatoes',
            description: 'Farm-fresh locally sourced tomatoes, perfect for cooking',
            price: '800',
            unit: 'kg',
            merchantName: 'Victoria Island Market',
            merchantLocation: 'Victoria Island, Lagos',
            category: 'food',
            dateAdded: '2024-01-14',
            inStock: true,
          },
          {
            id: '3',
            name: 'iPhone 15 Pro',
            description: 'Latest iPhone with advanced camera and A17 Pro chip',
            price: '1200000',
            unit: 'piece',
            merchantName: 'Tech World Nigeria',
            merchantLocation: 'Computer Village, Lagos',
            category: 'electronics',
            dateAdded: '2024-01-13',
            inStock: false,
          }
        ];
        setFavorites(mockFavorites);
        await AsyncStorage.setItem('favoriteItems', JSON.stringify(mockFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (itemId: string) => {
    Alert.alert(
      'Remove Favorite',
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
              await AsyncStorage.setItem('favoriteItems', JSON.stringify(updatedFavorites));
            } catch (error) {
              console.error('Error removing favorite:', error);
            }
          }
        }
      ]
    );
  };

  const handleItemPress = (item: FavoriteItem) => {
    router.push({
      pathname: '/order',
      params: {
        commodityId: item.id,
        commodityName: item.name,
        commodityType: item.category,
        merchantId: 'merchant1',
        merchantName: item.merchantName,
        unitPrice: item.price,
        unit: item.unit,
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel': return 'car-outline';
      case 'food': return 'restaurant-outline';
      case 'electronics': return 'phone-portrait-outline';
      case 'groceries': return 'bag-outline';
      default: return 'cube-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fuel': return '#FF6B6B';
      case 'food': return '#4ECDC4';
      case 'electronics': return '#45B7D1';
      case 'groceries': return '#96CEB4';
      default: return '#FECA57';
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e67c7" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={80} color="#bdc3c7" />
          <Text style={styles.emptyStateTitle}>No favorites yet</Text>
          <Text style={styles.emptyStateText}>
            Start browsing products and add items to your favorites
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/commodity/commodities')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: responsivePadding }}>
            <Text style={styles.sectionTitle}>
              {favorites.length} item{favorites.length !== 1 ? 's' : ''} saved
            </Text>

            {favorites.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.favoriteCard}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.itemInfo}>
                    <View style={[
                      styles.categoryIcon, 
                      { backgroundColor: getCategoryColor(item.category) + '20' }
                    ]}>
                      <Ionicons 
                        name={getCategoryIcon(item.category) as any} 
                        size={24} 
                        color={getCategoryColor(item.category)} 
                      />
                    </View>
                    
                    <View style={styles.itemDetails}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={[
                          styles.stockBadge,
                          { backgroundColor: item.inStock ? '#e8f5e8' : '#f5e8e8' }
                        ]}>
                          <Text style={[
                            styles.stockText,
                            { color: item.inStock ? '#2d5a2d' : '#8b0000' }
                          ]}>
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                      
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>₦{parseFloat(item.price).toLocaleString()}</Text>
                        <Text style={styles.unit}>/ {item.unit}</Text>
                      </View>
                      
                      <View style={styles.merchantInfo}>
                        <Ionicons name="storefront-outline" size={14} color="#666" />
                        <Text style={styles.merchantName}>{item.merchantName}</Text>
                      </View>
                      
                      <Text style={styles.dateAdded}>
                        Added {new Date(item.dateAdded).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFavorite(item.id)}
                  >
                    <Ionicons name="heart" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Montserrat-Regular',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'Montserrat-Bold',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Montserrat-Regular',
  },
  browseButton: {
    backgroundColor: '#2e67c7',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginTop: 20,
    marginBottom: 15,
    fontFamily: 'Montserrat-Bold',
  },
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    marginRight: 10,
    fontFamily: 'Montserrat-Bold',
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
    fontFamily: 'Montserrat-Regular',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e67c7',
    fontFamily: 'Montserrat-Bold',
  },
  unit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
    fontFamily: 'Montserrat-Regular',
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  merchantName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    fontFamily: 'Montserrat-Regular',
  },
  dateAdded: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  removeButton: {
    padding: 5,
  },
});
