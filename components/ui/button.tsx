import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onPress, 
  variant = 'default',
  size = 'default',
  ...props 
}) => {
  return (
    <TouchableOpacity style={[styles.button, styles[variant]]} onPress={onPress} {...props}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    backgroundColor: '#000',
  },
  destructive: {
    backgroundColor: '#dc2626',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  defaultText: {
    color: '#fff',
  },
  destructiveText: {
    color: '#fff',
  },
  outlineText: {
    color: '#000',
  },
});