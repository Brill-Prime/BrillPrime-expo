import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';

type ThemeType = 'light' | 'dark' | 'system';

type ThemeColors = {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  success: string;
  warning: string;
  error: string;
  disabled: string;
  placeholder: string;
  backdrop: string;
};

type ThemeContextType = {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
};

const lightColors: ThemeColors = {
  primary: '#007AFF',
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E5E5EA',
  notification: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  disabled: '#D1D1D6',
  placeholder: '#8E8E93',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

const darkColors: ThemeColors = {
  primary: '#0A84FF',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#2C2C2E',
  notification: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  disabled: '#3A3A3C',
  placeholder: '#636366',
  backdrop: 'rgba(50, 50, 50, 0.5)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('system');
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const paperTheme = usePaperTheme();

  // Update isDark when theme or system color scheme changes
  useEffect(() => {
    if (theme === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

  // Update paper theme when dark mode changes
  useEffect(() => {
    paperTheme.dark = isDark;
    paperTheme.colors = {
      ...paperTheme.colors,
      primary: isDark ? darkColors.primary : lightColors.primary,
      onPrimary: isDark ? '#FFFFFF' : '#000000',
      primaryContainer: isDark ? '#1E1E1E' : '#F5F5F5',
      onPrimaryContainer: isDark ? '#E0E0E0' : '#212121',
      secondary: isDark ? '#BB86FC' : '#6200EE',
      onSecondary: isDark ? '#000000' : '#FFFFFF',
      secondaryContainer: isDark ? '#3700B3' : '#E0E0E0',
      onSecondaryContainer: isDark ? '#E0E0E0' : '#1E1E1E',
      background: isDark ? darkColors.background : lightColors.background,
      onBackground: isDark ? '#FFFFFF' : '#000000',
      surface: isDark ? darkColors.card : lightColors.card,
      onSurface: isDark ? '#FFFFFF' : '#000000',
      surfaceVariant: isDark ? '#424242' : '#E0E0E0',
      onSurfaceVariant: isDark ? '#E0E0E0' : '#424242',
      error: isDark ? darkColors.error : lightColors.error,
      onError: isDark ? '#000000' : '#FFFFFF',
      errorContainer: isDark ? '#8C1D18' : '#FFDAD6',
      onErrorContainer: isDark ? '#FFDAD6' : '#410002',
      outline: isDark ? '#8E8E93' : '#8E8E93',
      outlineVariant: isDark ? '#444444' : '#C7C7CC',
      shadow: isDark ? '#000000' : '#000000',
      scrim: isDark ? '#000000' : '#000000',
      inverseSurface: isDark ? '#E0E0E0' : '#2D2D2D',
      inverseOnSurface: isDark ? '#2D2D2D' : '#F5F5F5',
      inversePrimary: isDark ? '#6200EE' : '#BB86FC',
      elevation: {
        level0: 'transparent',
        level1: isDark ? '#1E1E1E' : '#F5F5F5',
        level2: isDark ? '#2D2D2D' : '#F0F0F0',
        level3: isDark ? '#363636' : '#EBEBEB',
        level4: isDark ? '#3B3B3B' : '#E9E9E9',
        level5: isDark ? '#3F3F3F' : '#E6E6E6',
      },
      surfaceDisabled: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      onSurfaceDisabled: isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)',
      backdrop: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    };
  }, [isDark, paperTheme]);

  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
