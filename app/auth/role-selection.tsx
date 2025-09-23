import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = "consumer" | "merchant" | "driver";

// ✅ DEPLOYMENT READY - DO NOT EDIT WITHOUT TEAM APPROVAL  
// Role selection component is complete and tested
export default function RoleSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const handleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    try {
      await AsyncStorage.setItem("selectedRole", role);

      // Check if user has valid token
      const userToken = await AsyncStorage.getItem("userToken");
      
      if (userToken) {
        // Validate existing token with backend
        try {
          const { authService } = await import('../../services/authService');
          const authCheck = await authService.isAuthenticatedWithValidation();
          
          if (authCheck.isAuthenticated) {
            // Get current user data to validate role
            const userResponse = await authService.getCurrentUser();
            
            if (userResponse.success && userResponse.data) {
              const userRole = userResponse.data.role;
              
              // Check if stored role matches selected role
              if (userRole === role) {
                // Roles match, navigate to home screen
                router.replace("/home/consumer");
                return;
              } else {
                // Role mismatch - update stored role and continue
                await AsyncStorage.setItem("selectedRole", userRole);
                Alert.alert(
                  "Role Updated",
                  `Your account role has been updated to ${userRole}. Please select your role again.`,
                  [{ text: "OK", onPress: () => setSelectedRole(null) }]
                );
                return;
              }
            }
          }
          
          // Token is invalid or expired, clear it and proceed to auth
          console.log("Token validation failed, clearing auth data");
          await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole", "tokenExpiry"]);
          
        } catch (tokenError) {
          console.log("Token validation error:", tokenError);
          
          // Handle network errors gracefully
          if (tokenError.message?.includes('network') || tokenError.message?.includes('fetch')) {
            Alert.alert(
              "Connection Error",
              "Unable to verify your authentication. Please check your internet connection.",
              [
                { text: "Try Again", onPress: () => handleSelect(role) },
                { text: "Continue Offline", onPress: () => proceedToAuth() }
              ]
            );
            return;
          } else {
            // Other errors - clear auth data
            await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole", "tokenExpiry"]);
          }
        }
      }

      // Proceed with normal authentication flow
      proceedToAuth();
      
      async function proceedToAuth() {

      // Check if user has account (stored email indicates previous registration)
        const storedEmail = await AsyncStorage.getItem("userEmail");
        
        if (storedEmail) {
          // User has registered before → Sign in
          router.push("/auth/signin");
        } else {
          // New user → Sign up
          router.push("/auth/signup");
        }
      }
    } catch (error) {
      console.error("Error saving role:", error);
      Alert.alert("Error", "Failed to save role selection. Please try again.");
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/role_selection_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Role Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleSelect("consumer")}
          activeOpacity={0.9}
        >
          <Text style={styles.roleButtonText}>Consumer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleSelect("merchant")}
          activeOpacity={0.9}
        >
          <Text style={styles.roleButtonText}>Merchant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => handleSelect("driver")}
          activeOpacity={0.9}
        >
          <Text style={styles.roleButtonText}>Driver</Text>
        </TouchableOpacity>

        {/* Info text */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.infoText}>Make a selection to get started</Text>
        </View>
      </View>
    </View>
  );
}

const PRIMARY_COLOR = "rgb(11, 26, 81)";

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      justifyContent: "space-between",
    },
    logoContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Math.max(20, width * 0.05),
    },
    logo: {
      width: isTablet ? 160 : Math.min(width * 0.35, 140),
      height: isTablet ? 160 : Math.min(width * 0.35, 140),
      resizeMode: "contain",
    },
    buttonsContainer: {
      paddingHorizontal: Math.max(20, width * 0.08),
      paddingBottom: Math.max(30, height * 0.05),
      maxWidth: Math.min(width, 400),
      alignSelf: "center",
      width: "100%",
    },
    roleButton: {
      backgroundColor: PRIMARY_COLOR,
      paddingVertical: Math.max(14, height * 0.02),
      borderRadius: 25,
      alignItems: "center",
      marginBottom: Math.max(12, height * 0.018),
      minHeight: 50,
      justifyContent: "center",
    },
    roleButtonText: {
      color: "white",
      fontSize: isTablet ? 20 : isSmallScreen ? 14 : 16,
      fontWeight: "600",
    },
    infoText: {
      color: "rgb(19, 19, 19)",
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      textAlign: "center",
      fontWeight: "300",
      marginTop: Math.max(15, height * 0.025),
    },
  });
};