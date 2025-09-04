import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Store email for reset process
      await AsyncStorage.setItem("resetEmail", email);
      
      // Simulate API delay
      setTimeout(async () => {
        setIsLoading(false);
        
        // Show success alert and navigate immediately
        Alert.alert(
          "Reset Link Sent!",
          `A password reset link has been sent to ${email}. You'll be redirected to reset your password.`,
          [
            {
              text: "Continue",
              onPress: () => {
                router.push("/auth/reset-password");
              }
            }
          ]
        );
      }, 1000);
      
    } catch (error) {
      console.error("Error sending reset link:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to send reset link. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={['#ff7e5f', '#feb47b']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          No worries! Enter your email address and we'll send you a link to reset your password.
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.sendButton, isLoading && styles.disabledButton]} 
        onPress={handleSendResetLink}
        disabled={isLoading}
      >
        <Text style={styles.sendButtonText}>
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.backToSignInLink}
        onPress={() => router.back()}
      >
        <Text style={styles.backToSignInText}>
          Remember your password? <Text style={styles.linkText}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    marginBottom: 40,
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
  sendButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  sendButtonText: {
    color: "#ff7e5f",
    fontSize: 16,
    fontWeight: "600",
  },
  backToSignInLink: {
    alignItems: "center",
  },
  backToSignInText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  linkText: {
    color: "white",
    fontWeight: "600",
  },
});