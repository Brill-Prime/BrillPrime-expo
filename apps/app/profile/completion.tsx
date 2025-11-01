import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';

interface CompletionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  route?: string;
}

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const { showSuccess } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [completionSteps, setCompletionSteps] = useState<CompletionStep[]>([
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Add your basic personal details',
      completed: false,
      required: true,
      route: '/profile/consumer-edit'
    },
    {
      id: 'addresses',
      title: 'Delivery Addresses',
      description: 'Add your delivery locations',
      completed: false,
      required: true,
      route: '/profile/addresses'
    },
    {
      id: 'payment_methods',
      title: 'Payment Methods',
      description: 'Set up your payment options',
      completed: false,
      required: true,
      route: '/profile/payment-methods'
    },
    {
      id: 'verification',
      title: 'Identity Verification',
      description: 'Verify your identity for enhanced security',
      completed: false,
      required: false,
      route: '/profile/verification'
    },
    {
      id: 'social_media',
      title: 'Social Media',
      description: 'Connect your social media accounts',
      completed: false,
      required: false,
      route: '/profile/social-media'
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      description: 'Customize your notification settings',
      completed: false,
      required: false,
      route: '/profile/notification-settings'
    }
  ]);

  useEffect(() => {
    loadCompletionStatus();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const loadCompletionStatus = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      const savedAddresses = await AsyncStorage.getItem('savedAddresses');
      const paymentMethods = await AsyncStorage.getItem('paymentMethods');
      const verificationStatus = await AsyncStorage.getItem('verificationStatus');
      const socialMedia = await AsyncStorage.getItem('socialMediaLinks');
      const notificationSettings = await AsyncStorage.getItem('notificationSettings');

      const userData = userDataString ? JSON.parse(userDataString) : {};
      const addresses = savedAddresses ? JSON.parse(savedAddresses) : [];
      const payments = paymentMethods ? JSON.parse(paymentMethods) : [];
      const verification = verificationStatus ? JSON.parse(verificationStatus) : { verified: false };
      const social = socialMedia ? JSON.parse(socialMedia) : {};
      const notifications = notificationSettings ? JSON.parse(notificationSettings) : {};

      setCompletionSteps(prev => prev.map(step => {
        switch (step.id) {
          case 'personal_info':
            return { ...step, completed: !!(userData.name && userData.email && userData.phone) };
          case 'addresses':
            return { ...step, completed: addresses.length > 0 };
          case 'payment_methods':
            return { ...step, completed: payments.length > 0 };
          case 'verification':
            return { ...step, completed: verification.verified };
          case 'social_media':
            return { ...step, completed: Object.keys(social).length > 0 };
          case 'notifications':
            return { ...step, completed: Object.keys(notifications).length > 0 };
          default:
            return step;
        }
      }));
    } catch (error) {
      console.error('Error loading completion status:', error);
    }
  };

  const handleStepPress = (step: CompletionStep) => {
    if (step.route) {
      router.push(step.route as any);
    }
  };

  const getCompletionPercentage = () => {
    const completed = completionSteps.filter(step => step.completed).length;
    return Math.round((completed / completionSteps.length) * 100);
  };

  const getRequiredCompletionPercentage = () => {
    const requiredSteps = completionSteps.filter(step => step.required);
    const completedRequired = requiredSteps.filter(step => step.completed).length;
    return Math.round((completedRequired / requiredSteps.length) * 100);
  };

  const handleCompleteProfile = () => {
    const requiredSteps = completionSteps.filter(step => step.required);
    const incompleteRequired = requiredSteps.filter(step => !step.completed);

    if (incompleteRequired.length > 0) {
      Alert.alert(
        'Complete Required Steps',
        'Please complete all required steps before finishing your profile setup.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Profile Complete!',
      'Congratulations! Your profile is now complete. You can always update your information later.',
      [
        {
          text: 'Continue',
          onPress: () => {
            router.replace('/home/consumer');
          }
        }
      ]
    );
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);
  const completionPercentage = getCompletionPercentage();
  const requiredCompletion = getRequiredCompletionPercentage();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Progress Overview */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Profile Completion</Text>
              <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${completionPercentage}%` }]}
              />
            </View>

            <Text style={styles.progressText}>
              {requiredCompletion === 100
                ? 'Great! All required steps are complete.'
                : `${completionSteps.filter(s => s.required && !s.completed).length} required steps remaining`
              }
            </Text>
          </View>

          {/* Completion Steps */}
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Complete Your Profile</Text>

            {completionSteps.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.stepCard,
                  step.completed && styles.completedStep,
                  step.required && !step.completed && styles.requiredStep
                ]}
                onPress={() => handleStepPress(step)}
              >
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepIcon,
                    step.completed && styles.completedIcon,
                    step.required && !step.completed && styles.requiredIcon
                  ]}>
                    {step.completed ? (
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        step.required && !step.completed && styles.requiredNumber
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={[
                        styles.stepTitle,
                        step.completed && styles.completedTitle
                      ]}>
                        {step.title}
                      </Text>
                      {step.required && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={step.completed ? "#27ae60" : "#666"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Complete Button */}
          {requiredCompletion === 100 && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteProfile}
            >
              <Text style={styles.completeButtonText}>Complete Profile Setup</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  stepsContainer: {
    marginBottom: 25,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 15,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  completedStep: {
    backgroundColor: '#f8fff8',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  requiredStep: {
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  completedIcon: {
    backgroundColor: '#27ae60',
  },
  requiredIcon: {
    backgroundColor: '#e74c3c',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  requiredNumber: {
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginRight: 10,
  },
  completedTitle: {
    color: '#27ae60',
  },
  requiredBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#4682B4',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  bottomSpacing: {
    height: 30,
  },
});
