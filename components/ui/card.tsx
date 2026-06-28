
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../config/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, style, shadow = 'base', ...props }) => {
  const shadowStyles = {
    none: {},
    sm: { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)' },
    base: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)' },
    md: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)' },
    lg: { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)' }
  };
  
  return (
    <View style={[styles.card, shadowStyles[shadow], style]} {...props}>
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.cardTitle, style]} {...props}>
      {children}
    </Text>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  );
};

const { width } = Dimensions.get('window');

const getResponsiveValue = (baseValue: number) => {
  const scale = width / 375;
  return Math.round(baseValue * scale);
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: getResponsiveValue(theme.borderRadius.lg),
    padding: Math.max(theme.spacing.base, getResponsiveValue(16)),
    marginBottom: Math.max(theme.spacing.base, getResponsiveValue(12)),
  },
  cardHeader: {
    marginBottom: Math.max(theme.spacing.md, getResponsiveValue(12)),
  },
  cardTitle: {
    fontSize: Math.max(theme.typography.fontSize.lg, getResponsiveValue(18)),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  cardContent: {
    flex: 1,
  },
});
