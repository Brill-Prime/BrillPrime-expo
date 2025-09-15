
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

    const checkUserStatus = async () => {
      try {
        // Wait for 5 seconds (splash screen duration)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        if (variant === "admin") {
          router.replace("/admin-panel");
          return;
        }

        console.log('SPLASH SCREEN NAVIGATION STARTED');

        // Check if user is first time visitor
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        const userToken = await AsyncStorage.getItem("userToken");

        console.log('hasSeenOnboarding:', hasSeenOnboarding);
        console.log('userToken:', userToken ? 'exists' : 'null');
        console.log('Navigation condition check: hasSeenOnboarding is', hasSeenOnboarding === null ? 'null' : hasSeenOnboarding);

        if (hasSeenOnboarding === null) {
          // First time user - show onboarding
          console.log('First time user, navigating to onboarding');
          router.replace("/onboarding/screen1");
        } else if (userToken) {
          // Returning user with token - go to appropriate home screen
          const userRole = await AsyncStorage.getItem("userRole");
          console.log('Returning user with token, role:', userRole);
          if (userRole === "consumer") {
            router.replace("/home/consumer");
          } else {
            router.replace(`/dashboard/${userRole || "consumer"}`);
          }
        } else {
          // User has seen onboarding but no token - go to role selection
          console.log('User seen onboarding but no token, navigating to role selection');
          router.replace("/auth/role-selection");
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        // On error, default to onboarding
        console.log('Error occurred, navigating to onboarding');
        router.replace("/onboarding/screen1");
      }
    };

    checkUserStatus();
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
