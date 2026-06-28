import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

interface TabItem {
  label: string;
  value: string;
  content?: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  style?: ViewStyle;
}

export function Tabs({ items, defaultValue, onValueChange, style }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value || '');

  const handleTabPress = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  const activeItem = items.find(item => item.value === activeTab);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabList}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.tab,
              activeTab === item.value && styles.activeTab
            ]}
            onPress={() => handleTabPress(item.value)}
          >
            <Text style={[
              styles.tabText,
              activeTab === item.value && styles.activeTabText
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeItem?.content && (
        <View style={styles.content}>
          {activeItem.content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabList: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4682B4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4682B4',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default Tabs;