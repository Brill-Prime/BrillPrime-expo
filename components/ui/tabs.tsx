import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  [key: string]: any;
}

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue, value, onValueChange, ...props }) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue || '');
  
  const currentValue = value || selectedTab;
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setSelectedTab(newValue);
    }
  };

  return (
    <View style={styles.container} {...props}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as any, { currentValue, onValueChange: handleValueChange })
          : child
      )}
    </View>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; currentValue?: string; onValueChange?: (value: string) => void }> = ({ 
  children, 
  currentValue, 
  onValueChange 
}) => {
  return (
    <View style={styles.tabsList}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as any, { currentValue, onValueChange })
          : child
      )}
    </View>
  );
};

export const TabsTrigger: React.FC<{ 
  children: React.ReactNode; 
  value: string; 
  currentValue?: string; 
  onValueChange?: (value: string) => void 
}> = ({ children, value, currentValue, onValueChange }) => {
  const isActive = currentValue === value;
  
  return (
    <TouchableOpacity 
      style={[styles.tabsTrigger, isActive && styles.tabsTriggerActive]}
      onPress={() => onValueChange?.(value)}
    >
      <Text style={[styles.tabsTriggerText, isActive && styles.tabsTriggerTextActive]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export const TabsContent: React.FC<{ children: React.ReactNode; value: string; currentValue?: string }> = ({ 
  children, 
  value, 
  currentValue 
}) => {
  if (currentValue !== value) return null;
  
  return <View style={styles.tabsContent}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsList: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabsTrigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabsTriggerActive: {
    borderBottomColor: '#3b82f6',
  },
  tabsTriggerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabsTriggerTextActive: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  tabsContent: {
    flex: 1,
    padding: 16,
  },
});