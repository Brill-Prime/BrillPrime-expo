
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";

// Using the app's consistent color scheme
const PRIMARY_COLOR = "rgb(11, 26, 81)";
const LIGHT_GRAY = "#f8f9fa";
const BORDER_COLOR = "#D1D5DB";
const TEXT_GRAY = "rgb(136, 136, 136)";
const DARK_TEXT = "#111827";
const INPUT_PLACEHOLDER = "#9CA3AF";

export default function AddPaymentMethod() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvc: "",
  });

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === "cardNumber") {
      formattedValue = value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
      if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
    }

    // Format expiry date
    if (field === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").replace(/(\d{2})(?=\d)/, "$1/");
      if (formattedValue.length > 5) return; // Max MM/YY
    }

    // Format CVC (max 3 digits)
    if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "");
      if (formattedValue.length > 3) return;
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.cardNumber || !formData.cardHolder || !formData.expiryDate || !formData.cvc) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (formData.cardNumber.replace(/\s/g, "").length < 16) {
      Alert.alert("Error", "Please enter a valid card number");
      return;
    }

    if (formData.expiryDate.length < 5) {
      Alert.alert("Error", "Please enter a valid expiry date");
      return;
    }

    if (formData.cvc.length < 3) {
      Alert.alert("Error", "Please enter a valid CVC");
      return;
    }

    // Here you would typically save the payment method
    Alert.alert(
      "Success", 
      "Payment method added successfully",
      [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={handleBack} color={DARK_TEXT} />
            <Text style={styles.title}>Add New Payment Method</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Card Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Card Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={INPUT_PLACEHOLDER} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.cardNumber}
                  onChangeText={(value) => handleInputChange("cardNumber", value)}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={INPUT_PLACEHOLDER}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Card Holder Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Card Holder Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={INPUT_PLACEHOLDER} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.cardHolder}
                  onChangeText={(value) => handleInputChange("cardHolder", value)}
                  placeholder="Card Holder Name"
                  placeholderTextColor={INPUT_PLACEHOLDER}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Expiry Date and CVC Row */}
            <View style={styles.rowContainer}>
              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>Expiry Date</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color={INPUT_PLACEHOLDER} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.expiryDate}
                    onChangeText={(value) => handleInputChange("expiryDate", value)}
                    placeholder="MM/YY"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.halfInputContainer}>
                <Text style={styles.label}>CVC</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={INPUT_PLACEHOLDER} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.cvc}
                    onChangeText={(value) => handleInputChange("cvc", value)}
                    placeholder="000"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingVertical: 16,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 8,
  },
  
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    gap: 24,
  },
  inputContainer: {
    marginBottom: 8,
  },
  halfInputContainer: {
    flex: 1,
    marginBottom: 8,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: DARK_TEXT,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 25,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: DARK_TEXT,
  },
  saveButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
