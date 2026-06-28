
import { StyleSheet, Platform } from 'react-native';

export const platformStyles = {
  // Shadow styles that work across platforms
  shadow: (elevation: number = 2) => {
    if (Platform.OS === 'ios') {
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: elevation },
        shadowOpacity: 0.1 + (elevation * 0.05),
        shadowRadius: elevation * 2,
      };
    } else {
      return {
        elevation: elevation * 2,
      };
    }
  },

  // Consistent text styling
  text: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'sans-serif',
    }),
  },

  // Consistent input styling
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },

  // Consistent button styling
  button: {
    borderRadius: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

// Helper to merge platform-specific styles
export const mergeStyles = (...styles: any[]) => {
  return StyleSheet.flatten(styles);
};
