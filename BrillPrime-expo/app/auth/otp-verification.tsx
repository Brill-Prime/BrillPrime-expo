import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OTPVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);

  const handleOTPChange = (value: string, index: number) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (numericValue && index < 4) {
      inputRefs.current[index + 1]?.focus();
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
    const otpString = otp.join("");
    
    if (otpString.length !== 5) {
      Alert.alert("Error", "Please enter all 5 digits of the verification code.");
      return;
    }

    try {
      // For demo purposes, accept any 5-digit code
      // In a real app, you would verify this with your backend
      
      // Get pending user data
      const pendingUserData = await AsyncStorage.getItem("pendingUserData");
      const selectedRole = await AsyncStorage.getItem("selectedRole");
      
      if (pendingUserData) {
        // Registration successful
        const userData = JSON.parse(pendingUserData);
        
        // Generate token and save user session
        const token = "user_token_" + Date.now();
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userEmail", userData.email);
        await AsyncStorage.setItem("userRole", selectedRole || "consumer");
        
        // Clean up pending data
        await AsyncStorage.removeItem("pendingUserData");
        
        Alert.alert(
          "Success!", 
          "Verification successful!",
          [
            {
              text: "OK",
              onPress: () => router.replace(`/dashboard/${selectedRole || "consumer"}`)
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert("Error", "Verification failed. Please try again.");
    }
  };

  const handleResendOTP = () => {
    // In a real app, you would resend the OTP here
    Alert.alert("Code Resent", "A new verification code has been sent to username@email.com");
    setOtp(["", "", "", "", ""]);
    inputRefs.current[0]?.focus();
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

      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              digit ? styles.otpInputFilled : null
            ]}
            value={digit}
            onChangeText={(value) => handleOTPChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent, index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Email Info */}
      <View style={styles.emailInfo}>
        <Text style={styles.emailText}>A verification code has been sent to</Text>
        <Text style={styles.emailAddress}>username@email.com</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          !isCodeComplete() && styles.submitButtonDisabled
        ]} 
        onPress={handleVerifyOTP}
        disabled={!isCodeComplete()}
      >
        <Text style={[
          styles.submitButtonText,
          !isCodeComplete() && styles.submitButtonTextDisabled
        ]}>
          Submit
        </Text>
      </TouchableOpacity>

      {/* Resend Code */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't get code? </Text>
        <TouchableOpacity onPress={handleResendOTP}>
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
    fontSize: 12,
    fontWeight: "700",
    color: "rgb(11, 26, 81)",
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