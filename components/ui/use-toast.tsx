import { Alert } from 'react-native';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
  const message = description || title || 'Notification';
  Alert.alert(title || 'Notification', description || '', [{ text: 'OK' }]);
};

export default toast;