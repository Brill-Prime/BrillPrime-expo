import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ResetPassword() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetPassword = async () => {
    if (!formData.newPassword.trim() || !formData.confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (formData.newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const resetEmail = await AsyncStorage.getItem("resetEmail");
      const selectedRole = await AsyncStorage.getItem("selectedRole");
      
      const token = "user_token_" + Date.now();
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userEmail", resetEmail || "user@brillprime.com");
      await AsyncStorage.setItem("userRole", selectedRole || "consumer");
      
      await AsyncStorage.removeItem("resetEmail");
      
      Alert.alert(
        "Password Reset Successful!",
        "Your password has been updated successfully. You are now signed in.",
        [
          {
            text: "OK",
            onPress: () => router.replace(`/dashboard/${selectedRole || "consumer"}`)
          }
        ]
      );
      
    } catch (error) {
      console.error("Error resetting password:", error);
      Alert.alert("Error", "Failed to reset password. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.wrapper} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={['#a8e6cf', '#88d8c0']}
        style={styles.container}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password below
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={formData.newPassword}
              onChangeText={(value) => handleInputChange("newPassword", value)}
              placeholder="Enter new password"
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange("confirmPassword", value)}
              placeholder="Confirm new password"
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
          <Text style={styles.resetButtonText}>Update Password</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push("/auth/signin")}
        >
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 64,
    height: 52,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d5a27",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#2d5a27",
    textAlign: "center",
    opacity: 0.8,
  },
  form: {
    gap: 20,
    marginBottom: 40,
  },
  inputContainer: {
    gap: 5,
  },
  label: {
    color: "#2d5a27",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "#2d5a27",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  resetButton: {
    backgroundColor: "#2d5a27",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
  },
  resetButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    alignItems: "center",
  },
  backButtonText: {
    color: "#2d5a27",
    fontSize: 14,
    opacity: 0.8,
  },
});