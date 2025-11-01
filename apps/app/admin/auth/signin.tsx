import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminSignIn() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // ⚠️ DEVELOPMENT ONLY - SECURITY WARNING ⚠️
      // This is a mock admin authentication for development purposes only.
      // In production, this MUST be replaced with:
      // 1. Server-side authentication with secure credential verification
      // 2. Server-issued signed JWT tokens or secure session management
      // 3. Encrypted credential storage and transmission
      // 4. Rate limiting and brute force protection
      // 5. Multi-factor authentication for admin access
      if (formData.email === 'admin@brillprime.com' && formData.password === 'admin123') {
        // Store admin auth data
        const adminToken = 'admin_token_' + Date.now();
        const tokenExpiry = (Date.now() + 24 * 60 * 60 * 1000).toString(); // 24 hours
        
        await AsyncStorage.multiSet([
          ['adminToken', adminToken],
          ['adminEmail', formData.email],
          ['adminRole', 'admin'],
          ['adminTokenExpiry', tokenExpiry],
        ]);

        Alert.alert('Success', 'Admin login successful', [
          { text: 'OK', onPress: () => router.replace('/admin') }
        ]);
      } else {
        Alert.alert('Error', 'Invalid admin credentials');
      }
    } catch (error) {
      console.error('Admin sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#dc2626', '#b91c1c', '#991b1b']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Portal</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.adminTitle}>Administrator Access</Text>
          <Text style={styles.adminSubtitle}>Secure admin portal login</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Email"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Admin Password"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.disabledButton]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>
              {loading ? 'Signing In...' : 'Sign In to Admin Panel'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Authorized personnel only. All access is monitored and logged.
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: 'white',
    },
    placeholder: {
      width: Math.max(40, width * 0.08),
    },
    content: {
      flex: 1,
      backgroundColor: 'white',
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingHorizontal: Math.max(20, width * 0.06),
      paddingTop: Math.max(30, height * 0.04),
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: Math.max(40, height * 0.05),
    },
    logo: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      marginBottom: 20,
    },
    adminTitle: {
      fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
      fontWeight: 'bold',
      color: '#dc2626',
      marginBottom: 8,
      textAlign: 'center',
    },
    adminSubtitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#666',
      textAlign: 'center',
    },
    formContainer: {
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e5e5',
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      backgroundColor: '#f9f9f9',
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: isTablet ? 55 : 50,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#333',
    },
    eyeIcon: {
      padding: 4,
    },
    signInButton: {
      backgroundColor: '#dc2626',
      paddingVertical: Math.max(16, height * 0.02),
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
      shadowColor: '#dc2626',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    disabledButton: {
      opacity: 0.6,
    },
    signInButtonText: {
      color: 'white',
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
    },
    infoContainer: {
      marginTop: 30,
      padding: 16,
      backgroundColor: '#fef2f2',
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#dc2626',
    },
    infoText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#dc2626',
      textAlign: 'center',
      fontWeight: '500',
    },
  });
};