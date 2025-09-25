import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  [key: string]: any;
}

export const Card: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <View style={styles.card} {...props}>
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <View style={styles.cardHeader} {...props}>
      {children}
    </View>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <Text style={styles.cardTitle} {...props}>
      {children}
    </Text>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <View style={styles.cardContent} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  cardContent: {
    flex: 1,
  },
});