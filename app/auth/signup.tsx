import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../components/AlertProvider";
import AlertModal from "../../components/AlertModal";
import EmailIcon from '../../components/EmailIcon';
import LockIcon from '../../components/LockIcon';

export default function SignUp() {
  const router = useRouter();
  const { showError, showConfirmDialog, showInfo } = useAlert();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      showError("Error", "Please enter your full name");
      return false;
    }
    // Split fullName into firstName and lastName
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts.length > 0 ? nameParts[0] : '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    if (!formData.email.trim() || !formData.email.includes("@")) {
      showError("Error", "Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      showError("Error", "Please enter a valid phone number");
      return false;
    }
    if (formData.password.length < 6) {
      showError("Error", "Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showError("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    // Check if user has selected a role first
    const storedRole = await AsyncStorage.getItem("selectedRole");
    if (!storedRole) {
      showConfirmDialog(
        "Role Required",
        "Please select your role first.",
        () => router.replace("/auth/role-selection")
      );
      return;
    }

    // Use stored role instead of component state
    const finalRole = storedRole;

    setLoading(true);

    try {
      // Import authService for real API calls
      const { authService } = await import('../../services/authService');

      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await authService.signUp({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        role: finalRole,
        phoneNumber: formData.phone
      });

      if (response.success && response.data) {
        // Store pending user data for OTP verification
        const pendingUserData = {
          email: formData.email,
          firstName,
          lastName,
          role: finalRole,
          phoneNumber: formData.phone
        };

        await AsyncStorage.multiSet([
          ["pendingUserData", JSON.stringify(pendingUserData)],
          ["tempUserEmail", formData.email],
          ["tempUserRole", finalRole]
        ]);

        // Show OTP sent modal
        setShowOtpModal(true);
      } else {
        // Handle specific error cases
        const errorMessage = response.error || "Registration failed";
        if (errorMessage.includes("email already exists") || errorMessage.includes("already registered")) {
          showConfirmDialog(
            "Account Exists",
            "An account with this email already exists. Would you like to sign in instead?",
            () => router.push("/auth/signin")
          );
        } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
          showError("Network Error", "Please check your internet connection and try again.");
        } else if (errorMessage.includes("invalid email")) {
          showError("Invalid Email", "Please enter a valid email address.");
        } else if (errorMessage.includes("password too weak")) {
          showError("Weak Password", "Please choose a stronger password with at least 8 characters.");
        } else {
          showError("Sign Up Failed", errorMessage);
        }
      }
    } catch (error) {
      console.error("Error signing up:", error);

      // Handle network errors specifically
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        showError(
          "Connection Error",
          "Unable to connect to server. Please check your internet connection and try again."
        );
      } else {
        showError("Error", "Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'Google' | 'Apple' | 'Facebook') => {
    try {
      setLoading(true);

      // Check if user has selected a role first
      const selectedRole = await AsyncStorage.getItem("selectedRole");
      if (!selectedRole) {
        showConfirmDialog(
          "Role Required",
          "Please select your role first.",
          () => router.replace("/auth/role-selection")
        );
        setLoading(false);
        return;
      }

      // Import authService
      const { authService } = await import('../../services/authService');

      let response;
      if (provider === 'Google') {
        response = await authService.signInWithGoogle(selectedRole);
      } else if (provider === 'Apple') {
        response = await authService.signInWithApple(selectedRole);
      } else if (provider === 'Facebook') {
        response = await authService.signInWithFacebook(selectedRole);
      }

      if (response?.success && response.data) {
        // Store user data from API response
        await AsyncStorage.multiSet([
          ["userToken", response.data.token],
          ["userEmail", response.data.user.email],
          ["userRole", response.data.user.role],
          ["tokenExpiry", (Date.now() + (24 * 60 * 60 * 1000)).toString()]
        ]);

        // Route based on user role from API
        if (response.data.user.role === "consumer") {
          router.replace("/home/consumer");
        } else {
          router.replace(`/dashboard/${response.data.user.role}`);
        }
      } else {
        const errorMessage = response?.error || `${provider} sign-up failed`;
        if (errorMessage !== 'Sign-in cancelled') {
          showError("Sign Up Failed", errorMessage);
        }
      }
    } catch (error) {
      console.error(`${provider} sign-up error:`, error);
      showError("Error", `${provider} sign-up failed. Please try again.`);
    } finally {
      setLoading(false);
    }
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
              <EmailIcon size={20} color="#9CA3AF" style={styles.leftIcon} />
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
              <LockIcon size={20} color="#9CA3AF" style={styles.leftIcon} />
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
              <LockIcon size={20} color="#9CA3AF" style={styles.leftIcon} />
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


          {/* Sign Up Button */}
          <TouchableOpacity 
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]} 
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Text>
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

      {/* OTP Sent Modal */}
      <AlertModal
        visible={showOtpModal}
        type="success"
        title="OTP Sent!"
        message={`A verification code has been sent to ${formData.email}. Please check your email and enter the code to verify your account.`}
        onClose={() => {
          setShowOtpModal(false);
          router.push("/auth/otp-verification");
        }}
        confirmText="Continue"
      />
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
  signUpButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
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
});