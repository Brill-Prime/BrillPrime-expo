
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function About() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View style={styles.appInfoSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Brill Prime</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            Your ultimate marketplace for everything you need
          </Text>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Brill Prime</Text>
          <Text style={styles.description}>
            Brill Prime is a revolutionary marketplace platform that connects consumers, merchants, and drivers in a seamless ecosystem. We're committed to providing exceptional service, quality products, and reliable delivery to make your shopping experience effortless and enjoyable.
          </Text>
          <Text style={styles.description}>
            Our mission is to empower local businesses while providing consumers with convenient access to a wide variety of products and services. With our innovative technology and dedicated team, we're building the future of commerce.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="storefront" size={24} color="#667eea" />
              <Text style={styles.featureText}>Wide variety of products from trusted merchants</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="car" size={24} color="#667eea" />
              <Text style={styles.featureText}>Fast and reliable delivery service</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color="#667eea" />
              <Text style={styles.featureText}>Secure payment processing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="headset" size={24} color="#667eea" />
              <Text style={styles.featureText}>24/7 customer support</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="star" size={24} color="#667eea" />
              <Text style={styles.featureText}>Quality guarantee on all products</Text>
            </View>
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <Text style={styles.description}>
            We're a passionate team of innovators, developers, and customer service professionals dedicated to creating the best marketplace experience possible. Our diverse backgrounds and shared vision drive us to continuously improve and expand our platform.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get In Touch</Text>
          <View style={styles.contactList}>
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('mailto:info@brillprime.com')}
            >
              <Ionicons name="mail" size={20} color="#667eea" />
              <Text style={styles.contactText}>info@brillprime.com</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL('tel:+1234567890')}
            >
              <Ionicons name="call" size={20} color="#667eea" />
              <Text style={styles.contactText}>+1 (234) 567-8900</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => openLink('https://brillprime.com')}
            >
              <Ionicons name="globe" size={20} color="#667eea" />
              <Text style={styles.contactText}>www.brillprime.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Media Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink('https://facebook.com/brillprime')}
            >
              <Ionicons name="logo-facebook" size={24} color="#1877f2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink('https://twitter.com/brillprime')}
            >
              <Ionicons name="logo-twitter" size={24} color="#1da1f2" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink('https://instagram.com/brillprime')}
            >
              <Ionicons name="logo-instagram" size={24} color="#e4405f" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink('https://linkedin.com/company/brillprime')}
            >
              <Ionicons name="logo-linkedin" size={24} color="#0077b5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => openLink('https://brillprime.com/terms')}
          >
            <Text style={styles.legalText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => openLink('https://brillprime.com/privacy')}
          >
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={() => openLink('https://brillprime.com/cookies')}
          >
            <Text style={styles.legalText}>Cookie Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2024 Brill Prime. All rights reserved.
          </Text>
        </View>
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
      backgroundColor: '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: Math.max(16, height * 0.02),
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#333',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.04),
    },
    appInfoSection: {
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(24, width * 0.06),
      marginVertical: 16,
    },
    logoContainer: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      backgroundColor: '#f8f9fa',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    logo: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
    },
    appName: {
      fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    appVersion: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#666',
      marginBottom: 8,
    },
    appTagline: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#999',
      textAlign: 'center',
    },
    section: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
    },
    description: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#666',
      lineHeight: isTablet ? 24 : 22,
      marginBottom: 12,
    },
    featuresList: {
      gap: 12,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureText: {
      flex: 1,
      marginLeft: 12,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#333',
    },
    contactList: {
      gap: 16,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactText: {
      marginLeft: 12,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#667eea',
    },
    socialContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    socialButton: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      borderRadius: isTablet ? 30 : 25,
      backgroundColor: '#f8f9fa',
      justifyContent: 'center',
      alignItems: 'center',
    },
    legalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    legalText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#333',
    },
    copyrightSection: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    copyrightText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: '#999',
    },
  });
};
