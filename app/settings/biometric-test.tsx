
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { biometricService } from '../../services/biometricService';
import { useRouter } from 'expo-router';

export default function BiometricTest() {
  const router = useRouter();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authResult, setAuthResult] = useState<string>('');

  useEffect(() => {
    runInitialTest();
  }, []);

  const runInitialTest = async () => {
    setIsLoading(true);
    try {
      const results = await biometricService.testBiometric();
      setTestResults(results);
    } catch (error) {
      console.error('Initial test error:', error);
      setTestResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthentication = async () => {
    setIsLoading(true);
    setAuthResult('');
    try {
      const result = await biometricService.authenticate('Test biometric authentication');
      setAuthResult(result ? 'Authentication successful! ✅' : 'Authentication failed ❌');
    } catch (error) {
      setAuthResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBiometric = async () => {
    setIsLoading(true);
    try {
      const isEnabled = await biometricService.isBiometricEnabled();
      if (isEnabled) {
        await biometricService.disableBiometric();
      } else {
        await biometricService.enableBiometric();
      }
      await runInitialTest();
    } catch (error) {
      setAuthResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4682B4" />
        </TouchableOpacity>
        <Text style={styles.title}>Biometric Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Platform:</Text>
            <Text style={styles.value}>{Platform.OS}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Version:</Text>
            <Text style={styles.value}>{Platform.Version}</Text>
          </View>
        </View>

        {testResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biometric Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Available:</Text>
              <Text style={[styles.value, testResults.available ? styles.success : styles.error]}>
                {testResults.available ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{testResults.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Enabled:</Text>
              <Text style={[styles.value, testResults.enabled ? styles.success : styles.error]}>
                {testResults.enabled ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
            {testResults.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{testResults.error}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testAuthentication}
            disabled={isLoading}
          >
            <Ionicons name="finger-print" size={24} color="#fff" />
            <Text style={styles.buttonText}>Test Authentication</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={toggleBiometric}
            disabled={isLoading || Platform.OS === 'web'}
          >
            <Ionicons name="settings" size={24} color="#4682B4" />
            <Text style={styles.secondaryButtonText}>
              {testResults?.enabled ? 'Disable' : 'Enable'} Biometric
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={runInitialTest}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={24} color="#4682B4" />
            <Text style={styles.secondaryButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        {authResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{authResult}</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#4682B4" />
          <Text style={styles.infoText}>
            {Platform.OS === 'web'
              ? 'Biometric authentication is not available on web browsers. Please test on a mobile device.'
              : 'Ensure your device has biometric authentication set up in device settings.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b1b1b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1b1b1b',
  },
  success: {
    color: '#27ae60',
  },
  error: {
    color: '#e74c3c',
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4682B4',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1b1b1b',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#ffe6e6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
});
