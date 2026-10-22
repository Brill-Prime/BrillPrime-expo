import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPendingRegistrationData } from "../../utils/authFlow";

export default function OTPVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const inputRefs = useRef<TextInput[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const [pendingUserData, tempUserEmail, tempUserRole, persistedUserEmail, persistedUserRole] = await AsyncStorage.multiGet([
          "pendingUserData",
          "tempUserEmail",
          "tempUserRole",
          "userEmail",
          "userRole",
        ]);

        const pendingContext = getPendingRegistrationData(
          pendingUserData[1],
          tempUserEmail[1],
          tempUserRole[1],
          persistedUserEmail[1],
          persistedUserRole[1],
        );

        if (pendingContext?.email) {
          setUserEmail(pendingContext.email);
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

    if (statusMessage) {
      setStatusMessage(null);
    }

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
    const otpString = otp.join("");

    if (otpString.length !== 5) {
      setStatusMessage({ type: 'error', text: 'Please enter all 5 digits of the verification code.' });
      return;
    }

    setIsVerifying(true);
    setStatusMessage({ type: 'info', text: 'Verifying your code...' });

    try {
      const { authService } = await import('../../services/authService');
      const [pendingUserData, tempUserEmail, tempUserRole, persistedUserEmail, persistedUserRole] = await AsyncStorage.multiGet([
        "pendingUserData",
        "tempUserEmail",
        "tempUserRole",
        "userEmail",
        "userRole",
      ]);

      const pendingContext = getPendingRegistrationData(
        pendingUserData[1],
        tempUserEmail[1],
        tempUserRole[1],
        persistedUserEmail[1],
        persistedUserRole[1],
      );

      if (!pendingContext?.email) {
        setStatusMessage({ type: 'error', text: 'Your signup session expired. Please sign up again.' });
        router.replace("/auth/signup");
        return;
      }

      const response = await authService.verifyOTP({
        email: pendingContext.email,
        otp: otpString
      });

      if (response.success && response.data) {
        const authenticatedUser = response.data.user ?? {
          email: pendingContext.email,
          role: pendingContext.role ?? 'consumer',
          id: '',
          name: pendingContext.email,
          phone: '',
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem("userToken", response.data.token || "");
        await AsyncStorage.setItem("userEmail", authenticatedUser.email || pendingContext.email);
        await AsyncStorage.setItem("userRole", authenticatedUser.role || pendingContext.role || "consumer");

        await AsyncStorage.multiRemove(["pendingUserData", "tempUserEmail", "tempUserRole", "selectedRole"]);

        setStatusMessage({ type: 'success', text: 'Account verified successfully.' });

        if (authenticatedUser.role === "consumer") {
          router.replace("/home/consumer");
        } else {
          router.replace(`/dashboard/${authenticatedUser.role}`);
        }
      } else {
        setStatusMessage({ type: 'error', text: response.error || "Invalid verification code. Please try again." });
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      setStatusMessage({ type: 'error', text: "Verification failed. Please try again." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const [pendingUserData, tempUserEmail, tempUserRole, persistedUserEmail, persistedUserRole] = await AsyncStorage.multiGet([
        "pendingUserData",
        "tempUserEmail",
        "tempUserRole",
        "userEmail",
        "userRole",
      ]);

      const pendingContext = getPendingRegistrationData(
        pendingUserData[1],
        tempUserEmail[1],
        tempUserRole[1],
        persistedUserEmail[1],
        persistedUserRole[1],
      );

      if (!pendingContext?.email) {
        setStatusMessage({ type: 'error', text: 'Your signup session expired. Please sign up again.' });
        router.replace("/auth/signup");
        return;
      }

      const { authService } = await import('../../services/authService');
      const response = await authService.resendOTP(pendingContext.email);

      if (response.success) {
        setOtp(["", "", "", "", ""]);
        setStatusMessage({ type: 'success', text: `A new verification code has been sent to ${pendingContext.email}.` });
        inputRefs.current[0]?.focus();
      } else {
        setStatusMessage({ type: 'error', text: response.error || "Failed to resend code. Please try again." });
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      setStatusMessage({ type: 'error', text: "Failed to resend code. Please try again." });
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
        <Text style={styles.title}>Verify it&apos;s you</Text>
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
            editable={!isVerifying} // Disable input while verifying
          />
        ))}
      </View>

      {/* Email Info */}
      <View style={styles.emailInfo}>
        <Text style={styles.emailText}>A verification code has been sent to</Text>
        <Text style={styles.emailAddress}>{userEmail || "your email"}</Text>
      </View>

      {statusMessage && (
        <View style={[styles.statusBox, statusMessage.type === 'error' ? styles.statusError : statusMessage.type === 'success' ? styles.statusSuccess : styles.statusInfo]}>
          <Text style={styles.statusText}>{statusMessage.text}</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !isCodeComplete() && styles.submitButtonDisabled
        ]}
        onPress={handleVerifyOTP}
        disabled={!isCodeComplete() || isVerifying} // Disable if code not complete or verifying
      >
        <Text style={[
          styles.submitButtonText,
          (!isCodeComplete() || isVerifying) && styles.submitButtonTextDisabled
        ]}>
          {isVerifying ? "Verifying..." : "Submit"}
        </Text>
      </TouchableOpacity>

      {/* Resend Code */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn&apos;t get code? </Text>
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
    // @ts-ignore
    boxShadow: '0px 0px 3px rgba(70, 130, 180, 1)',
  },
  emailInfo: {
    alignItems: "center",
    marginBottom: 24,
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
  statusBox: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  statusError: {
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F5B7B1",
  },
  statusSuccess: {
    backgroundColor: "#E9F9EE",
    borderWidth: 1,
    borderColor: "#A9D9B7",
  },
  statusInfo: {
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#C7D9F8",
  },
  statusText: {
    color: "#1F2937",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
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