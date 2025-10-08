
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  price: number;
  costPrice: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export default function InventoryManagement() {
  const router = useRouter();
  const { showSuccess, showError, showConfirmDialog } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'lastRestocked'>('name');
  const [showLowStockAlert, setShowLowStockAlert] = useState(true);

  const categories = ['all', 'fuel', 'lubricants', 'accessories', 'food', 'beverages'];
  const statuses = ['all', 'in_stock', 'low_stock', 'out_of_stock', 'expired'];

  useEffect(() => {
    loadInventory();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, selectedCategory, selectedStatus, sortBy]);

  useEffect(() => {
    checkLowStockItems();
  }, [inventory]);

  const loadInventory = async () => {
    try {
      const savedInventory = await AsyncStorage.getItem('merchantInventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      } else {
        // Sample data
        const sampleInventory: InventoryItem[] = [
          {
            id: '1',
            name: 'Premium Petrol',
            category: 'fuel',
            currentStock: 15000,
            minStock: 5000,
            maxStock: 50000,
            unit: 'Litres',
            price: 650,
            costPrice: 580,
            supplier: 'NNPC',
            lastRestocked: new Date(Date.now() - 86400000 * 3).toISOString(),
            location: 'Tank A1',
            status: 'in_stock'
          },
          {
            id: '2',
            name: 'Diesel',
            category: 'fuel',
            currentStock: 2000,
            minStock: 3000,
            maxStock: 30000,
            unit: 'Litres',
            price: 580,
            costPrice: 520,
            supplier: 'NNPC',
            lastRestocked: new Date(Date.now() - 86400000 * 5).toISOString(),
            location: 'Tank B1',
            status: 'low_stock'
          },
          {
            id: '3',
            name: 'Engine Oil 5W-30',
            category: 'lubricants',
            currentStock: 0,
            minStock: 20,
            maxStock: 200,
            unit: 'Bottles',
            price: 8500,
            costPrice: 7200,
            supplier: 'Mobil',
            lastRestocked: new Date(Date.now() - 86400000 * 10).toISOString(),
            location: 'Shelf C2',
            status: 'out_of_stock'
          }
        ];
        setInventory(sampleInventory);
        await AsyncStorage.setItem('merchantInventory', JSON.stringify(sampleInventory));
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Error', 'Failed to load inventory');
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
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
        case 'lastRestocked':
          return new Date(b.lastRestocked).getTime() - new Date(a.lastRestocked).getTime();
        default:
          return 0;
      }
    });

    setFilteredInventory(filtered);
  };

  const checkLowStockItems = () => {
    const lowStockItems = inventory.filter(item => 
      item.currentStock <= item.minStock && item.status !== 'out_of_stock'
    );
    
    if (lowStockItems.length > 0 && showLowStockAlert) {
      Alert.alert(
        'Low Stock Alert',
        `${lowStockItems.length} item(s) are running low on stock.`,
        [
          { text: 'View Items', onPress: () => setSelectedStatus('low_stock') },
          { text: 'Dismiss', style: 'cancel' }
        ]
      );
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || !restockQuantity) return;

    try {
      const quantity = parseInt(restockQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        showError('Invalid Quantity', 'Please enter a valid quantity');
        return;
      }

      const updatedInventory = inventory.map(item => {
        if (item.id === selectedItem.id) {
          const newStock = item.currentStock + quantity;
          return {
            ...item,
            currentStock: newStock,
            lastRestocked: new Date().toISOString(),
            status: newStock <= item.minStock ? 'low_stock' : 
                   newStock === 0 ? 'out_of_stock' : 'in_stock'
          };
        }
        return item;
      });

      setInventory(updatedInventory);
      await AsyncStorage.setItem('merchantInventory', JSON.stringify(updatedInventory));
      
      showSuccess('Success', `${quantity} ${selectedItem.unit} added to ${selectedItem.name}`);
      setShowRestockModal(false);
      setRestockQuantity('');
      setSelectedItem(null);
    } catch (error) {
      showError('Error', 'Failed to restock item');
    }
  };

  const updateItemStock = async (itemId: string, newStock: number, reason: 'sale' | 'damage' | 'adjustment') => {
    try {
      const updatedInventory = inventory.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            currentStock: Math.max(0, newStock),
            status: newStock <= item.minStock ? 'low_stock' : 
                   newStock === 0 ? 'out_of_stock' : 'in_stock'
          };
        }
        return item;
      });

      setInventory(updatedInventory);
      await AsyncStorage.setItem('merchantInventory', JSON.stringify(updatedInventory));
    } catch (error) {
      showError('Error', 'Failed to update stock');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return '#28a745';
      case 'low_stock': return '#ffc107';
      case 'out_of_stock': return '#dc3545';
      case 'expired': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStockPercentage = (item: InventoryItem) => {
    return (item.currentStock / item.maxStock) * 100;
  };

  const renderInventoryItem = (item: InventoryItem) => (
    <View key={item.id} style={styles.inventoryCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.stockInfo}>
        <View style={styles.stockBar}>
          <View 
            style={[
              styles.stockFill, 
              { 
                width: `${Math.max(5, getStockPercentage(item))}%`,
                backgroundColor: getStatusColor(item.status)
              }
            ]} 
          />
        </View>
        <Text style={styles.stockText}>
          {item.currentStock} / {item.maxStock} {item.unit}
        </Text>
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>Price: ₦{item.price.toLocaleString()}</Text>
        <Text style={styles.detailText}>Location: {item.location}</Text>
        <Text style={styles.detailText}>Supplier: {item.supplier}</Text>
        <Text style={styles.detailText}>
          Last Restocked: {new Date(item.lastRestocked).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedItem(item);
            setShowRestockModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007bff" />
          <Text style={styles.actionButtonText}>Restock</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            Alert.prompt(
              'Adjust Stock',
              `Current stock: ${item.currentStock} ${item.unit}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Update', 
                  onPress: (value) => {
                    const newStock = parseInt(value || '0');
                    if (!isNaN(newStock)) {
                      updateItemStock(item.id, newStock, 'adjustment');
                    }
                  }
                }
              ],
              'plain-text',
              item.currentStock.toString()
            );
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
        <TouchableOpacity onPress={() => setShowLowStockAlert(!showLowStockAlert)}>
          <Ionicons 
            name={showLowStockAlert ? "notifications" : "notifications-off"} 
            size={24} 
            color="#1C1B1F" 
          />
        </TouchableOpacity>
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
            {inventory.filter(item => item.status === 'low_stock').length}
          </Text>
          <Text style={styles.summaryLabel}>Low Stock</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {inventory.filter(item => item.status === 'out_of_stock').length}
          </Text>
          <Text style={styles.summaryLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {['name', 'stock', 'lastRestocked'].map(option => (
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
              {option.charAt(0).toUpperCase() + option.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Inventory List */}
      <ScrollView style={styles.inventoryList} showsVerticalScrollIndicator={false}>
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No inventory items found</Text>
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
            <Text style={styles.modalTitle}>Restock Item</Text>
            {selectedItem && (
              <>
                <Text style={styles.modalSubtitle}>{selectedItem.name}</Text>
                <Text style={styles.modalInfo}>
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={`Quantity to add (${selectedItem.unit})`}
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
                    <Text style={styles.modalConfirmText}>Restock</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
