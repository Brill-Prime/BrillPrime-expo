
import React, { useEffect } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const router = useRouter();
  const variant = process.env.APP_VARIANT || "main";

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Wait for 5 seconds (splash screen duration)
        setTimeout(async () => {
          if (variant === "admin") {
            router.replace("/admin-panel");
            return;
          }

          // Check if user is first time visitor
          const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
          const userToken = await AsyncStorage.getItem("userToken");

          if (!hasSeenOnboarding) {
            // First time user - go to onboarding
            router.replace("/onboarding/screen1");
          } else if (userToken) {
            // Returning user with valid token - go to role selection then dashboard
            const userRole = await AsyncStorage.getItem("userRole");
            if (userRole) {
              router.replace(`/dashboard/${userRole}`);
            } else {
              router.replace("/auth/role-selection");
            }
          } else {
            // Returning user without token - go to sign in
            router.replace("/auth/role-selection");
          }
        }, 5000);
      } catch (error) {
        console.error("Error checking user status:", error);
        // On error, default to onboarding
        router.replace("/onboarding/screen1");
      }
    };

    checkUserStatus();
  }, [router, variant]);

  if (variant === "admin") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Brill Prime Admin Panel</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#a855f7']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>BrillPrime</Text>
        <Text style={styles.tagline}>Your All-in-One Platform</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
