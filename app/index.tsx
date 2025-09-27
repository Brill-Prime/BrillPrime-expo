import React, { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, Animated, Image, ActivityIndicator } from "react-native";
import { useRouter, Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from 'expo-splash-screen';

// ✅ DEPLOYMENT READY - DO NOT EDIT WITHOUT TEAM APPROVAL
// This splash screen component is complete and tested
// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent() {
  const router = useRouter();
  const variant = process.env.APP_VARIANT || "main";

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // State to track onboarding status
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let navigationTimeout: NodeJS.Timeout;

    // Disable native driver on web to prevent warnings
    const useNativeDriver = typeof window === 'undefined';
    
    // Start animations immediately
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

    // Start pulse animation
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

    const checkAuthStateAndOnboarding = async () => {
      if (!isMounted) return;

      try {
        // Check onboarding status first
        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('hasSeenOnboarding:', onboardingStatus);
        
        if (isMounted) {
          setHasSeenOnboarding(onboardingStatus === 'true');
        }

        // Shorter delay to prevent timeout
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!isMounted) return;

        // Set up timeout for navigation
        navigationTimeout = setTimeout(async () => {
          if (isMounted) {
            console.log('Navigation timeout, forcing redirect to onboarding');
            await SplashScreen.hideAsync();
            try {
              router.replace('/onboarding/screen1');
            } catch (e) {
              console.error('Navigation error:', e);
              router.replace('/(tabs)');
            }
          }
        }, 2000);

        // If onboarding hasn't been seen, redirect to onboarding
        if (onboardingStatus !== 'true') {
          console.log('User has not seen onboarding, navigating to onboarding');
          clearTimeout(navigationTimeout);
          if (typeof window === 'undefined') {
            await SplashScreen.hideAsync();
          }
          try {
            router.replace('/onboarding/screen1');
          } catch (e) {
            console.error('Navigation error, trying alternative route:', e);
            router.replace('/(tabs)');
          }
          return;
        }

        // If onboarding has been seen, proceed to check authentication
        const [token, tokenExpiry] = await AsyncStorage.multiGet(['userToken', 'tokenExpiry']);

        console.log('userToken:', token[1]);

        const isTokenExpired = tokenExpiry[1] ? Date.now() > parseInt(tokenExpiry[1]) : true;

        if (!token[1] || isTokenExpired) {
          console.log('No valid token or token expired, navigating to signin');
          await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
          clearTimeout(navigationTimeout);
          if (typeof window === 'undefined') {
            await SplashScreen.hideAsync();
          }
          try {
            router.replace('/auth/signin');
          } catch (e) {
            console.error('Navigation error:', e);
            router.replace('/(tabs)');
          }
          return;
        }

        // Check cached role
        const role = await AsyncStorage.getItem('userRole');
        if (role && isMounted) {
          console.log('Using cached role:', role);
          clearTimeout(navigationTimeout);
          if (typeof window === 'undefined') {
            await SplashScreen.hideAsync();
          }
          try {
            switch (role) {
              case 'consumer':
                router.replace('/home/consumer');
                break;
              case 'merchant':
                router.replace('/home/merchant');
                break;
              case 'driver':
                router.replace('/home/driver');
                break;
              default:
                router.replace('/auth/role-selection');
            }
          } catch (e) {
            console.error('Role navigation error:', e);
            router.replace('/(tabs)');
          }
        } else {
          console.log('No cached role found, redirecting to role selection');
          clearTimeout(navigationTimeout);
          if (typeof window === 'undefined') {
            await SplashScreen.hideAsync();
          }
          try {
            router.replace('/auth/role-selection');
          } catch (e) {
            console.error('Navigation error:', e);
            router.replace('/(tabs)');
          }
        }

      } catch (error) {
        console.error('Error checking auth state:', error);
        if (isMounted) {
          clearTimeout(navigationTimeout);
          if (typeof window === 'undefined') {
            await SplashScreen.hideAsync();
          }
          // Fallback to onboarding if any error occurs during auth check
          try {
            router.replace('/onboarding/screen1');
          } catch (e) {
            console.error('Fallback navigation error:', e);
            router.replace('/(tabs)');
          }
        }
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    // Add delay before starting auth check to allow router to initialize
    const initTimeout = setTimeout(() => {
      checkAuthStateAndOnboarding();
    }, 100);

    return () => {
      isMounted = false;
      pulseAnimation.stop();
      clearTimeout(navigationTimeout);
      clearTimeout(initTimeout);
    };
  }, [router, fadeAnim, scaleAnim, pulseAnim])

  // Render loading state until auth and onboarding are checked
  if (hasSeenOnboarding === null || !authChecked) {
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
          </View>
        </View>
      </View>
    );
  }

  // This should not be reached due to useEffect redirects, but keeping as fallback
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
        </View>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
});