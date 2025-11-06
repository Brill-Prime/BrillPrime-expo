
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
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
        // Show splash for minimum duration
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Step 1: Check if user has seen onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('hasSeenOnboarding:', hasSeenOnboarding);

        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          console.log('Redirecting to onboarding');
          if (isMounted) {
            router.replace('/onboarding/screen1');
          }
          return;
        }

        // Step 2: Check if user has selected a role
        const selectedRole = await AsyncStorage.getItem('selectedRole');
        console.log('selectedRole:', selectedRole);

        if (!selectedRole) {
          // User has seen onboarding but hasn't selected role
          console.log('Redirecting to role selection');
          if (isMounted) {
            router.replace('/auth/role-selection');
          }
          return;
        }

        // Step 3: Check authentication status
        const [token, tokenExpiry] = await AsyncStorage.multiGet(['userToken', 'tokenExpiry']);
        const isTokenExpired = tokenExpiry[1] ? Date.now() > parseInt(tokenExpiry[1]) : true;

        if (!token[1] || isTokenExpired) {
          // User has selected role but not authenticated - check if they have an account
          console.log('Token expired or missing, checking for account');
          const userEmail = await AsyncStorage.getItem('userEmail');
          
          if (userEmail) {
            // User has registered before - go to sign in
            console.log('Redirecting to sign in');
            if (isMounted) {
              router.replace('/auth/signin');
            }
          } else {
            // New user - go to sign up
            console.log('Redirecting to sign up');
            if (isMounted) {
              router.replace('/auth/signup');
            }
          }
          
          // Clear expired token
          await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
          return;
        }

        // Step 4: User is authenticated - route to appropriate home screen
        const role = await AsyncStorage.getItem('userRole');
        console.log('User authenticated with role:', role);

        if (role === 'consumer' && isMounted) {
          router.replace('/home/consumer');
        } else if (role === 'merchant' && isMounted) {
          router.replace('/home/merchant');
        } else if (role === 'driver' && isMounted) {
          router.replace('/home/driver');
        } else if (isMounted) {
          // Fallback - role missing, go back to role selection
          router.replace('/auth/role-selection');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        if (isMounted) {
          // On error, start fresh with onboarding
          router.replace('/onboarding/screen1');
        }
      } finally {
        if (isMounted) {
          await SplashScreen.hideAsync();
          setIsLoading(false);
        }
      }
    };

    checkAuthState();

    return () => {
      isMounted = false;
      pulseAnimation.stop();
    };
  }, [router, fadeAnim, scaleAnim, pulseAnim]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.retryText} onPress={() => {
            setError(null);
            setIsLoading(true);
            router.replace('/onboarding/screen1');
          }}>
            Tap to continue
          </Text>
        </View>
      </View>
    );
  }

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
    paddingHorizontal: 20,
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
    color: '#6b7280',
    fontFamily: 'Montserrat-Regular',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'Montserrat-SemiBold',
    lineHeight: 24,
  },
  retryText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Montserrat-SemiBold',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
