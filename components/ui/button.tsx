import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onPress, 
  variant = 'default',
  size = 'default',
  icon,
  iconPosition = 'left',
  ...props 
}) => {
  return (
    <TouchableOpacity style={[styles.button, styles[variant], styles[size]]} onPress={onPress} {...props}>
      <View style={styles.content}>
        {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
        <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>{children}</Text>
        {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
      </View>
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
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  smText: {
    fontSize: 12,
  },
  lgText: {
    fontSize: 16,
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