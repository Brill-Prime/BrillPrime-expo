
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
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

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4682B4" />
            <Text style={styles.loadingText}>Testing biometric...</Text>
          </View>
        ) : testResults ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Available:</Text>
              <Text style={[styles.value, testResults.available ? styles.success : styles.error]}>
                {testResults.available ? 'Yes ✓' : 'No ✗'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Type:</Text>
              <Text style={styles.value}>{testResults.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Enabled:</Text>
              <Text style={[styles.value, testResults.enabled ? styles.success : styles.error]}>
                {testResults.enabled ? 'Yes ✓' : 'No ✗'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Hardware:</Text>
              <Text style={[styles.value, testResults.hardware ? styles.success : styles.error]}>
                {testResults.hardware ? 'Yes ✓' : 'No ✗'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Enrolled:</Text>
              <Text style={[styles.value, testResults.enrolled ? styles.success : styles.error]}>
                {testResults.enrolled ? 'Yes ✓' : 'No ✗'}
              </Text>
            </View>
            {testResults.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorLabel}>Error:</Text>
                <Text style={styles.errorText}>{testResults.error}</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testAuthentication}
            disabled={isLoading || Platform.OS === 'web'}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  success: {
    color: '#27ae60',
  },
  error: {
    color: '#e74c3c',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  buttonGroup: {
    marginVertical: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4682B4',
  },
  secondaryButtonText: {
    color: '#4682B4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultBox: {
    backgroundColor: '#e8f4f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  resultText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 20,
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fee',
    borderRadius: 5,
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
  },
});
