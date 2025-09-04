import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

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

      router.replace(`/dashboard/${selectedRole || "consumer"}`);
    } catch (error) {
      console.error("Error signing in:", error);
      Alert.alert("Error", "Sign in failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        {/* Logo + Title */}
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://pfst.cf2.poecdn.net/base/image/9a83454921377de2340ada1aa779b76e53091705f05837fa1104ac78525a8a32?w=122&h=101",
            }}
            style={styles.logo}
          />
          <Text style={styles.title}>Sign In</Text>
        </View>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange("email", value)}
            placeholder="Email or phone number"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(value) => handleInputChange("password", value)}
            placeholder="Password"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconRight}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
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
          <View style={styles.line} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.line} />
        </View>

        {/* Social Buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={20} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="apple" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={20} color="#1877F2" />
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.signupText}>
            Don’t have an account? <Text style={styles.signupBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const PRIMARY_COLOR = "rgb(11, 26, 81)";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, padding: 20, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 80, height: 60, resizeMode: "contain", marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: PRIMARY_COLOR },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16 },
  iconRight: { paddingHorizontal: 5 },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 20 },
  forgotPasswordText: { fontSize: 14, color: PRIMARY_COLOR },
  signInButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 30,
  },
  signInText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: "#000" },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: "#333" },
  socialRow: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  signupLink: { alignItems: "center" },
  signupText: { fontSize: 14, color: "#333" },
  signupBold: { color: PRIMARY_COLOR, fontWeight: "bold" },
});