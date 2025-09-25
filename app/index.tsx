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
    let isMounted = true;

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
    const pulseAnimation = Animated.loop(
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
    );
    pulseAnimation.start();

    const checkAuthState = async () => {
      if (!isMounted) return;

      try {
        const [onboarding, token, tokenExpiry] = await AsyncStorage.multiGet([
          'hasSeenOnboarding', 
          'userToken', 
          'tokenExpiry'
        ]);

        console.log('hasSeenOnboarding:', onboarding[1]);
        console.log('userToken:', token[1]);

        // Wait for animations to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!isMounted) return;

        if (!onboarding[1]) {
          console.log('First time user, navigating to onboarding');
          router.replace('/onboarding/screen1');
          return;
        }

        // Check if token exists and is not expired
        const isTokenExpired = tokenExpiry[1] ? Date.now() > parseInt(tokenExpiry[1]) : true;

        if (!token[1] || isTokenExpired) {
          console.log('No valid token, navigating to role selection');
          await AsyncStorage.multiRemove(['userToken', 'userEmail', 'userRole', 'tokenExpiry']);
          router.replace('/auth/role-selection');
          return;
        }

        // Check cached role
        const role = await AsyncStorage.getItem('userRole');
        if (role && isMounted) {
          console.log('Using cached role:', role);
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
        } else {
          console.log('No cached role found, redirecting to role selection');
          router.replace('/auth/role-selection');
        }

      } catch (error) {
        console.error('Error checking auth state:', error);
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
  }, [router]);



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