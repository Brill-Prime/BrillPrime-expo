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

  useEffect(() => {
    let isMounted = true;
    const useNativeDriver = false;

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
        await new Promise(resolve => setTimeout(resolve, 1200));

        const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
        console.log('hasSeenOnboarding:', onboardingStatus);

        await SplashScreen.hideAsync();

        if (onboardingStatus !== 'true') {
          console.log('Redirecting to onboarding');
          if (isMounted) {
            router.replace('/onboarding/screen1');
          }
          return;
        }

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

        if (role === 'consumer' && isMounted) {
          router.replace('/home/consumer');
        } else if (role === 'merchant' && isMounted) {
          router.replace('/home/merchant');
        } else if (role === 'driver' && isMounted) {
          router.replace('/home/driver');
        } else if (isMounted) {
          router.replace('/auth/role-selection');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        await SplashScreen.hideAsync();
        if (isMounted) {
          router.replace('/onboarding/screen1');
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
            router.replace('/onboarding/screen1');
          }}>
            Tap to continue
          </Text>
        </View>
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