import React, { useEffect, useRef } from "react";
import { Text, View, StyleSheet, Animated, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ DEPLOYMENT READY - DO NOT EDIT WITHOUT TEAM APPROVAL
// This splash screen component is complete and tested
export default function SplashScreen() {
  const router = useRouter();
  const variant = process.env.APP_VARIANT || "main";

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animations immediately
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulse();

    const checkAuthState = async () => {
    try {
      const [onboarding, token, tokenExpiry, selectedRole] = await AsyncStorage.multiGet([
        'hasSeenOnboarding', 
        'userToken', 
        'tokenExpiry',
        'selectedRole'
      ]);

      console.log('hasSeenOnboarding:', onboarding[1]);
      console.log('userToken:', token[1]);
      console.log('selectedRole:', selectedRole[1]);

      if (!onboarding[1]) {
        console.log('First time user, navigating to onboarding');
        setTimeout(() => router.replace('/onboarding/screen1'), 1500);
        return;
      }

      // Check if token exists and is not expired
      const isTokenExpired = tokenExpiry[1] ? Date.now() > parseInt(tokenExpiry[1]) : true;

      if (!token[1] || isTokenExpired) {
        console.log('No valid token, clearing auth data and navigating to role selection');
        await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
        setTimeout(() => router.replace('/auth/role-selection'), 1500);
        return;
      }

      // Verify token with backend
      try {
        const { authService } = await import('../services/authService');
        const userResponse = await authService.getCurrentUser();

        if (userResponse.success && userResponse.data) {
          // Token is valid, navigate to home page for all users
          const role = userResponse.data.role;
          console.log('Verified user role:', role);
          console.log('Navigating to home page');
          router.replace('/home/consumer');
        } else {
          // Token is invalid, clear storage and redirect to auth
          console.log('Invalid token, clearing storage');
          await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
          router.replace('/auth/role-selection');
        }
      } catch (error) {
        console.error('Error verifying token:', error);

        // Handle different types of errors
        if ((error as Error).message?.includes('network') || (error as Error).message?.includes('fetch')) {
          console.log('Network error, using cached data');
          // On network error, try to navigate based on stored role if token hasn't expired
          if (!isTokenExpired) {
            const role = await AsyncStorage.getItem('userRole');
            if (role) {
              if (role === 'consumer') {
                router.replace('/home/consumer');
              } else {
                router.replace(`/dashboard/${role}`);
              }
              return;
            }
          }
        }

        // Clear invalid auth data and redirect to role selection
        console.log('Clearing invalid auth data due to error');
        await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
        router.replace('/auth/role-selection');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      router.replace('/onboarding/screen1');
    }
  };

    checkAuthState();
  }, [router, variant, fadeAnim, scaleAnim, pulseAnim]);

  if (variant === "admin") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Brill Prime Admin Panel</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim }
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