import React, { useEffect, useState } from 'react';
import { Stack } from "expo-router";
import { AlertProvider } from "../components/AlertProvider";
import OfflineBanner from "../components/OfflineBanner";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from 'react-error-boundary';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider } from '../contexts/AppContext';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#000' }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
        {error.message}
      </Text>
      <Text style={{ fontSize: 12, color: '#999', marginBottom: 20, textAlign: 'center' }}>
        {error.stack?.substring(0, 200)}
      </Text>
      <Text
        style={{ color: '#007AFF', fontSize: 16, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}
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
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Load fonts
        console.log('Loading fonts...');
        await Font.loadAsync({
          ...Ionicons.font,
          'Montserrat-Black': require('../assets/fonts/Montserrat-Black.ttf'),
          'Montserrat-ExtraBold': require('../assets/fonts/Montserrat-ExtraBold.ttf'),
          'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
          'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
          'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
          'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
          'Montserrat-Light': require('../assets/fonts/Montserrat-Light.ttf'),
          'Montserrat-ExtraLight': require('../assets/fonts/Montserrat-ExtraLight.ttf'),
        });
        console.log('Fonts loaded successfully');

      } catch (e) {
        console.error('Error loading fonts:', e);
      } finally {
        // Tell the application to render the child components
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppProvider>
        <AlertProvider>
          <View style={styles.container}>
            <OfflineBanner />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#fff' },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
            </Stack>
          </View>
        </AlertProvider>
      </AppProvider>
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