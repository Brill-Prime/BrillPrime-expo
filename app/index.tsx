
import React, { useEffect, useRef } from "react";
import { Text, View, StyleSheet, Animated, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

        if (!hasSeenOnboarding) {
          // First time user - go to onboarding
          console.log('Navigating to onboarding screen 1');
          router.replace("/onboarding/screen1");
        } else if (userToken) {
          // Returning user with valid token - go to role selection then dashboard
          const userRole = await AsyncStorage.getItem("userRole");
          if (userRole) {
            console.log('Navigating to dashboard:', userRole);
            router.replace(`/dashboard/${userRole}`);
          } else {
            console.log('Navigating to role selection');
            router.replace("/auth/role-selection");
          }
        } else {
          // Returning user without token - go to sign in
          console.log('Navigating to role selection');
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
