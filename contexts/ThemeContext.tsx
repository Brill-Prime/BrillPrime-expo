import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

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

  // Update isDark when theme or system color scheme changes
  useEffect(() => {
    if (theme === 'system') {
      setIsDark(systemColorScheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme, systemColorScheme]);

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
