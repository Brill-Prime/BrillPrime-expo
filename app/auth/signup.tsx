import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("consumer"); // Added state for role selection

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    // Split fullName into firstName and lastName
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts.length > 0 ? nameParts[0] : '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    if (!formData.email.trim() || !formData.email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      // Import authService for real API calls
      const { authService } = await import('../../services/authService');

      const response = await authService.signUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.fullName.split(' ')[0], // Extract first name
        lastName: formData.fullName.split(' ').slice(1).join(' '), // Extract last name
        role: selectedRole || "consumer",
        phoneNumber: formData.phone
      });

      if (response.success && response.data) {
        // Store temporary data for OTP verification
        await AsyncStorage.setItem("tempUserEmail", formData.email);
        await AsyncStorage.setItem("tempUserRole", selectedRole || "consumer");

        router.push("/auth/otp-verification");
      } else {
        Alert.alert("Sign Up Failed", response.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      Alert.alert("Error", "Sign up failed. Please try again.");
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Coming Soon", `${provider} login will be available soon!`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sign Up</Text>
          </View>

          {/* Full Name Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange("fullName", value)}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                placeholder="Phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => handleInputChange("password", value)}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.rightIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange("confirmPassword", value)}
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.rightIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Selection (Example: Consumer, Merchant) */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <Text style={styles.roleLabel}>Role:</Text>
              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'consumer' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('consumer')}
              >
                <Text style={[styles.roleButtonText, selectedRole === 'consumer' && styles.roleButtonTextSelected]}>Consumer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, selectedRole === 'merchant' && styles.roleButtonSelected]}
                onPress={() => setSelectedRole('merchant')}
              >
                <Text style={[styles.roleButtonText, selectedRole === 'merchant' && styles.roleButtonTextSelected]}>Merchant</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Terms of Service */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By clicking the button above you agree to the Brill Prime{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Google")}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Apple")}
            >
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Facebook")}
            >
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signin")}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY_COLOR = "rgb(11, 26, 81)";
const GRAY_400 = "#9CA3AF";
const GRAY_600 = "#6B7280";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  rightIcon: {
    marginLeft: 12,
  },
  signUpButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  termsContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 14,
    color: GRAY_600,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 256,
  },
  termsLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#000000",
  },
  dividerText: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: "rgb(19, 19, 19)",
    fontWeight: "300",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    color: "rgb(19, 19, 19)",
    fontWeight: "300",
  },
  signInLink: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },
  // Styles for role selection
  roleLabel: {
    fontSize: 16,
    color: "#111827",
    marginRight: 10,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GRAY_400,
    marginHorizontal: 5,
  },
  roleButtonSelected: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  roleButtonText: {
    fontSize: 14,
    color: GRAY_400,
  },
  roleButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});