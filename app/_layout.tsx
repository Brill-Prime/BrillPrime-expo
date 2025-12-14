import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { AlertProvider } from "../components/AlertProvider";
import OfflineBanner from "../components/OfflineBanner";
import { View, StyleSheet, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ErrorBoundary } from "react-error-boundary";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "../contexts/AppContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { MerchantProvider } from "../contexts/MerchantContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { useDeepLinking } from "../hooks/useDeepLinking";
import { analyticsService } from "../services/analyticsService";
import RealtimeNotificationBanner from "../components/RealtimeNotificationBanner";
import { ThemeProvider } from "../contexts/ThemeContext";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center",
          color: "#000",
        }}
      >
        Something went wrong
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {error.message}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: "#999",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {error.stack?.substring(0, 200)}
      </Text>
      <Text
        style={{
          color: "#007AFF",
          fontSize: 16,
          padding: 10,
          backgroundColor: "#f0f0f0",
          borderRadius: 5,
        }}
        onPress={resetErrorBoundary}
      >
        Try again
      </Text>
    </View>
  );
}

export default function RootLayout() {
  // Render immediately; let fonts load in background so the animated splash at app/index.tsx is visible
  useDeepLinking();

  useEffect(() => {
    (async () => {
      try {
        // Initialize analytics
        await analyticsService.initialize();

        // Load fonts in background
        console.log("Loading fonts...");
        try {
          await Font.loadAsync({
            ...Ionicons.font,
            "Montserrat-Black": require("../assets/fonts/Montserrat-Black.ttf"),
            "Montserrat-ExtraBold": require("../assets/fonts/Montserrat-ExtraBold.ttf"),
            "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
            "Montserrat-SemiBold": require("../assets/fonts/Montserrat-SemiBold.ttf"),
            "Montserrat-Medium": require("../assets/fonts/Montserrat-Medium.ttf"),
            "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
            "Montserrat-Light": require("../assets/fonts/Montserrat-Light.ttf"),
            "Montserrat-ExtraLight": require("../assets/fonts/Montserrat-ExtraLight.ttf"),
          });
          console.log("Fonts loaded successfully");
        } catch (fontError) {
          console.warn("Font loading failed, using system fonts:", fontError);
        }
      } catch (e) {
        console.error("Initialization error:", e);
      }
    })();
  }, []);

  // removed initial ActivityIndicator gate so splash animation can be shown for 5 seconds

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <AppProvider>
          <AuthProvider>
            <NotificationProvider>
              <MerchantProvider>
                <AlertProvider>
                  <View style={styles.container}>
                    <OfflineBanner />
                    <RealtimeNotificationBanner />
                    <AuthStateHandler />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: "transparent" },
                        animation: "fade",
                      }}
                    >
                      <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="auth"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="home"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="onboarding"
                        options={{ headerShown: false }}
                      />
                    </Stack>
                  </View>
                </AlertProvider>
              </MerchantProvider>
            </NotificationProvider>
          </AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Component to handle auth state and redirects
function AuthStateHandler() {
  const { isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    // Check if onboarding is completed
    const checkOnboardingStatus = async () => {
      const onboardingCompleted = await AsyncStorage.getItem(
        "hasSeenOnboarding"
      );
      setHasCompletedOnboarding(onboardingCompleted === "true");
    };
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (isLoading || hasCompletedOnboarding === null) return;

    if (!hasCompletedOnboarding) {
      // Redirect to first onboarding screen
      router.replace("/onboarding/screen1");
      return;
    }

    // Check if user has selected a role
    const checkRoleSelection = async () => {
      const selectedRole = await AsyncStorage.getItem("userRole");

      if (selectedRole) {
        // If role is selected, check authentication
        if (isAuthenticated) {
          // Redirect to appropriate home screen based on role
          if (selectedRole === "merchant") {
            router.replace("/merchant/home");
          } else if (selectedRole === "driver") {
            router.replace("/home/driver");
          } else if (selectedRole === "consumer") {
            router.replace("/home/consumer");
          }
        } else {
          // If not authenticated, go to sign-in
          router.replace("/auth/signin");
        }
      } else {
        // If no role selected, go to role selection first
        router.replace("/auth/role-selection");
      }
    };

    checkRoleSelection();
  }, [isAuthenticated, isLoading, role, hasCompletedOnboarding, router]);

  // Show loading indicator while checking auth state or onboarding status
  if (isLoading || hasCompletedOnboarding === null) {
    // Allow the dedicated splash screen (app/index.tsx) to remain visible instead of covering it here
    return null;
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
});
