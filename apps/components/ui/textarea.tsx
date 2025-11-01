import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  [key: string]: any;
}

export const Textarea: React.FC<TextareaProps> = ({ placeholder, value, onChangeText, ...props }) => {
  return (
    <TextInput
      style={styles.textarea}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    backgroundColor: '#fff',
  },
});