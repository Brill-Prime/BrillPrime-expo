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
      // Generate reset token
      const resetToken = generateResetToken();
      const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now
      
      // Store reset data locally (in real app, this would be stored on server)
      await AsyncStorage.setItem("resetEmail", email);
      await AsyncStorage.setItem("resetToken", resetToken);
      await AsyncStorage.setItem("resetTokenExpiry", resetExpiry.toString());
      
      // Send email with reset link
      const resetLink = `https://your-app-domain.com/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      const emailData = {
        to: email,
        subject: "Password Reset Request - BrillPrime",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 20px;">
              <img src="https://your-app-domain.com/assets/images/logo.png" alt="BrillPrime" style="width: 100px; height: 80px;">
              <h2 style="color: #0b1a51;">Password Reset Request</h2>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 10px; margin: 20px 0;">
              <p>Hello,</p>
              <p>We received a request to reset your password for your BrillPrime account.</p>
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #0b1a51; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${resetLink}</p>
              
              <p><strong>This link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>© 2024 BrillPrime. All rights reserved.</p>
            </div>
          </div>
        `
      };

      // Send email (replace with your email service)
      const response = await sendPasswordResetEmail(emailData);
      
      setIsLoading(false);
      
      if (response.success) {
        setShowSuccessModal(true);
      } else {
        throw new Error("Failed to send email");
      }
      
    } catch (error) {
      console.error("Error sending reset link:", error);
      setIsLoading(false);
      setErrorMessage("Failed to send reset link. Please try again.");
      setShowErrorModal(true);
    }
  };

  const generateResetToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const sendPasswordResetEmail = async (emailData: any) => {
    try {
      // Replace with your actual email service API
      // Example using EmailJS, SendGrid, or your backend API
      
      // For now, simulate successful email sending
      console.log("Sending email:", emailData);
      
      // In a real app, you would make an API call like:
      // const response = await fetch('/api/send-reset-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(emailData)
      // });
      // return await response.json();
      
      return { success: true };
    } catch (error) {
      console.error("Email sending error:", error);
      return { success: false, error };
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