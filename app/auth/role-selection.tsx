import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = "consumer" | "merchant" | "driver";

export default function RoleSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Please select a role", "Choose how you want to use BrillPrime");
      return;
    }

    try {
      await AsyncStorage.setItem("selectedRole", selectedRole);
      
      // Check if user has a token (returning user)
      const userToken = await AsyncStorage.getItem("userToken");
      
      if (userToken) {
        // Returning user - go to sign in
        router.push("/auth/signin");
      } else {
        // New user - go to sign up
        router.push("/auth/signup");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      Alert.alert("Error", "Please try again");
    }
  };

  const roleOptions = [
    {
      id: "consumer" as UserRole,
      title: "Consumer",
      description: "Shop and discover amazing products and services",
      emoji: "🛍️",
      gradient: ["#667eea", "#764ba2"] as const
    },
    {
      id: "merchant" as UserRole,
      title: "Merchant",
      description: "Sell your products and grow your business",
      emoji: "🏪",
      gradient: ["#f093fb", "#f5576c"] as const
    },
    {
      id: "driver" as UserRole,
      title: "Driver",
      description: "Deliver orders and earn money on your schedule",
      emoji: "🚗",
      gradient: ["#4facfe", "#00f2fe"] as const
    }
  ];

  return (
    <LinearGradient
      colors={['#2c3e50', '#3498db']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>How would you like to use BrillPrime?</Text>
      </View>

      <View style={styles.roleContainer}>
        {roleOptions.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.selectedRoleCard
            ]}
            onPress={() => handleRoleSelect(role.id)}
          >
            <LinearGradient
              colors={role.gradient}
              style={styles.roleGradient}
            >
              <Text style={styles.roleEmoji}>{role.emoji}</Text>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
              {selectedRole === role.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedRole && styles.disabledButton
        ]}
        onPress={handleContinue}
        disabled={!selectedRole}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  roleContainer: {
    flex: 1,
    gap: 20,
  },
  roleCard: {
    borderRadius: 15,
    overflow: "hidden",
  },
  selectedRoleCard: {
    transform: [{ scale: 1.02 }],
  },
  roleGradient: {
    padding: 25,
    alignItems: "center",
    position: "relative",
  },
  roleEmoji: {
    fontSize: 50,
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  checkmark: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#4facfe",
    fontSize: 16,
    fontWeight: "bold",
  },
  continueButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  continueButtonText: {
    color: "#2c3e50",
    fontSize: 16,
    fontWeight: "600",
  },
});