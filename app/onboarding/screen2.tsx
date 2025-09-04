import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function OnboardingScreen2() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/onboarding_img2.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Smart Financial{"\n"}Management</Text>
        <Text style={styles.description}>
          Track your expenses, manage multiple accounts, and make informed financial decisions with our advanced analytics
        </Text>
        
      </View>
      
      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
        </View>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => router.push("/onboarding/screen3")}
        >
          <Ionicons name="arrow-forward" size={20} color="white" />
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
    marginBottom: 32,
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
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgb(70, 130, 180)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});