import { withRoleAccess } from '../../components/withRoleAccess';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';
import { commodityService, type Commodity } from '../../services/commodityService';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  price: number;
  isAvailable: boolean;
  status: 'in_stock' | 'out_of_stock' | 'unavailable';
}

function InventoryManagement() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stockAction, setStockAction] = useState<'restock' | 'adjust'>('restock');

  const categories = ['all', ...new Set(inventory.map(item => item.category).filter(Boolean))];
  const statuses = ['all', 'in_stock', 'out_of_stock', 'unavailable'];

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      const result = await commodityService.getMerchantCommodities();
      if (!active) return;
      if (!result.success || !result.commodities) {
        setLoadError(result.error || 'Failed to load inventory');
        setInventory([]);
        setIsLoading(false);
        return;
      }

      setInventory(result.commodities.map(toInventoryItem));
      setIsLoading(false);
      const merchant = await commodityService.getMerchantId();
      if (!active) return;
      if (!merchant.success || !merchant.merchantId) {
        setLoadError(merchant.error || 'Unable to subscribe to inventory updates');
        return;
      }
      unsubscribe = await commodityService.subscribeToMerchantCommodities(merchant.merchantId, () => {
        void load();
      });
    };

    void load();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => {
      active = false;
      unsubscribe?.();
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const toInventoryItem = (commodity: Commodity): InventoryItem => ({
    id: commodity.id,
    name: commodity.name,
    category: commodity.category || 'Uncategorized',
    currentStock: Number(commodity.stock_quantity) || 0,
    unit: commodity.unit || '',
    price: Number(commodity.price) || 0,
    isAvailable: commodity.is_available,
    status: !commodity.is_available
      ? 'unavailable'
      : Number(commodity.stock_quantity) <= 0
        ? 'out_of_stock'
        : 'in_stock',
  });

  const refreshInventory = async () => {
    setLoadError(null);
    setIsLoading(true);
    const result = await commodityService.getMerchantCommodities();
    if (!result.success || !result.commodities) {
      setLoadError(result.error || 'Failed to load inventory');
    } else {
      setInventory(result.commodities.map(toInventoryItem));
    }
    setIsLoading(false);
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return b.currentStock - a.currentStock;
        default:
          return 0;
      }
    });

    setFilteredInventory(filtered);
  };

  const handleRestock = async () => {
    if (!selectedItem || !restockQuantity) return;

    const quantity = Number(restockQuantity);
    if (!Number.isInteger(quantity) || quantity < 0 || (stockAction === 'restock' && quantity === 0)) {
      showError('Invalid Quantity', 'Enter a valid non-negative whole number.');
      return;
    }

    const stockQuantity = stockAction === 'restock'
      ? selectedItem.currentStock + quantity
      : quantity;
    const result = await commodityService.updateStock(selectedItem.id, stockQuantity);
    if (!result.success) {
      showError('Error', result.error || 'Failed to update stock');
      return;
    }
    showSuccess('Success', `Stock for ${selectedItem.name} updated.`);
    setShowRestockModal(false);
    setRestockQuantity('');
    setSelectedItem(null);
    await refreshInventory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return '#28a745';
      case 'out_of_stock': return '#dc3545';
      case 'unavailable': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const renderInventoryItem = (item: InventoryItem) => (
    <View key={item.id} style={styles.inventoryCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.stockText}>Stock: {item.currentStock} {item.unit}</Text>

      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>Price: ₦{item.price.toLocaleString()}</Text>
        <Text style={styles.detailText}>Category: {item.category}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedItem(item);
            setStockAction('restock');
            setRestockQuantity('');
            setShowRestockModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007bff" />
          <Text style={styles.actionButtonText}>Restock</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedItem(item);
            setStockAction('adjust');
            setRestockQuantity(item.currentStock.toString());
            setShowRestockModal(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color="#28a745" />
          <Text style={styles.actionButtonText}>Adjust</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/merchant/add-commodity?commodityId=${item.id}`)}
        >
          <Ionicons name="information-circle-outline" size={20} color="#6c757d" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={styles.filterLabel}>Category:</Text>
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.activeFilter
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedCategory === category && styles.activeFilterText
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.activeFilter
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === status && styles.activeFilterText
              ]}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Inventory Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{inventory.length}</Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {inventory.filter(item => item.status === 'out_of_stock').length}
          </Text>
          <Text style={styles.summaryLabel}>Out of Stock</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {inventory.filter(item => !item.isAvailable).length}
          </Text>
          <Text style={styles.summaryLabel}>Unavailable</Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['name', 'stock'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.sortButton,
              sortBy === option && styles.activeSortButton
            ]}
            onPress={() => setSortBy(option as any)}
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === option && styles.activeSortButtonText
            ]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inventory List */}
      <ScrollView style={styles.inventoryList} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4682B4" />
            <Text style={styles.emptyText}>Loading inventory...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity onPress={refreshInventory}>
              <Text style={styles.actionButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredInventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {inventory.length === 0 ? 'No products in your inventory yet.' : 'No products match these filters.'}
            </Text>
          </View>
        ) : (
          filteredInventory.map(renderInventoryItem)
        )}
      </ScrollView>

      {/* Restock Modal */}
      <Modal
        visible={showRestockModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRestockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{stockAction === 'restock' ? 'Restock Item' : 'Adjust Stock'}</Text>
            {selectedItem && (
              <>
                <Text style={styles.modalSubtitle}>{selectedItem.name}</Text>
                <Text style={styles.modalInfo}>
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={stockAction === 'restock' ? `Quantity to add (${selectedItem.unit})` : `New stock quantity (${selectedItem.unit})`}
                  value={restockQuantity}
                  onChangeText={setRestockQuantity}
                  keyboardType="numeric"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowRestockModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={handleRestock}
                  >
                    <Text style={styles.modalConfirmText}>{stockAction === 'restock' ? 'Restock' : 'Save Stock'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
    alignSelf: 'center',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#4682B4',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginHorizontal: 5,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#4682B4',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeSortButtonText: {
    color: '#fff',
  },
  inventoryList: {
    flex: 1,
    padding: 15,
  },
  inventoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  stockInfo: {
    marginBottom: 10,
  },
  stockBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 5,
  },
  stockFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    color: '#666',
  },
  itemDetails: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4682B4',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default withRoleAccess(InventoryManagement, {
  requiredRole: 'merchant',
  fallbackRoute: '/home/consumer',
  showUnauthorizedMessage: true,
});
