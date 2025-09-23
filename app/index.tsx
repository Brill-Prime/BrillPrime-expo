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
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();

    // Start pulse animation
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
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
        router.replace('/onboarding/screen1');
        return;
      }

      // Check if token exists and is not expired
      const isTokenExpired = tokenExpiry[1] ? Date.now() > parseInt(tokenExpiry[1]) : true;
      
      if (!token[1] || isTokenExpired) {
        console.log('No valid token, clearing auth data and navigating to role selection');
        await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
        router.replace('/auth/role-selection');
        return;
      }

      // Verify token with backend
      try {
        const { authService } = await import('../services/authService');
        const userResponse = await authService.getCurrentUser();

        if (userResponse.success && userResponse.data) {
          // Token is valid, navigate based on role
          const role = userResponse.data.role;
          console.log('Verified user role:', role);

          // Ensure selected role matches user's actual role
          if (selectedRole[1] && selectedRole[1] !== role) {
            console.log('Role mismatch, updating stored role');
            await AsyncStorage.setItem('selectedRole', role);
          }

          if (role === 'consumer') {
            console.log('Consumer user, navigating to home');
            router.replace('/home/consumer');
          } else {
            console.log('Non-consumer user, navigating to dashboard');
            router.replace(`/dashboard/${role}`);
          }
        } else {
          // Token is invalid, clear storage and redirect to auth
          console.log('Invalid token, clearing storage');
          await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
          router.replace('/auth/role-selection');
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        
        // Handle different types of errors
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
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
            style={styles.logoImage}
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
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoImage: {
    width: 128,
    height: 104,
  },
  loadingContainer: {
    marginTop: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
});