import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserRole = "consumer" | "merchant" | "driver";

export default function RoleSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    try {
      await AsyncStorage.setItem("selectedRole", role);

      const userToken = await AsyncStorage.getItem("userToken");

      if (userToken) {
        // Returning user → Sign in
        router.push("/auth/signin");
      } else {
        // New user → Sign up
        router.push("/auth/signup");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      Alert.alert("Error", "Please try again.");
    }
  };

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  buttonsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  roleButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 16,
  },
  roleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  infoText: {
    color: "rgb(19, 19, 19)",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "300",
  },
});