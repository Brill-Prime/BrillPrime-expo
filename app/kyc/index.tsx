
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { kycService, KYCProfile } from '../../services/kycService';
import { useAlert } from '../../components/AlertProvider';

export default function KYCScreen() {
  const router = useRouter();
  const { showError, showSuccess, showConfirmDialog } = useAlert();
  const [kycProfile, setKycProfile] = useState<KYCProfile | null>(null);
  const [userRole, setUserRole] = useState<'consumer' | 'merchant' | 'driver'>('consumer');
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadKYCData();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadKYCData = async () => {
    try {
      setLoading(true);
      
      // Get user role
      const role = await AsyncStorage.getItem('userRole') as 'consumer' | 'merchant' | 'driver';
      setUserRole(role || 'consumer');

      // Load KYC profile
      const profileResponse = await kycService.getKYCProfile();
      if (profileResponse.success && profileResponse.data) {
        setKycProfile(profileResponse.data);
      }

      // Load verification status
      const statusResponse = await kycService.checkVerificationStatus();
      if (statusResponse.success && statusResponse.data) {
        setVerificationStatus(statusResponse.data);
      }
    } catch (error) {
      console.error('Error loading KYC data:', error);
      showError('Error', 'Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'rejected': return 'close-circle';
      default: return 'alert-circle';
    }
  };

  const getCompletionSteps = () => {
    const steps = [
      {
        id: 'personal',
        title: 'Personal Information',
        description: 'Complete your personal details',
        completed: kycProfile?.personalInfo?.firstName && kycProfile?.personalInfo?.lastName,
        route: '/kyc/personal-info'
      },
      {
        id: 'identity',
        title: 'Identity Verification',
        description: 'Upload government-issued ID',
        completed: kycProfile?.documents.some(doc => doc.type === 'identity' && doc.status === 'approved'),
        route: '/kyc/documents?type=identity'
      },
      {
        id: 'address',
        title: 'Address Verification',
        description: 'Upload proof of address',
        completed: kycProfile?.documents.some(doc => doc.type === 'address' && doc.status === 'approved'),
        route: '/kyc/documents?type=address'
      }
    ];

    // Add role-specific steps
    if (userRole === 'merchant') {
      steps.push({
        id: 'business',
        title: 'Business Verification',
        description: 'Upload business registration documents',
        completed: kycProfile?.documents.some(doc => doc.type === 'business' && doc.status === 'approved'),
        route: '/kyc/documents?type=business'
      });
    }

    if (userRole === 'driver') {
      steps.push(
        {
          id: 'license',
          title: 'Driver\'s License',
          description: 'Upload valid driver\'s license',
          completed: kycProfile?.documents.some(doc => doc.type === 'driver_license' && doc.status === 'approved'),
          route: '/kyc/documents?type=driver_license'
        },
        {
          id: 'vehicle',
          title: 'Vehicle Registration',
          description: 'Upload vehicle registration documents',
          completed: kycProfile?.documents.some(doc => doc.type === 'vehicle_registration' && doc.status === 'approved'),
          route: '/kyc/documents?type=vehicle_registration'
        }
      );
    }

    return steps;
  };

  const handleSubmitForVerification = async () => {
    const completedSteps = getCompletionSteps().filter(step => step.completed);
    const totalSteps = getCompletionSteps().length;

    if (completedSteps.length < totalSteps) {
      showError(
        'Incomplete Verification',
        `Please complete all required steps (${completedSteps.length}/${totalSteps} completed)`
      );
      return;
    }

    showConfirmDialog(
      'Submit for Verification',
      'Are you sure you want to submit your documents for verification? This cannot be undone.',
      async () => {
        try {
          const response = await kycService.submitForVerification();
          if (response.success) {
            showSuccess('Success', 'Your documents have been submitted for verification');
            loadKYCData(); // Refresh data
          } else {
            showError('Error', response.error || 'Failed to submit for verification');
          }
        } catch (error) {
          showError('Error', 'Failed to submit for verification');
        }
      }
    );
  };

  const StatusCard = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(verificationStatus?.status || 'incomplete') }]}>
          <Ionicons 
            name={getStatusIcon(verificationStatus?.status || 'incomplete')} 
            size={24} 
            color="white" 
          />
        </View>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>
            {verificationStatus?.status === 'verified' ? 'Verified' :
             verificationStatus?.status === 'pending' ? 'Under Review' :
             verificationStatus?.status === 'rejected' ? 'Rejected' : 'Not Verified'}
          </Text>
          <Text style={styles.statusSubtitle}>
            Verification Level: {verificationStatus?.level || 'Unverified'}
          </Text>
        </View>
      </View>
      
      {verificationStatus?.completionPercentage !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${verificationStatus.completionPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {verificationStatus.completionPercentage}% Complete
          </Text>
        </View>
      )}
    </View>
  );

  const StepCard = ({ step, index }: { step: any; index: number }) => (
    <TouchableOpacity
      style={[styles.stepCard, step.completed && styles.completedStep]}
      onPress={() => router.push(step.route)}
    >
      <View style={styles.stepNumber}>
        {step.completed ? (
          <Ionicons name="checkmark" size={16} color="white" />
        ) : (
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        )}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, step.completed && styles.completedStepTitle]}>
          {step.title}
        </Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);
  const completionSteps = getCompletionSteps();
  const completedCount = completionSteps.filter(step => step.completed).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading verification data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Identity Verification</Text>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => router.push('/support')}
        >
          <Ionicons name="help-circle-outline" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={{ marginHorizontal: responsivePadding }}>
          <StatusCard />
        </View>

        {/* Next Steps */}
        {verificationStatus?.nextSteps && verificationStatus.nextSteps.length > 0 && (
          <View style={[styles.section, { marginHorizontal: responsivePadding }]}>
            <Text style={styles.sectionTitle}>Next Steps</Text>
            {verificationStatus.nextSteps.map((step: string, index: number) => (
              <View key={index} style={styles.nextStepItem}>
                <Ionicons name="chevron-forward" size={16} color="#4682B4" />
                <Text style={styles.nextStepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Verification Steps */}
        <View style={[styles.section, { marginHorizontal: responsivePadding }]}>
          <Text style={styles.sectionTitle}>
            Verification Steps ({completedCount}/{completionSteps.length})
          </Text>
          
          {completionSteps.map((step, index) => (
            <StepCard key={step.id} step={step} index={index} />
          ))}
        </View>

        {/* Submit Button */}
        {completedCount === completionSteps.length && verificationStatus?.status === 'incomplete' && (
          <View style={[styles.submitSection, { marginHorizontal: responsivePadding }]}>
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitForVerification}
            >
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Information Section */}
        <View style={[styles.infoSection, { marginHorizontal: responsivePadding }]}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#4682B4" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Why verify your identity?</Text>
              <Text style={styles.infoText}>
                Identity verification helps us keep the platform safe and secure for all users. 
                It also unlocks additional features and higher transaction limits.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  helpButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 15,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  nextStepText: {
    fontSize: 14,
    color: '#4682B4',
    marginLeft: 8,
    flex: 1,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  completedStep: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 4,
  },
  completedStepTitle: {
    color: '#4682B4',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  submitSection: {
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 30,
  },
});
