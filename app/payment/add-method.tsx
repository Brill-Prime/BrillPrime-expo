
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Using the app's consistent color scheme
const PRIMARY_COLOR = "rgb(11, 26, 81)";
const GRAY_400 = "#9CA3AF";

export default function AddPaymentMethod() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cardNumber') {
      // Format card number with spaces
      const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length <= 19) { // 16 digits + 3 spaces
        setCardData(prev => ({ ...prev, [field]: formattedValue }));
      }
    } else if (field === 'expiryDate') {
      // Format expiry date as MM/YY
      const formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
      if (formattedValue.length <= 5) {
        setCardData(prev => ({ ...prev, [field]: formattedValue }));
      }
    } else if (field === 'cvv') {
      // CVV should be 3-4 digits only
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 4) {
        setCardData(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setCardData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Luhn algorithm for card validation
  const validateCardNumberLuhn = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const validateCard = () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method");
      return false;
    }
    
    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');
    
    // Card number validation
    if (!cleanCardNumber || cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      Alert.alert("Error", "Card number must be between 13-19 digits");
      return false;
    }
    
    if (!validateCardNumberLuhn(cleanCardNumber)) {
      Alert.alert("Error", "Invalid card number. Please check and try again.");
      return false;
    }
    
    // Expiry date validation
    if (!cardData.expiryDate || cardData.expiryDate.length < 5) {
      Alert.alert("Error", "Please enter a valid expiry date (MM/YY)");
      return false;
    }
    
    const [month, year] = cardData.expiryDate.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt('20' + year, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (expMonth < 1 || expMonth > 12) {
      Alert.alert("Error", "Invalid expiry month (01-12)");
      return false;
    }
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      Alert.alert("Error", "Card has expired");
      return false;
    }
    
    // CVV validation
    if (!cardData.cvv || (cardData.cvv.length < 3 || cardData.cvv.length > 4)) {
      Alert.alert("Error", "CVV must be 3 or 4 digits");
      return false;
    }
    
    // Cardholder name validation
    if (!cardData.cardholderName.trim() || cardData.cardholderName.trim().length < 3) {
      Alert.alert("Error", "Please enter a valid cardholder name");
      return false;
    }
    
    if (!/^[a-zA-Z\s\-'\.]+$/.test(cardData.cardholderName)) {
      Alert.alert("Error", "Cardholder name contains invalid characters");
      return false;
    }
    
    return true;
  };

  const handleSaveMethod = () => {
    if (!validateCard()) return;

    Alert.alert(
      "Payment Method Added",
      "Your payment method has been saved successfully!",
      [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]
    );
  };

  const styles = getResponsiveStyles(screenData);

  const paymentMethods = [
    { id: 'visa', name: 'Visa', image: require('../../assets/images/visa_card_logo.png') },
    { id: 'mastercard', name: 'Mastercard', image: require('../../assets/images/master_card_logo.png') },
    { id: 'apple', name: 'Apple Pay', image: require('../../assets/images/apple_pay_logo.png') },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.methodGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.selectedMethodCard
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Image source={method.image} style={styles.methodImage} resizeMode="contain" />
                <Text style={[
                  styles.methodName,
                  selectedMethod === method.id && styles.selectedMethodName
                ]}>
                  {method.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card Details Form */}
        {selectedMethod && selectedMethod !== 'apple' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            
            {/* Card Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={cardData.cardNumber}
                  onChangeText={(value) => handleInputChange("cardNumber", value)}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={GRAY_400}
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>
            </View>

            {/* Expiry and CVV */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={cardData.expiryDate}
                    onChangeText={(value) => handleInputChange("expiryDate", value)}
                    placeholder="MM/YY"
                    placeholderTextColor={GRAY_400}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={cardData.cvv}
                    onChangeText={(value) => handleInputChange("cvv", value)}
                    placeholder="123"
                    placeholderTextColor={GRAY_400}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={cardData.cardholderName}
                  onChangeText={(value) => handleInputChange("cardholderName", value)}
                  placeholder="John Doe"
                  placeholderTextColor={GRAY_400}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>
        )}

        {/* Apple Pay Info */}
        {selectedMethod === 'apple' && (
          <View style={styles.section}>
            <View style={styles.applePayInfo}>
              <Ionicons name="information-circle-outline" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.applePayText}>
                Apple Pay will be set up using your device's Touch ID or Face ID authentication.
              </Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        {selectedMethod && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveMethod}>
            <Text style={styles.saveButtonText}>Save Payment Method</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: Math.max(16, height * 0.02),
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#f0f0f0",
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#f8f9fa",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: "700",
      color: PRIMARY_COLOR,
      textAlign: "center",
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.05),
    },
    section: {
      marginVertical: Math.max(16, height * 0.02),
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "600",
      color: PRIMARY_COLOR,
      marginBottom: Math.max(12, height * 0.015),
    },
    methodGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
    },
    methodCard: {
      width: isTablet ? "31%" : "47%",
      backgroundColor: "#f8f9fa",
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      minHeight: isTablet ? 100 : 80,
      justifyContent: "center",
    },
    selectedMethodCard: {
      borderColor: PRIMARY_COLOR,
      backgroundColor: "rgba(11, 26, 81, 0.05)",
    },
    methodImage: {
      width: isTablet ? 40 : 32,
      height: isTablet ? 40 : 32,
      marginBottom: Math.max(8, height * 0.01),
    },
    methodName: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: "500",
      color: "#666",
      textAlign: "center",
    },
    selectedMethodName: {
      color: PRIMARY_COLOR,
      fontWeight: "600",
    },
    inputContainer: {
      marginBottom: Math.max(16, height * 0.02),
    },
    inputLabel: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      fontWeight: "500",
      color: PRIMARY_COLOR,
      marginBottom: Math.max(6, height * 0.008),
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#D1D5DB",
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: Math.max(12, width * 0.03),
      paddingVertical: Math.max(12, height * 0.015),
      minHeight: 50,
    },
    inputIcon: {
      marginRight: Math.max(8, width * 0.02),
    },
    input: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: "#111827",
    },
    rowInputs: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    applePayInfo: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(11, 26, 81, 0.05)",
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      gap: Math.max(12, width * 0.03),
    },
    applePayText: {
      flex: 1,
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: PRIMARY_COLOR,
      lineHeight: 20,
    },
    saveButton: {
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 12,
      paddingVertical: Math.max(16, height * 0.02),
      alignItems: "center",
      marginVertical: Math.max(24, height * 0.03),
      marginBottom: Math.max(32, height * 0.04),
      minHeight: 50,
      justifyContent: "center",
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "600",
    },
  });
};
