
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
        {/* Logo and App Info */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Brill Prime</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.tagline}>
            Your trusted financial partner for secure transactions and seamless money management
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Brill Prime</Text>
          <Text style={styles.description}>
            Brill Prime is a comprehensive mobile application designed to revolutionize the way you 
            manage your financial transactions. We provide a secure, fast, and user-friendly platform 
            for consumers, merchants, and drivers to connect and transact seamlessly.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {[
            { icon: 'shield-checkmark', text: 'Bank-level security with end-to-end encryption' },
            { icon: 'flash', text: 'Instant transactions and real-time updates' },
            { icon: 'people', text: 'Multi-role platform for consumers, merchants, and drivers' },
            { icon: 'analytics', text: 'Advanced analytics and financial insights' },
            { icon: 'card', text: 'Multiple payment methods supported' },
            { icon: 'location', text: 'GPS-enabled location services' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={feature.icon as any} size={20} color="#4682B4" />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('mailto:support@brillprime.com')}
          >
            <Ionicons name="mail" size={20} color="#4682B4" />
            <Text style={styles.contactText}>support@brillprime.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('tel:+2348001234567')}
          >
            <Ionicons name="call" size={20} color="#4682B4" />
            <Text style={styles.contactText}>+234 800 123 4567</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('https://www.brillprime.com')}
          >
            <Ionicons name="globe" size={20} color="#4682B4" />
            <Text style={styles.contactText}>www.brillprime.com</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.legalItem}>
            <Text style={styles.legalText}>License Agreement</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Brill Prime. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for seamless financial experiences
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 15,
      paddingHorizontal: 20,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
      textAlign: 'center',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    logoSection: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 15,
    },
    appName: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: 'bold',
      color: '#0B1A51',
      marginBottom: 5,
    },
    version: {
      fontSize: 14,
      color: '#666',
      marginBottom: 15,
    },
    tagline: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: width * 0.8,
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
    },
    description: {
      fontSize: 15,
      color: '#666',
      lineHeight: 22,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureText: {
      fontSize: 14,
      color: '#666',
      marginLeft: 12,
      flex: 1,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    contactText: {
      fontSize: 15,
      color: '#4682B4',
      marginLeft: 12,
    },
    legalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    legalText: {
      fontSize: 15,
      color: '#333',
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    footerText: {
      fontSize: 13,
      color: '#666',
      marginBottom: 5,
    },
    footerSubtext: {
      fontSize: 12,
      color: '#999',
    },
  });
};
