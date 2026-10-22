
import React, { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, Animated, Image, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from 'expo-splash-screen';
<<<<<<< HEAD
import { supabase } from '../config/supabase';
import { resolveAuthRoute, hasCompletedOnboarding } from '../utils/authFlow';
=======
import { getRoleHomeRoute, isUserRole } from '../utils/authRouting';
>>>>>>> 47a2137b6643748e86a12f8210e7c3009998f06d

void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn("Failed to keep native splash screen visible:", error);
});

export default function SplashScreenComponent() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const useNativeDriver = Platform.OS !== 'web';

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver,
    }).start();

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1000,
          useNativeDriver,
        }),
      ])
    );
    pulseAnimation.start();

    const checkAuthState = async () => {
      if (!isMounted) return;

      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const hasSeenOnboarding = hasCompletedOnboarding(await AsyncStorage.getItem('hasSeenOnboarding'));
        const [selectedRoleValue, userRoleValue, userEmailValue, tokenValue, tokenExpiryValue] = await AsyncStorage.multiGet([
          'selectedRole',
          'userRole',
          'userEmail',
          'userToken',
          'tokenExpiry',
        ]);

        const selectedRole = selectedRoleValue[1];
        const userRole = userRoleValue[1];
        const userEmail = userEmailValue[1];
        const token = tokenValue[1];
        const tokenExpiry = tokenExpiryValue[1];

        const { data: sessionData } = await supabase.auth.getSession();
        const decision = resolveAuthRoute({
          hasSeenOnboarding,
          selectedRole,
          userRole,
          userEmail,
          token,
          tokenExpiry,
          hasSupabaseSession: !!sessionData?.session,
        });

        if (decision.route === 'onboarding' && isMounted) {
          router.replace('/onboarding/screen1');
          return;
        }

<<<<<<< HEAD
        if (decision.route === 'role-selection' && isMounted) {
          router.replace('/auth/role-selection');
          return;
        }

        if (decision.role && !userRole) {
          await AsyncStorage.setItem('userRole', decision.role);
        }

        if (decision.route === 'signin' && isMounted) {
          if (decision.role) await AsyncStorage.setItem('selectedRole', decision.role);
          router.replace('/auth/signin');
          return;
        }

        if (decision.route === 'signup' && isMounted) {
          if (decision.role) await AsyncStorage.setItem('selectedRole', decision.role);
          router.replace('/auth/signup');
          return;
        }

        if (decision.route === 'home' && decision.role && isMounted) {
          await AsyncStorage.setItem('userRole', decision.role);
          await AsyncStorage.setItem('selectedRole', decision.role);

          if (decision.role === 'consumer') {
            router.replace('/home/consumer');
          } else if (decision.role === 'merchant') {
            router.replace('/home/merchant');
          } else if (decision.role === 'driver') {
            router.replace('/home/driver');
          } else {
            router.replace('/auth/role-selection');
          }
=======
        // Supabase is the source of truth for both the session and the stored role.
        const { authService } = await import('../services/authService');
        const sessionResult = await authService.restoreSession();
        if (sessionResult?.success && sessionResult.data) {
          if (isMounted) {
            router.replace(getRoleHomeRoute(sessionResult.data.user.role) as never);
          }
          return;
        }

        const pendingUserData = await AsyncStorage.getItem('pendingUserData');
        if (pendingUserData) {
          if (isMounted) router.replace('/auth/otp-verification');
          return;
        }

        const selectedRole = await AsyncStorage.getItem('selectedRole');
        if (!isUserRole(selectedRole)) {
          if (isMounted) router.replace('/auth/role-selection');
          return;
>>>>>>> 47a2137b6643748e86a12f8210e7c3009998f06d
        }

        const userEmail = await AsyncStorage.getItem('userEmail');
        if (isMounted) router.replace(userEmail ? '/auth/signin' : '/auth/signup');
      } catch (error) {
        console.error('Error checking auth state:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        if (isMounted) {
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
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text 
            style={styles.retryText} 
            onPress={() => {
              setError(null);
              setIsLoading(true);
              router.replace('/onboarding/screen1');
            }}
          >
            Tap to continue
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: pulseAnim }
              ],
            },
          ]}
        >
          {logoFailed ? (
            <Text style={{ color: '#2563eb', fontSize: 48, fontWeight: 'bold' }}>BP</Text>
          ) : (
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              onError={() => setLogoFailed(true)}
              accessibilityLabel="BrillPrime Logo"
            />
          )}
        </Animated.View>
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
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    height: '100%',
  },
  logoImage: {
    width: 200,
    height: 200,
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
