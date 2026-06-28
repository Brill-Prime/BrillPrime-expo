import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'warning';
  [key: string]: any;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', ...props }) => {
  return (
    <View style={[styles.badge, styles[variant]]} {...props}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#f3f4f6',
  },
  success: {
    backgroundColor: '#dcfce7',
  },
  destructive: {
    backgroundColor: '#fecaca',
  },
  warning: {
    backgroundColor: '#fef3c7',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  defaultText: {
    color: '#374151',
  },
  successText: {
    color: '#166534',
  },
  destructiveText: {
    color: '#dc2626',
  },
  warningText: {
    color: '#a16207',
  },
});