
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Account() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    loadUserData();
    return () => subscription?.remove();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Load user data from AsyncStorage (stored by authService)
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserInfo({
          name: userData.name || userData.firstName + ' ' + userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || userData.phoneNumber || '',
          address: userData.address || ''
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Load existing user data
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        
        // Update with new values
        const updatedUserData = {
          ...userData,
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          address: userInfo.address,
        };
        
        // Save back to AsyncStorage
        await AsyncStorage.multiSet([
          ['userData', JSON.stringify(updatedUserData)],
          ['userEmail', userInfo.email],
        ]);
      }
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const styles = getResponsiveStyles(screenData);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <TouchableOpacity 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userInfo.name}
              onChangeText={(text) => setUserInfo(prev => ({ ...prev, name: text }))}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userInfo.email}
              onChangeText={(text) => setUserInfo(prev => ({ ...prev, email: text }))}
              editable={isEditing}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={userInfo.phone}
              onChangeText={(text) => setUserInfo(prev => ({ ...prev, phone: text }))}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, !isEditing && styles.disabledInput]}
              value={userInfo.address}
              onChangeText={(text) => setUserInfo(prev => ({ ...prev, address: text }))}
              editable={isEditing}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notifications ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Location Services</Text>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={locationServices ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/profile/change-password')}
          >
            <Ionicons name="key" size={20} color="#667eea" />
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/profile/privacy-settings')}
          >
            <Ionicons name="shield-checkmark" size={20} color="#667eea" />
            <Text style={styles.actionButtonText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
            <Ionicons name="trash" size={20} color="#ff6b6b" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
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
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#333',
    },
    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#667eea',
      borderRadius: 8,
    },
    editButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: isTablet ? 16 : 14,
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.04),
    },
    section: {
      backgroundColor: 'white',
      marginVertical: Math.max(8, height * 0.01),
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: Math.max(16, height * 0.02),
    },
    inputGroup: {
      marginBottom: Math.max(16, height * 0.02),
    },
    label: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      fontWeight: '500',
      color: '#666',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: Math.max(12, width * 0.03),
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      backgroundColor: 'white',
    },
    textArea: {
      height: isTablet ? 80 : 60,
      textAlignVertical: 'top',
    },
    disabledInput: {
      backgroundColor: '#f8f9fa',
      color: '#666',
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Math.max(12, height * 0.015),
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#333',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Math.max(16, height * 0.02),
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    actionButtonText: {
      flex: 1,
      marginLeft: 12,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#333',
    },
    dangerButton: {
      borderBottomWidth: 0,
    },
    dangerText: {
      color: '#ff6b6b',
    },
  });
};
