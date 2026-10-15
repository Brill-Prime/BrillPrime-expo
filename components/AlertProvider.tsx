import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AlertModal, { AlertType } from './AlertModal';

export interface TextPromptConfig {
  title: string;
  message: string;
  defaultValue?: string;
  confirmText?: string;
  multiline?: boolean;
}

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
  promptText: (config: TextPromptConfig) => Promise<string | null>;
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
  const [promptConfig, setPromptConfig] = useState<TextPromptConfig | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const promptResolver = useRef<((value: string | null) => void) | null>(null);

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

  const promptText = (config: TextPromptConfig): Promise<string | null> => {
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        Alert.prompt(
          config.title,
          config.message,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
            {
              text: config.confirmText || 'OK',
              onPress: (value) => resolve(value ?? ''),
            },
          ],
          'plain-text',
          config.defaultValue || '',
        );
      });
    }

    if (promptResolver.current) {
      promptResolver.current(null);
    }
    setPromptValue(config.defaultValue || '');
    setPromptConfig(config);
    return new Promise((resolve) => {
      promptResolver.current = resolve;
    });
  };

  const finishPrompt = (value: string | null) => {
    const resolve = promptResolver.current;
    promptResolver.current = null;
    setPromptConfig(null);
    setPromptValue('');
    resolve?.(value);
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
    showConfirmDialog,
    promptText,
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
      <Modal
        visible={promptConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={() => finishPrompt(null)}
      >
        <KeyboardAvoidingView
          style={promptStyles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={promptStyles.dialog}>
            <Text style={promptStyles.title}>{promptConfig?.title}</Text>
            <Text style={promptStyles.message}>{promptConfig?.message}</Text>
            <TextInput
              autoFocus
              value={promptValue}
              onChangeText={setPromptValue}
              multiline={promptConfig?.multiline}
              textAlignVertical={promptConfig?.multiline ? 'top' : 'center'}
              returnKeyType={promptConfig?.multiline ? 'default' : 'done'}
              onSubmitEditing={() => {
                if (!promptConfig?.multiline) finishPrompt(promptValue);
              }}
              style={[
                promptStyles.input,
                promptConfig?.multiline && promptStyles.multilineInput,
              ]}
              accessibilityLabel={promptConfig?.title}
            />
            <View style={promptStyles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => finishPrompt(null)}
                style={promptStyles.actionButton}
              >
                <Text style={promptStyles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => finishPrompt(promptValue)}
                style={promptStyles.actionButton}
              >
                <Text style={promptStyles.confirmText}>
                  {promptConfig?.confirmText || 'OK'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AlertContext.Provider>
  );
};

const promptStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 8,
  },
  title: {
    color: '#0B1A51',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1f2937',
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 112,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  cancelText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmText: {
    color: '#4682B4',
    fontSize: 15,
    fontWeight: '700',
  },
});