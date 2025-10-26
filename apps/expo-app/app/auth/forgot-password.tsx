import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AlertModal from "../../components/AlertModal";

// Placeholder for authService and related functions that were in the original code
// In a real scenario, these would be imported or defined elsewhere.
// For this example, we'll simulate their behavior based on the original context.
const authService = {
  requestPasswordReset: async ({ email }) => {
    // Simulate a network call with potential timeout
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate a successful response after a delay
        // In the original code, this was the part that was timing out and causing issues.
        // The new logic replaces this with direct Firebase calls.
        resolve({ success: true, message: "Reset link sent." });
      }, 35000); // Simulate a timeout longer than 30 seconds
    });
  }
};

// Helper functions to mimic the UI feedback mechanisms
const showError = (title, message) => {
  console.error(`${title}: ${message}`);
  // In a real app, this would trigger the UI modal
};

const showInfo = (title, message) => {
  console.log(`${title}: ${message}`);
  // In a real app, this would trigger a success modal or toast
};

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Simulate setLoading and setLoading state
  const setLoading = (loading) => setIsLoading(loading);
  const showSuccess = (message) => {
    // In a real app, this would set `showSuccessModal` to true
    console.log("Success:", message);
  };

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      setShowErrorModal(true);
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);

    try {
      // Import Firebase auth functions
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('../../config/firebase');

      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Password reset error:', error);

      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please try again later');
      } else {
        setErrorMessage('Failed to send reset link. Please try again.');
      }
      setShowErrorModal(true);
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