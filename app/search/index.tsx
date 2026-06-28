import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchResult {
  id: string;
  type: 'commodity' | 'merchant' | 'category';
  name: string;
  subtitle?: string;
  rating?: number;
  price?: number;
}

interface Filter {
  id: string;
  label: string;
  type: 'category' | 'price' | 'rating';
  value: any;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const categories = [
    'All',
    'Groceries',
    'Electronics',
    'Fashion',
    'Food & Drinks',
    'Health & Beauty',
    'Home & Garden',
  ];

  const suggestions = [
    'Premium Rice',
    'Fresh Vegetables',
    'Cooking Oil',
    'Electronics',
    'Fashion Items',
  ];

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem('recentSearches');
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveSearch = async (query: string) => {
    try {
      const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Error clearing searches:', error);
    }
  };

  const performSearch = async () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'commodity',
          name: 'Premium Rice',
          subtitle: 'From Fresh Market',
          rating: 4.5,
          price: 2500,
        },
        {
          id: '2',
          type: 'merchant',
          name: 'Green Farm Store',
          subtitle: '2.5 km away',
          rating: 4.8,
        },
        {
          id: '3',
          type: 'commodity',
          name: 'Organic Vegetables',
          subtitle: 'From Green Farm',
          rating: 4.7,
          price: 1200,
        },
      ];
      // Apply filters to mock results for demonstration
      const filteredResults = mockResults.filter(result => {
        let matches = true;
        if (minPrice && result.price !== undefined && result.price < parseFloat(minPrice)) {
          matches = false;
        }
        if (maxPrice && result.price !== undefined && result.price > parseFloat(maxPrice)) {
          matches = false;
        }
        if (selectedRating !== null && result.rating !== undefined && result.rating < selectedRating) {
          matches = false;
        }
        // Add category filter logic here if needed
        return matches;
      });
      setSearchResults(filteredResults);
      setIsSearching(false);
    }, 500);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      saveSearch(query);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'commodity') {
      router.push(`/commodity/${result.id}`);
    } else if (result.type === 'merchant') {
      router.push(`/merchant/${result.id}`);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'commodity':
        return 'cube';
      case 'merchant':
        return 'storefront';
      case 'category':
        return 'apps';
      default:
        return 'search';
    }
  };

  const handleApplyFilters = () => {
    // In a real app, this would trigger the performSearch with filters
    console.log('Applying filters:', { minPrice, maxPrice, selectedRating });
    performSearch(); // Re-run search with current filters
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedRating(null);
    // In a real app, this would reset filters and re-run search
    performSearch(); // Re-run search with cleared filters
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, stores..."
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <Ionicons name="options" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.length === 0 ? (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentItem}
                    onPress={() => handleSearch(search)}
                  >
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.recentText}>{search}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const updated = recentSearches.filter((_, i) => i !== index);
                        setRecentSearches(updated);
                      }}
                    >
                      <Ionicons name="close" size={18} color="#999" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Suggestions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Searches</Text>
              <View style={styles.suggestionsGrid}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleSearch(suggestion)}
                  >
                    <Ionicons name="trending-up" size={16} color="#4682B4" />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.categoryCard}
                    onPress={() => handleSearch(category)}
                  >
                    <Ionicons name="apps" size={24} color="#4682B4" />
                    <Text style={styles.categoryText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          /* Search Results */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isSearching ? 'Searching...' : `Results for "${searchQuery}"`}
            </Text>
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.resultCard}
                  onPress={() => handleResultPress(result)}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons name={getResultIcon(result.type)} size={24} color="#4682B4" />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    {result.subtitle && (
                      <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                    )}
                    {result.rating && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{result.rating}</Text>
                      </View>
                    )}
                  </View>
                  {result.price && (
                    <Text style={styles.resultPrice}>₦{result.price.toLocaleString()}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))
            ) : !isSearching ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try different keywords</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.filterModal}>
                <View style={styles.filterHeader}>
                  <Text style={styles.filterTitle}>Filters</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.filterContent}>
                  {/* Price Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Price Range</Text>
                    <View style={styles.priceInputs}>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.priceLabel}>Min</Text>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={minPrice}
                          onChangeText={setMinPrice}
                        />
                      </View>
                      <Text style={styles.priceSeparator}>-</Text>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.priceLabel}>Max</Text>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Unlimited"
                          keyboardType="numeric"
                          value={maxPrice}
                          onChangeText={setMaxPrice}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Rating Filter */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                    <View style={styles.ratingFilters}>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <TouchableOpacity
                          key={rating}
                          style={[
                            styles.ratingFilterChip,
                            selectedRating === rating && styles.ratingFilterChipActive,
                          ]}
                          onPress={() => setSelectedRating(rating)}
                        >
                          <Ionicons
                            name="star"
                            size={14}
                            color={selectedRating === rating ? '#fff' : '#4682B4'}
                          />
                          <Text
                            style={[
                              styles.ratingFilterText,
                              selectedRating === rating && styles.ratingFilterTextActive,
                            ]}
                          >
                            {rating}+
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Category Filter (example, can be expanded) */}
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Categories</Text>
                    <View style={styles.categoryFilters}>
                      {categories.slice(1).map((category) => ( // Skip 'All' category
                        <TouchableOpacity
                          key={category}
                          style={styles.categoryFilterChip}
                          onPress={() => {
                            // Logic to select/deselect category filter
                            console.log(`Selected category: ${category}`);
                          }}
                        >
                          <Text style={styles.categoryFilterText}>{category}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>
                <View style={styles.filterActions}>
                  <TouchableOpacity
                    style={styles.clearFiltersButton}
                    onPress={handleClearFilters}
                  >
                    <Text style={styles.clearFiltersText}>Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.applyFiltersButton}
                    onPress={handleApplyFilters}
                  >
                    <Text style={styles.applyFiltersText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 18,
    color: '#666',
  },
  ratingFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4682B4',
    gap: 4,
  },
  ratingFilterChipActive: {
    backgroundColor: '#4682B4',
  },
  ratingFilterText: {
    fontSize: 14,
    color: '#4682B4',
  },
  ratingFilterTextActive: {
    color: '#fff',
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#333',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4682B4',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});