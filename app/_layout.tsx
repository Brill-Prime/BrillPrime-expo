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
    // Skip all font loading to prevent timeouts and crashes
    console.log('Skipping font loading to prevent timeouts');
    
    // Set up CSS fallbacks for web
    if (typeof window !== 'undefined' && window.document) {
      const style = document.createElement('style');
      style.textContent = `
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    setFontsLoaded(true);
  }, []);

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