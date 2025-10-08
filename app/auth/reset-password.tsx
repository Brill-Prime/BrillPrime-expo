import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    validateResetToken();
  }, []);

  const validateResetToken = async () => {
    try {
      const urlToken = params.token as string;
      const urlEmail = params.email as string;
      
      if (!urlToken || !urlEmail) {
        throw new Error("Invalid or missing token");
      }

      // Validate token with backend API
      const response = await fetch('https://api.brillprime.com/api/password-reset/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: urlEmail, 
          code: urlToken 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store email for password reset
        await AsyncStorage.setItem("resetEmail", urlEmail);
        await AsyncStorage.setItem("resetToken", urlToken);
        setIsValidToken(true);
        setIsLoading(false);
      } else {
        throw new Error(data.message || "Invalid or expired reset link");
      }
      
    } catch (error) {
      console.error("Token validation error:", error);
      setIsLoading(false);
      
      Alert.alert(
        "Invalid Reset Link",
        "This password reset link is invalid or has expired. Please request a new one.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/auth/forgot-password")
          }
        ]
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isValidPassword = (password: string) => {
    // At least 8 characters, one uppercase, one lowercase, one numeric, one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const getPasswordBorderColor = () => {
    const password = formData.newPassword;
    if (password.length === 0) return "rgb(70, 130, 180)";
    if (isValidPassword(password)) return "#10b981"; // Green for strong
    if (password.length >= 8) return "#f59e0b"; // Yellow for medium
    return "#ff6b6b"; // Red for weak
  };

  const getConfirmPasswordBorderColor = () => {
    const { newPassword, confirmPassword } = formData;
    if (confirmPassword.length === 0) return "rgb(70, 130, 180)";
    if (confirmPassword && newPassword !== confirmPassword) return "#ff6b6b";
    return "rgb(70, 130, 180)";
  };

  const handleResetPassword = async () => {
    const { newPassword, confirmPassword } = formData;

    if (newPassword.trim().length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    if (!isValidPassword(newPassword)) {
      Alert.alert("Error", "Password must contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match. Please try again.");
      return;
    }

    try {
      const resetEmail = await AsyncStorage.getItem("resetEmail");
      const resetToken = await AsyncStorage.getItem("resetToken");
      
      if (!resetEmail || !resetToken) {
        throw new Error("Reset session expired");
      }

      // Call backend API to complete password reset
      const response = await fetch('https://api.brillprime.com/api/password-reset/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
          code: resetToken,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Clean up reset tokens and data
        await AsyncStorage.removeItem("resetEmail");
        await AsyncStorage.removeItem("resetToken");
        
        Alert.alert(
          "Success!",
          "Password reset successfully! You can now log in with your new password.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth/signin")
            }
          ]
        );
      } else {
        throw new Error(data.message || "Failed to reset password");
      }
      
    } catch (error) {
      console.error("Error resetting password:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to reset password. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Validating reset link...</Text>
      </View>
    );
  }

  if (!isValidToken) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.errorText}>Invalid or expired reset link</Text>
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={() => router.replace("/auth/forgot-password")}
        >
          <Text style={styles.resetButtonText}>Request New Link</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Set New Password</Text>
      </View>

      {/* Password Field */}
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, { borderColor: getPasswordBorderColor() }]}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color="rgb(182, 182, 182)" 
            style={styles.leftIcon} 
          />
          <TextInput
            style={styles.input}
            value={formData.newPassword}
            onChangeText={(value) => handleInputChange("newPassword", value)}
            placeholder="Password"
            placeholderTextColor="rgb(182, 182, 182)"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="rgb(182, 182, 182)" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password Field */}
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, { borderColor: getConfirmPasswordBorderColor() }]}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color="rgb(182, 182, 182)" 
            style={styles.leftIcon} 
          />
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange("confirmPassword", value)}
            placeholder="Confirm Password"
            placeholderTextColor="rgb(182, 182, 182)"
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.rightIcon}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="rgb(182, 182, 182)" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reset Password Button */}
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={handleResetPassword}
      >
        <Text style={styles.resetButtonText}>Reset password</Text>
      </TouchableOpacity>
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
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 48,
  },
  logo: {
    width: 64,
    height: 52,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "rgb(11, 26, 81)",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "rgb(182, 182, 182)",
    fontWeight: "500",
  },
  rightIcon: {
    marginLeft: 12,
  },
  resetButton: {
    backgroundColor: "rgb(70, 130, 180)",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  resetButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 16,
    color: "rgb(11, 26, 81)",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    marginTop: 20,
    textAlign: "center",
  },
});