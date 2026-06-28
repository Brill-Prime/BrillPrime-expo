import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Image,
  Dimensions,
  Platform
} from 'react-native';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertModalProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const getAlertConfig = (type: AlertType) => {
  switch (type) {
    case 'success':
      return {
        icon: require('../assets/images/congratulations_icon.png'),
        backgroundColor: '#4CAF50',
        lightBackground: '#E8F5E8'
      };
    case 'error':
      return {
        icon: require('../assets/images/confirmation_fail_img.png'),
        backgroundColor: '#F44336',
        lightBackground: '#FFEBEE'
      };
    case 'warning':
      return {
        icon: require('../assets/images/congratulations_icon.png'),
        backgroundColor: '#FF9800',
        lightBackground: '#FFF3E0'
      };
    case 'info':
      return {
        icon: require('../assets/images/congratulations_icon.png'),
        backgroundColor: '#2196F3',
        lightBackground: '#E3F2FD'
      };
    default:
      return {
        icon: require('../assets/images/congratulations_icon.png'),
        backgroundColor: '#4CAF50',
        lightBackground: '#E8F5E8'
      };
  }
};

export default function AlertModal({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancelButton = false
}: AlertModalProps) {
  const config = getAlertConfig(type);
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.alertContainer,
            { 
              backgroundColor: config.lightBackground,
              transform: [{ scale: scaleValue }]
            }
          ]}
        >
          {/* Icon Section */}
          <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
            <Image 
              source={config.icon} 
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            {showCancelButton && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.confirmButton,
                { backgroundColor: config.backgroundColor },
                showCancelButton && styles.buttonWithMargin
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: Math.min(screenWidth - 40, 320),
    borderRadius: 20,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  icon: {
    width: 40,
    height: 40,
  },
  contentContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithMargin: {
    marginLeft: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});