import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
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

export default function SelectPaymentMethod() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Mock payment methods data
  const paymentMethods = [
    {
      id: "mastercard_1234",
      type: "Mastercard",
      number: "**** **** **** 1234",
      expiry: "02/16",
      logo: require('../../assets/images/master_card_logo.png'),
    },
    {
      id: "visa_5678",
      type: "VISA",
      number: "**** **** **** 5678",
      expiry: "02/16",
      logo: require('../../assets/images/visa_card_logo.png'),
    },
    {
      id: "apple_pay",
      type: "Apple Pay",
      number: "**** **** **** 9012",
      expiry: "02/16",
      logo: require('../../assets/images/apple_pay_logo.png'),
    },
    {
      id: "google_pay",
      type: "Google Pay",
      number: "**** **** **** 3456",
      expiry: "02/16",
      logo: require('../../assets/images/google_icon.png'),
    },
    {
      id: "paypal",
      type: "PayPal",
      number: "Anthony Godfrey",
      expiry: null,
      logo: null, // We'll use an icon instead
    },
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    // Here you could navigate to the next step or call a callback
  };

  const handleAddPaymentMethod = () => {
    // Navigate to add payment method screen
    console.log("Navigate to add payment method");
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
            <Text style={styles.title}>Select Payment Method</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Payment Methods */}
          <View style={styles.methodsContainer}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  selectedMethod === method.id && styles.selectedCard,
                ]}
                onPress={() => handleMethodSelect(method.id)}
              >
                <View style={styles.paymentLeft}>
                  <View style={styles.paymentLogo}>
                    {method.logo ? (
                      <Image source={method.logo} style={styles.logoImage} resizeMode="contain" />
                    ) : method.type === "PayPal" ? (
                      <View style={styles.paypalIcon}>
                        <Text style={styles.paypalText}>P</Text>
                      </View>
                    ) : (
                      <Ionicons name="card-outline" size={24} color={PRIMARY_COLOR} />
                    )}
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentNumber}>{method.number}</Text>
                    {method.expiry && (
                      <Text style={styles.paymentExpiry}>{method.expiry}</Text>
                    )}
                  </View>
                </View>
                {selectedMethod === method.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color={PRIMARY_COLOR} />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Add Payment Method */}
            <TouchableOpacity style={styles.addMethod} onPress={handleAddPaymentMethod}>
              <View style={styles.addMethodContent}>
                <Ionicons name="add-circle-outline" size={24} color={TEXT_GRAY} />
                <Text style={styles.addMethodText}>Add Payment Method</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          {selectedMethod && (
            <TouchableOpacity style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          )}
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
  methodsContainer: {
    gap: 16,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  paymentLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 32,
    height: 20,
  },
  paypalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0070ba",
    justifyContent: "center",
    alignItems: "center",
  },
  paypalText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: DARK_TEXT,
  },
  paymentExpiry: {
    fontSize: 14,
    color: TEXT_GRAY,
    marginTop: 2,
  },
  checkmark: {
    marginLeft: 12,
  },
  addMethod: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    backgroundColor: LIGHT_GRAY,
    marginTop: 8,
  },
  addMethodContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addMethodText: {
    fontSize: 16,
    color: TEXT_GRAY,
    marginLeft: 8,
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});