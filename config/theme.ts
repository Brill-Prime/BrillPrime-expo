
// Centralized theme configuration for consistent UI/UX
export const theme = {
  colors: {
    primary: '#4682B4',
    primaryDark: '#0B1A51',
    primaryLight: '#6B9FD8',
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    text: '#1B1B1B',
    textSecondary: '#666666',
    textLight: '#999999',
    white: '#FFFFFF',
    black: '#000000',
    error: '#E74C3C',
    success: '#27AE60',
    warning: '#F39C12',
    info: '#3498DB',
    border: '#E5E7EB',
    borderLight: '#F0F0F0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadow: '#000000',
  },
  
  typography: {
    fontFamily: {
      black: 'Montserrat-Black',
      extraBold: 'Montserrat-ExtraBold',
      bold: 'Montserrat-Bold',
      semiBold: 'Montserrat-SemiBold',
      medium: 'Montserrat-Medium',
      regular: 'Montserrat-Regular',
      light: 'Montserrat-Light',
      extraLight: 'Montserrat-ExtraLight',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 36,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // Responsive breakpoints
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
};

// Helper function for responsive values
export const getResponsiveValue = (
  screenWidth: number,
  mobileValue: number,
  tabletValue: number,
  desktopValue?: number
) => {
  if (screenWidth >= theme.breakpoints.desktop && desktopValue) {
    return desktopValue;
  }
  if (screenWidth >= theme.breakpoints.tablet) {
    return tabletValue;
  }
  return mobileValue;
};

// Helper function for responsive spacing
export const getResponsiveSpacing = (screenWidth: number, base: number) => {
  const multiplier = screenWidth >= theme.breakpoints.tablet ? 1.5 : 1;
  return Math.max(base, base * multiplier);
};

export default theme;
