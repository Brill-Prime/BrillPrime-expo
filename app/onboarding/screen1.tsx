import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import ArrowForwardIcon from '../../components/ArrowForwardIcon';

export default function OnboardingScreen1() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/onboarding_img1.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Welcome to{"\n"}Brill Prime</Text>
        <Text style={styles.description}>
          Your trusted financial partner for secure transactions and seamless money management
        </Text>

      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push("/onboarding/screen2")}
        >
          <ArrowForwardIcon size={screenData.width >= 768 ? 32 : 24} color="white" />
        </TouchableOpacity>
      </View>
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
      backgroundColor: "white",
      paddingHorizontal: Math.max(16, width * 0.06),
      paddingVertical: Math.max(20, height * 0.04),
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Math.max(8, width * 0.02),
    },
    imageContainer: {
      width: Math.min(width * 0.7, isTablet ? 320 : 280),
      height: Math.min(height * 0.4, isTablet ? 360 : 320),
      marginBottom: Math.max(20, height * 0.04),
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    title: {
      fontSize: isTablet ? 32 : isSmallScreen ? 20 : 24,
      fontWeight: "800",
      color: "rgb(11, 26, 81)",
      textAlign: "center",
      marginBottom: Math.max(12, height * 0.02),
      lineHeight: isTablet ? 40 : isSmallScreen ? 28 : 32,
      maxWidth: width * 0.9,
    },
    description: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: "rgb(136, 136, 136)",
      textAlign: "center",
      lineHeight: isTablet ? 24 : 20,
      marginBottom: Math.max(40, height * 0.06),
      maxWidth: Math.min(width * 0.85, 320),
      fontWeight: "300",
    },
    pagination: {
      flexDirection: "row",
      gap: 8,
    },
    dot: {
      width: isTablet ? 10 : 8,
      height: isTablet ? 10 : 8,
      borderRadius: isTablet ? 5 : 4,
      backgroundColor: "rgb(224, 224, 224)",
    },
    activeDot: {
      backgroundColor: "rgb(11, 26, 81)",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Math.max(8, width * 0.02),
      paddingBottom: Math.max(16, height * 0.02),
    },
    nextButton: {
      width: isTablet ? 64 : 56,
      height: isTablet ? 64 : 56,
      borderRadius: isTablet ? 32 : 28,
      backgroundColor: "rgb(70, 130, 180)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  });
};