import React, { useEffect, useState } from 'react';
import { Stack } from "expo-router";
import { AlertProvider } from "../components/AlertProvider";
import OfflineBanner from "../components/OfflineBanner";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as Font from 'expo-font';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
        {error.message}
      </Text>
      <Text 
        style={{ color: '#007AFF', fontSize: 16 }}
        onPress={resetErrorBoundary}
      >
        Try again
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // For web, we can add a quick check if fonts are even needed
    if (typeof window !== 'undefined' && window.document) {
      // Check if we're running in a web environment
      const isWeb = true;
      if (isWeb) {
        // On web, fonts might load slower, so we add fallback CSS
        const style = document.createElement('style');
        style.textContent = `
          * {
            font-family: 'Montserrat-Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      // For web, just skip font loading to avoid timeout issues
      if (typeof window !== 'undefined') {
        console.log('Web environment detected, skipping font loading');
        setFontsLoaded(true);
        return;
      }

      // Set a very short timeout for font loading on native
      const fontLoadPromise = Font.loadAsync({
        'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
        'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
        'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
        'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
      });

      // Add very short timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Font loading timeout')), 1000)
      );

      await Promise.race([fontLoadPromise, timeoutPromise]);
      setFontsLoaded(true);
    } catch (error) {
      console.log('Font loading error:', error);
      // Continue without custom fonts - this is important for web compatibility
      setFontsLoaded(true);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AlertProvider>
        <View style={styles.container}>
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#fff' },
              animation: 'fade',
            }}
          />
        </View>
      </AlertProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});