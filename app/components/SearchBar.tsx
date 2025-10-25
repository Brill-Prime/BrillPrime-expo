import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

interface SearchBarProps {
  onFilterPress: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onFilterPress,
  searchQuery,
  onSearchChange,
}) => {
  const router = useRouter();

  const handleSearchPress = () => {
    router.push('/search');
  };

  return (
    <View style={styles.searchContainer}>
      <TouchableOpacity style={styles.searchInputContainer} onPress={handleSearchPress}>
        <View style={styles.searchIcon}>
          {/* Add search icon */}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for merchants..."
          value={searchQuery}
          onChangeText={onSearchChange}
          editable={false} // Make it non-editable since we navigate on press
        />
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          {/* Add filter icon */}
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filterButton: {
    padding: 8,
  },
});

export default SearchBar;
