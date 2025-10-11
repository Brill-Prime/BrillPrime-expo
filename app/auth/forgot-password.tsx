import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AlertModal from "../../components/AlertModal";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address");
      setShowErrorModal(true);
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);

    try {
      // Import authService to use consistent API client
      const { authService } = await import('../../services/authService');
      
      console.log('Requesting password reset for:', email);
      
      // Use authService for consistent error handling and network configuration
      const response = await authService.requestPasswordReset({ email });
      
      setIsLoading(false);

      console.log('Password reset response:', response);

      if (response.success) {
        // The backend has sent the email with reset link
        setShowSuccessModal(true);
      } else {
        throw new Error(response.error || "Failed to send reset link");
      }
      
    } catch (error) {
      console.error("Error sending reset link:", error);
      setIsLoading(false);
      
      // Provide more specific error messages
      let errorMsg = "Failed to send reset link. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMsg = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMsg = "Request timed out. Please try again.";
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.leftIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Send Reset Link Button */}
          <TouchableOpacity 
            style={[styles.sendButton, isLoading && styles.disabledButton]} 
            onPress={handleSendResetLink}
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Text>
          </TouchableOpacity>

          {/* Back to Sign In Link */}
          <View style={styles.backToSignInContainer}>
            <Text style={styles.backToSignInText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <AlertModal
        visible={showSuccessModal}
        type="success"
        title="Reset Link Sent!"
        message={`A password reset link has been sent to ${email}. Please check your email and click the link to reset your password.`}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        confirmText="OK"
      />

      {/* Error Modal */}
      <AlertModal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
        confirmText="OK"
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
    justifyContent: "center",
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: PRIMARY_COLOR,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: GRAY_600,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 32,
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
  sendButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: "rgba(11, 26, 81, 0.5)",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  backToSignInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToSignInText: {
    fontSize: 14,
    color: "rgb(19, 19, 19)",
    fontWeight: "300",
  },
  linkText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "700",
  },
});