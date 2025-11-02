import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OTPVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const pendingUserData = await AsyncStorage.getItem("pendingUserData");
        if (pendingUserData) {
          const userData = JSON.parse(pendingUserData);
          setUserEmail(userData.email || "");
        }
      } catch (error) {
        console.error("Error loading user email:", error);
      }
    };

    loadUserEmail();
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (numericValue && index < 4) {
      inputRefs.current[index + 1]?.focus();
    } else if (!numericValue && index > 0) {
      // Auto-focus previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (nativeEvent: any, index: number) => {
    if (nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isCodeComplete = () => {
    return otp.every(digit => digit !== "");
  };

  const handleVerifyOTP = async () => {
    if (!isCodeComplete()) {
      Alert.alert("Error", "Please enter the complete 5-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      const { authService } = await import('../../services/authService');
      const tempEmail = await AsyncStorage.getItem("pendingUserData");

      if (!tempEmail) {
        Alert.alert("Error", "Session expired. Please sign up again.");
        router.replace("/auth/signup");
        return;
      }

      const userData = JSON.parse(tempEmail);
      const otpCode = otp.join('');

      // Verify OTP with backend
      const response = await authService.verifyOTP({
        email: userData.email,
        otp: otpCode
      });

      if (response.success && response.data) {
        // Store authenticated user data
        await AsyncStorage.setItem("userToken", response.data.token);
        await AsyncStorage.setItem("userEmail", response.data.user.email);
        await AsyncStorage.setItem("userRole", response.data.user.role);

        // Clean up temporary data
        await AsyncStorage.multiRemove(["pendingUserData", "selectedRole"]);

        Alert.alert("Success", "Account verified successfully!");

        if (response.data.user.role === "consumer") {
          router.replace("/home/consumer");
        } else {
          router.replace(`/dashboard/${response.data.user.role}`);
        }
      } else {
        Alert.alert("Verification Failed", response.error || "Invalid or expired code. Please try again.");
        setOtp(["", "", "", "", ""]); // Clear the OTP inputs
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      Alert.alert("Error", "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const pendingUserData = await AsyncStorage.getItem("pendingUserData");
      if (!pendingUserData) {
        Alert.alert("Error", "Session expired. Please sign up again.");
        router.replace("/auth/signup");
        return;
      }

      const userData = JSON.parse(pendingUserData);
      
      const { authService } = await import('../../services/authService');
      const response = await authService.resendOTP(userData.email);

      if (response.success) {
        Alert.alert("Code Resent", `A new verification code has been sent to ${userData.email}`);
        setOtp(["", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Error", response.error || "Failed to resend code. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      Alert.alert("Error", "Failed to resend code. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo and Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Verify it's you</Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[styles.otpInput, digit !== "" && styles.otpInputFilled]}
            value={digit}
            onChangeText={(value) => handleOTPChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Email Info */}
      <View style={styles.emailInfo}>
        <Text style={styles.emailText}>A 5-digit verification code has been sent to</Text>
        <Text style={styles.emailAddress}>{userEmail || "your email"}</Text>
        <Text style={styles.instructionText}>
          Please enter the code below to verify your account.
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, !isCodeComplete() && styles.submitButtonDisabled]}
        onPress={handleVerifyOTP}
        disabled={isVerifying || !isCodeComplete()}
      >
        <Text style={[styles.submitButtonText, !isCodeComplete() && styles.submitButtonTextDisabled]}>
          {isVerifying ? "Verifying..." : "Verify Code"}
        </Text>
      </TouchableOpacity>

      {/* Resend Code */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't get code? </Text>
        <TouchableOpacity onPress={handleResendOTP} disabled={isVerifying}>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  otpInput: {
    width: 58,
    height: 58,
    borderWidth: 1,
    borderColor: "rgb(70, 130, 180)",
    borderRadius: 29,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "rgb(11, 26, 81)",
    backgroundColor: "white",
  },
  otpInputFilled: {
    borderColor: "rgb(11, 26, 81)",
    borderWidth: 2,
    shadowColor: "rgba(70, 130, 180, 0.1)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  emailInfo: {
    alignItems: "center",
    marginBottom: 48,
  },
  emailText: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgb(19, 19, 19)",
    marginBottom: 4,
  },
  emailAddress: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgb(11, 26, 81)",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgb(19, 19, 19)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  submitButton: {
    backgroundColor: "rgb(70, 130, 180)",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(70, 130, 180, 0.5)",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  submitButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgb(19, 19, 19)",
  },
  resendLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgb(11, 26, 81)",
  },
});