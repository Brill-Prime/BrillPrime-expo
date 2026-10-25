import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../config/firebase';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('pendingUserData')
      .then(value => {
        if (!value && !auth?.currentUser) {
          router.replace('/auth/signup');
          return;
        }
        setEmail((value ? JSON.parse(value).email : auth?.currentUser?.email) || '');
      })
      .catch(error => {
        console.error('Unable to load pending verification:', error);
        Alert.alert('Error', 'Unable to load your verification details. Please sign up again.');
      });
  }, [router]);

  const finishVerification = async () => {
    setIsLoading(true);
    try {
      const response = await authService.verifyEmail();
      if (!response.success || !response.data) {
        Alert.alert('Not verified yet', response.error || 'Open the verification link in your email, then try again.');
        return;
      }

      await refreshAuthState();
      const homeByRole = {
        consumer: '/home/consumer',
        merchant: '/home/merchant',
        driver: '/home/driver',
      } as const;
      router.replace(homeByRole[response.data.user.role]);
    } catch (error) {
      console.error('Email verification check failed:', error);
      Alert.alert('Verification failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    setIsLoading(true);
    try {
      const response = await authService.resendVerificationEmail();
      Alert.alert(
        response.success ? 'Link sent' : 'Unable to send link',
        response.success
          ? `A new verification link was sent to ${email}.`
          : response.error || 'Please try again.'
      );
    } catch (error) {
      console.error('Unable to resend verification email:', error);
      Alert.alert('Unable to send link', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.message}>
        Firebase sent a verification link to {email || 'your email address'}. Open the link, return here, and tap below.
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={finishVerification} disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Checking...' : "I've verified my email"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={resendVerification} disabled={isLoading}>
        <Text style={styles.resendText}>Resend verification link</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/auth/signin')} disabled={isLoading}>
        <Text style={styles.signInText}>Back to sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#fff',
  },
  logo: { width: 100, height: 80, marginBottom: 28 },
  title: { color: '#0B1A51', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  message: { color: '#4B5563', fontSize: 16, lineHeight: 24, textAlign: 'center', marginBottom: 28 },
  primaryButton: {
    width: '100%',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#0B1A51',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  resendText: { color: '#0B1A51', fontSize: 15, fontWeight: '600', padding: 12 },
  signInText: { color: '#6B7280', fontSize: 14, padding: 12 },
});
