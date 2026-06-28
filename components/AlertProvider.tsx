import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal, { AlertType } from './AlertModal';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  hideAlert: () => void;
  showSuccess: (title: string, message: string, onConfirm?: () => void) => void;
  showError: (title: string, message: string, onConfirm?: () => void) => void;
  showWarning: (title: string, message: string, onConfirm?: () => void) => void;
  showInfo: (title: string, message: string, onConfirm?: () => void) => void;
  showConfirmDialog: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => {
      setAlertConfig(null);
    }, 300); // Allow animation to complete
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'success',
      title,
      message,
      confirmText: 'Great!',
      onConfirm
    });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'error',
      title,
      message,
      confirmText: 'Try Again',
      onConfirm
    });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'warning',
      title,
      message,
      confirmText: 'OK',
      onConfirm
    });
  };

  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      type: 'info',
      title,
      message,
      confirmText: 'Got it',
      onConfirm
    });
  };

  const showConfirmDialog = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    showAlert({
      type: 'warning',
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showCancelButton: true,
      onConfirm,
      onCancel
    });
  };

  const handleClose = () => {
    if (alertConfig?.onCancel) {
      alertConfig.onCancel();
    }
    hideAlert();
  };

  const handleConfirm = () => {
    if (alertConfig?.onConfirm) {
      alertConfig.onConfirm();
    }
    hideAlert();
  };

  const contextValue: AlertContextType = {
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirmDialog
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {alertConfig && (
        <AlertModal
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          showCancelButton={alertConfig.showCancelButton}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      )}
    </AlertContext.Provider>
  );
};