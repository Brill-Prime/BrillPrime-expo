import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignIn = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!formData.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      // For demo purposes, simulate successful sign in
      // In a real app, you would authenticate with your backend
      
      // Generate a mock token and save user session
      const mockToken = "user_token_" + Date.now();
      await AsyncStorage.setItem("userToken", mockToken);
      await AsyncStorage.setItem("userEmail", formData.email);
      
      // Get the selected role and navigate to appropriate dashboard
      const selectedRole = await AsyncStorage.getItem("selectedRole");
      await AsyncStorage.setItem("userRole", selectedRole || "consumer");
      
      // Navigate to dashboard
      router.replace(`/dashboard/${selectedRole || "consumer"}`);
    } catch (error) {
      console.error("Error signing in:", error);
      Alert.alert("Error", "Sign in failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              placeholder="Enter your password"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotPasswordLink}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpLink}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.signUpLinkText}>
            Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  form: {
    flex: 1,
    gap: 20,
  },
  inputContainer: {
    gap: 5,
  },
  label: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginTop: -5,
  },
  forgotPasswordText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 40,
  },
  signInButtonText: {
    color: "#f093fb",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpLink: {
    alignItems: "center",
    marginTop: 20,
  },
  signUpLinkText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  linkText: {
    color: "white",
    fontWeight: "600",
  },
});