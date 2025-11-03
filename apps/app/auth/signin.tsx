import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert, // Import Alert
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../../components/AlertProvider";
import EmailIcon from '../../components/EmailIcon';
import LockIcon from '../../components/LockIcon';

// Import authService here to ensure it's available for checkRedirectAuth
import { authService } from '../../services/authService';

export default function SignIn() {
  const router = useRouter();
  const { showError, showConfirmDialog, showInfo } = useAlert();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  // Placeholder for checkAuthStatus if it exists in the original code,
  // otherwise, it might be an artifact from the thought process.
  // Assuming it's meant to check current session or similar.
  const checkAuthStatus = async () => {
    // Placeholder for actual auth status check logic
    // For now, we'll just assume it's handled by the redirect check or sign-in process
  };

  useEffect(() => {
    checkAuthStatus();
    checkRedirectAuth();
  }, []);

  const checkRedirectAuth = async () => {
    try {
      const result = await authService.checkRedirectResult();
      if (result?.success && result.data) {
        // Successfully authenticated via redirect
        // Store auth data
        await AsyncStorage.multiSet([
          ["userToken", result.data.token],
          ["userEmail", result.data.user.email],
          ["userRole", result.data.user.role],
          ["selectedRole", result.data.user.role],
          ["tokenExpiry", (Date.now() + (24 * 60 * 60 * 1000)).toString()]
        ]);

        // Route based on user role
        if (result.data.user.role === "consumer") {
          router.replace("/(consumer)/(tabs)/home");
        } else if (result.data.user.role === "merchant") {
          router.replace("/(merchant)/(tabs)/home");
        } else if (result.data.user.role === "driver") {
          router.replace("/(driver)/(tabs)/home");
        }
      } else if (result?.error) {
        showError('Authentication Error', result.error);
      }
    } catch (error) {
      console.error('Redirect auth check error:', error);
    }
  };


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    setError(''); // Clear previous errors
    setLoading(true); // Set loading state

    if (!formData.email.trim() || !formData.password.trim()) {
      showError("Error", "Please fill in all fields");
      setLoading(false); // Reset loading state
      return;
    }

    if (!formData.email.includes("@")) {
      showError("Error", "Please enter a valid email address");
      setLoading(false); // Reset loading state
      return;
    }

    // Check if user has selected a role first
    const selectedRole = await AsyncStorage.getItem("selectedRole");
    if (!selectedRole) {
      showConfirmDialog(
        "Role Required",
        "Please select your role first.",
        () => router.replace("/auth/role-selection")
      );
      setLoading(false); // Reset loading state
      return;
    }

    try {
      const response = await authService.signIn({
        email: formData.email,
        password: formData.password,
        role: selectedRole // Include selected role
      });

      if (response.success && response.data) {
        // Validate that the user's role matches selected role
        if (response.data.user.role !== selectedRole) {
          showConfirmDialog(
            "Role Mismatch",
            `Your account is registered as ${response.data.user.role}, but you selected ${selectedRole}. Please select the correct role.`,
            () => router.replace("/auth/role-selection")
          );
          setLoading(false); // Reset loading state
          return;
        }

        // Store user data from API response
        await AsyncStorage.multiSet([
          ["userToken", response.data.token],
          ["userEmail", response.data.user.email],
          ["userRole", response.data.user.role],
          ["tokenExpiry", (Date.now() + (24 * 60 * 60 * 1000)).toString()] // 24 hours
        ]);

        // Route based on user role from API
        if (response.data.user.role === "consumer") {
          router.replace("/home/consumer" as any);
        } else if (response.data.user.role === "merchant") {
          router.replace("/home/merchant" as any);
        } else if (response.data.user.role === "driver") {
          router.replace("/home/driver" as any);
        }
      } else {
        // Handle specific error cases
        const errorMessage = response.error || "Invalid credentials";
        if (errorMessage.includes("Invalid credentials") || errorMessage.includes("authentication")) {
          showError("Sign In Failed", "Invalid email or password. Please check your credentials and try again.");
        } else if (errorMessage.includes("network") || errorMessage.includes("connection")) {
          showError("Network Error", "Please check your internet connection and try again.");
          setError('Unable to connect to server. Trying offline mode...');
        } else if (errorMessage.includes("account not found")) {
          showConfirmDialog(
            "Account Not Found",
            "No account found with this email. Would you like to sign up?",
            () => router.push("/auth/signup")
          );
        } else {
          showError("Sign In Failed", errorMessage);
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);

      // Handle network errors specifically
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        showError(
          "Connection Error",
          "Unable to connect to server. Please check your internet connection and try again."
        );
        setError('Unable to connect to server. Trying offline mode...');
      } else {
        showError("Error", "Sign in failed. Please try again.");
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false); // Reset loading state in finally block
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

      console.log(`Starting ${provider} sign-in with role:`, selectedRole);

      let response;
      if (provider === 'Google') {
        response = await authService.signInWithGoogle(selectedRole);
      } else if (provider === 'Apple') {
        response = await authService.signInWithApple(selectedRole);
      } else if (provider === 'Facebook') {
        response = await authService.signInWithFacebook(selectedRole);
      }

      console.log(`${provider} sign-in response:`, response);

      // Handle redirecting state
      if (response?.error?.includes('Redirecting')) {
        console.log(`Redirecting to ${provider} sign-in...`);
        return; // Don't reset loading, redirect in progress
      }

      // Common logic for successful social login
      if (response?.success && response.data) {
        console.log('Social login successful, storing data and routing...');

        // Validate that the user's role matches selected role
        if (response.data.user.role !== selectedRole) {
          showConfirmDialog(
            "Role Mismatch",
            `Your account is registered as ${response.data.user.role}, but you selected ${selectedRole}. Please select the correct role.`,
            () => router.replace("/auth/role-selection")
          );
          setLoading(false);
          return;
        }

        // Store user data from API response
        await AsyncStorage.multiSet([
          ["userToken", response.data.token],
          ["userEmail", response.data.user.email],
          ["userRole", response.data.user.role],
          ["tokenExpiry", (Date.now() + (24 * 60 * 60 * 1000)).toString()]
        ]);

        // Route based on user role from API
        if (response.data.user.role === "consumer") {
          router.replace("/home/consumer" as any);
        } else if (response.data.user.role === "merchant") {
          router.replace("/home/merchant" as any);
        } else if (response.data.user.role === "driver") {
          router.replace("/home/driver" as any);
        }
      } else if (response?.error && response.error !== 'Sign-in cancelled') {
        console.error(`${provider} sign-in failed:`, response.error);
        showError("Sign In Failed", response.error);
      }
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      const errorMsg = error instanceof Error ? error.message : `${provider} sign-in failed. Please try again.`;
      showError("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Logo + Title */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Sign In</Text>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <EmailIcon size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                placeholder="Email or phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
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

          {/* Error Message Display */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot password? Reset</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} disabled={loading}>
            <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Google")}
            >
              <Ionicons name="logo-google" size={screenData.width >= 768 ? 28 : 24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Apple")}
            >
              <Ionicons name="logo-apple" size={screenData.width >= 768 ? 28 : 24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin("Facebook")}
            >
              <Ionicons name="logo-facebook" size={screenData.width >= 768 ? 28 : 24} color="#1877F2" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Math.max(20, width * 0.06),
      paddingVertical: Math.max(24, height * 0.03),
      maxWidth: isTablet ? 500 : 400,
      alignSelf: "center",
      width: "100%",
      justifyContent: "center",
      minHeight: "100%",
    },
    header: {
      alignItems: "center",
      marginBottom: Math.max(24, height * 0.04),
    },
    logo: {
      width: isTablet ? 100 : isSmallScreen ? 60 : 80,
      height: isTablet ? 80 : isSmallScreen ? 48 : 64,
      marginBottom: Math.max(6, height * 0.01),
    },
    title: {
      fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
      fontWeight: "800",
      color: PRIMARY_COLOR,
      textAlign: "center",
    },
    inputContainer: {
      marginBottom: Math.max(14, height * 0.02),
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#D1D5DB",
      borderRadius: 25,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: Math.max(14, height * 0.018),
      minHeight: 50,
    },
    leftIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      color: "#111827",
    },
    rightIcon: {
      marginLeft: 12,
    },
    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: Math.max(16, height * 0.025),
    },
    forgotPasswordText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: PRIMARY_COLOR,
      fontWeight: "500",
    },
    signInButton: {
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 25,
      paddingVertical: Math.max(14, height * 0.02),
      alignItems: "center",
      marginBottom: Math.max(24, height * 0.04),
      minHeight: 50,
      justifyContent: "center",
    },
    signInText: {
      color: "#FFFFFF",
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "500",
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Math.max(16, height * 0.025),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: "#000000",
    },
    dividerText: {
      paddingHorizontal: 8,
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: "rgb(19, 19, 19)",
      fontWeight: "300",
    },
    socialContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Math.max(16, width * 0.04),
      marginBottom: Math.max(16, height * 0.025),
    },
    socialButton: {
      width: isTablet ? 64 : 56,
      height: isTablet ? 64 : 56,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#D1D5DB",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
    },
    signUpContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Math.max(10, width * 0.02),
    },
    signUpText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: "rgb(19, 19, 19)",
      fontWeight: "300",
    },
    signUpLink: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: PRIMARY_COLOR,
      fontWeight: "700",
    },
    errorText: {
      color: 'red',
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      textAlign: 'center',
      marginBottom: Math.max(16, height * 0.025),
    },
  });
};