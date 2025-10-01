
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ 
  children, 
  onPress, 
  variant = 'default', 
  size = 'default',
  disabled = false,
  style,
  textStyle
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyles}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  default: {
    backgroundColor: '#4682B4',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  secondary: {
    backgroundColor: '#f8f9fa',
  },
  destructive: {
    backgroundColor: '#dc3545',
  },
  size_default: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  size_sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  size_lg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  text_default: {
    color: 'white',
  },
  text_outline: {
    color: '#4682B4',
  },
  text_secondary: {
    color: '#333',
  },
  text_destructive: {
    color: 'white',
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
