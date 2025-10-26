import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  [key: string]: any;
}

export const Dialog: React.FC<DialogProps> = ({ children, open = false, onOpenChange, ...props }) => {
  return (
    <Modal visible={open} transparent animationType="fade" {...props}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

export const DialogContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.dialogContent}>{children}</View>;
};

export const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.dialogHeader}>{children}</View>;
};

export const DialogTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Text style={styles.dialogTitle}>{children}</Text>;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '90%',
  },
  dialogContent: {
    flex: 1,
  },
  dialogHeader: {
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});