import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OnboardingScreen3() {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      // Navigate to role selection
      router.replace("/auth/role-selection");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/auth/role-selection");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/onboarding_img3.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Bank-Level{"\n"}Security</Text>
        <Text style={styles.description}>
          Your data is protected with end-to-end encryption, biometric authentication, and advanced fraud detection
        </Text>
        
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>
        
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  imageContainer: {
    width: 240,
    height: 280,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "rgb(11, 26, 81)",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    color: "rgb(136, 136, 136)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 60,
    maxWidth: 280,
    fontWeight: "300",
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgb(224, 224, 224)",
  },
  activeDot: {
    backgroundColor: "rgb(11, 26, 81)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 32,
  },
  getStartedButton: {
    backgroundColor: "rgb(70, 130, 180)",
    borderRadius: 30,
    paddingHorizontal: 32,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  getStartedButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});