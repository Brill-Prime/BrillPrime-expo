import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  ScaledSize,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = "consumer" | "merchant" | "driver";

interface Styles {
  container: ViewStyle;
  logoContainer: ViewStyle;
  logo: ImageStyle;
  buttonsContainer: ViewStyle;
  roleButton: ViewStyle;
  roleButtonText: TextStyle;
  infoText: TextStyle;
}

export default function RoleSelection() {
  const router = useRouter();
  const [screenData, setScreenData] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const checkPendingRoleSwitch = useCallback(async () => {
    try {
      const pendingRole = await AsyncStorage.getItem('pendingRoleSwitch');
      if (pendingRole) {
        await handleSelect(pendingRole as UserRole);
      }
    } catch (error) {
      console.error('Error checking pending role switch:', error);
    }
  }, []);

  useEffect(() => {
    checkPendingRoleSwitch();
  }, [checkPendingRoleSwitch]);

  const proceedToAuth = async (role: UserRole) => {
    try {
      const storedEmail = await AsyncStorage.getItem("userEmail");
      
      if (storedEmail) {
        router.push("/auth/signin");
      } else {
        router.push("/auth/signup");
      }
    } catch (error) {
      console.error("Error in proceedToAuth:", error);
      Alert.alert("Error", "Failed to proceed with authentication. Please try again.");
    }
  };

  const handleSelect = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem("selectedRole", role);
      await proceedToAuth(role);
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

const getResponsiveStyles = (screenData: ScaledSize): Styles => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;
  const isWeb = Platform.OS === 'web';
  
  // Web-specific styles
  const webContainer: ViewStyle = isWeb ? {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  } : {};
  
  const webButtons: ViewStyle = isWeb ? {
    boxSizing: 'border-box' as const,
  } : {};
  
  return StyleSheet.create<Styles>({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      justifyContent: "space-between",
      margin: 0,
      padding: 0,
      borderWidth: 0,
      ...webContainer,
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
    },
    buttonsContainer: {
      paddingHorizontal: Math.max(20, width * 0.08),
      paddingBottom: Math.max(30, height * 0.05),
      maxWidth: Math.min(width, 400),
      alignSelf: "center",
      width: "100%",
      ...webButtons,
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