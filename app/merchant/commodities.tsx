import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commodityService, Commodity } from '../../services/commodityService';
import { LoadingIndicator } from '../../components/LoadingIndicator';

export default function MerchantCommodities() {
  const router = useRouter();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommodities = async () => {
    try {
      const result = await commodityService.getMerchantCommodities();
      if (result.success && result.commodities) {
        setCommodities(result.commodities);
        setError(null);
      } else {
        setError(result.error || 'Failed to load commodities');
      }
    } catch (err) {
      setError('An error occurred while loading commodities');
      console.error('Fetch commodities error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCommodities();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCommodities();
  }, []);

  const handleEdit = (commodity: Commodity) => {
    router.push({
      pathname: '/merchant/add-commodity',
      params: {
        mode: 'edit',
        commodityId: commodity.id,
        commodityData: JSON.stringify(commodity),
      },
    });
  };

  const handleDelete = (commodity: Commodity) => {
    Alert.alert(
      'Delete Commodity',
      `Are you sure you want to delete "${commodity.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await commodityService.deleteCommodity(
                commodity.id,
                commodity.image_url
              );

              if (result.success) {
                Alert.alert('Success', 'Commodity deleted successfully');
                fetchCommodities();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete commodity');
                setLoading(false);
              }
            } catch (err) {
              Alert.alert('Error', 'An error occurred while deleting');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = async (commodity: Commodity) => {
    try {
      const result = await commodityService.toggleAvailability(
        commodity.id,
        !commodity.is_available
      );

      if (result.success) {
        fetchCommodities();
      } else {
        Alert.alert('Error', result.error || 'Failed to update availability');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred');
    }
  };

  const renderCommodityCard = ({ item }: { item: Commodity }) => (
    <View style={styles.commodityCard}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
          style={styles.commodityImage}
          resizeMode="cover"
        />
        <View style={styles.commodityInfo}>
          <Text style={styles.commodityName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.commodityCategory}>{item.category}</Text>
          <Text style={styles.commodityPrice}>
            ₦{item.price.toLocaleString()} / {item.unit}
          </Text>
          <Text style={styles.commodityStock}>
            Stock: {item.stock_quantity} {item.unit}(s)
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            item.is_available ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => handleToggleAvailability(item)}
        >
          <Text style={styles.statusButtonText}>
            {item.is_available ? 'Available' : 'Unavailable'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={20} color="#0066CC" />
            <Text style={styles.iconButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#CC0000" />
            <Text style={styles.iconButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingIndicator message="Loading commodities..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Commodities</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/merchant/add-commodity')}
        >
          <Ionicons name="add-circle" size={28} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#CC0000" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchCommodities} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && commodities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>No Commodities Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start adding products to your store
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/merchant/add-commodity')}
          >
            <Text style={styles.emptyButtonText}>Add Your First Commodity</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={commodities}
          renderItem={renderCommodityCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  commodityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commodityImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  commodityInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  commodityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  commodityCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  commodityPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 2,
  },
  commodityStock: {
    fontSize: 12,
    color: '#999',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeButton: {
    backgroundColor: '#E8F5E9',
  },
  inactiveButton: {
    backgroundColor: '#FFEBEE',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#CC0000',
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});