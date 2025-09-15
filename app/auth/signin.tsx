import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      const mockToken = "user_token_" + Date.now();
      await AsyncStorage.setItem("userToken", mockToken);
      await AsyncStorage.setItem("userEmail", formData.email);

      const selectedRole = await AsyncStorage.getItem("selectedRole");
      await AsyncStorage.setItem("userRole", selectedRole || "consumer");

      // Route consumers to home page, others to dashboard
      if (selectedRole === "consumer") {
        router.replace("/home/consumer");
      } else {
        router.replace(`/dashboard/${selectedRole || "consumer"}`);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      Alert.alert("Error", "Sign in failed. Please try again.");
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Coming Soon", `${provider} login will be available soon!`);
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
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
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

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot password? Reset</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInText}>Sign In</Text>
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
  });
};