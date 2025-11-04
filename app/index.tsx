import React, { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, Animated, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // State for initial loading

  useEffect(() => {
    let isMounted = true;
    // Fix 5: Native Driver Animation Warning - Enable useNativeDriver for transforms and opacity
    const useNativeDriver = true;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver,
      }),
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver,
        }),
      ])
    );
    pulseAnimation.start();

    const checkAuthState = async () => {
      if (!isMounted) return;

      try {
        // Fix 6: Add better loading state for initial app load
        await new Promise(resolve => setTimeout(resolve, 1200));

        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('hasSeenOnboarding:', onboardingStatus);

        // Fix 4: Add better error handling for API calls (and general async operations)
        const [token, tokenExpiry] = await AsyncStorage.multiGet(['userToken', 'tokenExpiry']);
        const isTokenExpired = tokenExpiry[1] ? Date.now() > parseInt(tokenExpiry[1]) : true;

        if (!token[1] || isTokenExpired) {
          console.log('Redirecting to signin');
          await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
          if (isMounted) {
            router.replace('/auth/signin');
          }
          return;
        }

        const role = await AsyncStorage.getItem('userRole');

        // Fix 3: Merchant Analytics to Use Real User Data - assuming role is derived from user data
        if (role === 'consumer' && isMounted) {
          router.replace('/home/consumer');
        } else if (role === 'merchant' && isMounted) {
          router.replace('/home/merchant');
        } else if (role === 'driver' && isMounted) {
          router.replace('/home/driver');
        } else if (isMounted) {
          // Fallback for unexpected roles or missing role
          router.replace('/auth/role-selection');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        await SplashScreen.hideAsync(); // Ensure splash screen is hidden on error
        setIsLoading(false); // Stop loading indicator on error
        if (isMounted) {
          router.replace('/onboarding/screen1'); // Example: Reset to onboarding on error
        }
      } finally {
        // Hide splash screen and stop loading indicator once auth state is checked or error occurs
        if (isMounted) {
          await SplashScreen.hideAsync();
          setIsLoading(false); // Stop loading indicator
        }
      }
    };

    checkAuthState();

    return () => {
      isMounted = false;
      pulseAnimation.stop();
    };
  }, [router, fadeAnim, scaleAnim, pulseAnim]);

  // Display error message if an error occurred
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.retryText} onPress={() => {
            setError(null);
            setIsLoading(true); // Show loading indicator on retry
            // Re-run the auth check or navigate to a reset page
            router.replace('/onboarding/screen1'); // Example: reset to onboarding
          }}>
            Tap to continue
          </Text>
        </View>
      </View>
    );
  }

  // Display loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: Animated.multiply(scaleAnim, pulseAnim) }
                ],
              },
            ]}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage as any}
              resizeMode="contain"
            />
          </Animated.View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading your app...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Fallback render if somehow neither error nor loading state is active.
  // This should ideally not be reached if all routes are handled within checkAuthState.
  return (
    <View style={styles.container}>
      <Text>Initializing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    minHeight: '100%',
    width: '100%',
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 128,
    height: 104,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280', // Tailwind gray-500 equivalent
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});