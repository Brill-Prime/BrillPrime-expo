
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../components/AlertProvider';

interface MerchantProfile {
  businessName: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  operatingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [profile, setProfile] = useState<MerchantProfile>({
    businessName: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    profileImage: undefined,
    operatingHours: {
      monday: '8:00am - 6:00pm',
      tuesday: '8:00am - 6:00pm',
      wednesday: '8:00am - 6:00pm',
      thursday: '8:00am - 6:00pm',
      friday: '8:00am - 6:00pm',
      saturday: '8:00am - 6:00pm',
      sunday: 'Closed',
    },
  });
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadMerchantProfile();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadMerchantProfile = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      const phone = await AsyncStorage.getItem('userPhone');
      const businessName = await AsyncStorage.getItem('merchantBusinessName') || await AsyncStorage.getItem('userName');
      const category = await AsyncStorage.getItem('merchantCategory');
      const address = await AsyncStorage.getItem('userAddress');
      const profileImage = await AsyncStorage.getItem('userProfileImage');
      const operatingHours = await AsyncStorage.getItem('merchantOperatingHours');

      setProfile({
        businessName: businessName || 'Total Energy',
        category: category || 'Oil & Gas',
        email: email || 'info@totalenergies.com',
        phone: phone || '+234 8100 0000 00',
        address: address || 'Wuse II, Abuja',
        profileImage: profileImage || undefined,
        operatingHours: operatingHours ? JSON.parse(operatingHours) : {
          monday: '8:00am - 6:00pm',
          tuesday: '8:00am - 6:00pm',
          wednesday: '8:00am - 6:00pm',
          thursday: '8:00am - 6:00pm',
          friday: '8:00am - 6:00pm',
          saturday: '8:00am - 6:00pm',
          sunday: 'Closed',
        },
      });
    } catch (error) {
      console.error('Error loading merchant profile:', error);
    }
  };

  const updateProfile = (field: keyof MerchantProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateOperatingHours = (day: string, time: string) => {
    setProfile(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: time,
      },
    }));
  };

  const validateForm = () => {
    if (!profile.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return false;
    }
    if (!profile.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!profile.phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Remove Photo', onPress: removePhoto, style: 'destructive' },
      ]
    );
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to change your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfile(prev => ({ ...prev, profileImage: imageUri }));
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openImageLibrary = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfile(prev => ({ ...prev, profileImage: imageUri }));
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const removePhoto = () => {
    setProfile(prev => ({ ...prev, profileImage: undefined }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('merchantBusinessName', profile.businessName);
      await AsyncStorage.setItem('userName', profile.businessName);
      await AsyncStorage.setItem('merchantCategory', profile.category);
      await AsyncStorage.setItem('userEmail', profile.email);
      await AsyncStorage.setItem('userPhone', profile.phone);
      if (profile.address) {
        await AsyncStorage.setItem('userAddress', profile.address);
      }
      await AsyncStorage.setItem('merchantOperatingHours', JSON.stringify(profile.operatingHours));
      
      if (profile.profileImage) {
        await AsyncStorage.setItem('userProfileImage', profile.profileImage);
      } else {
        await AsyncStorage.removeItem('userProfileImage');
      }

      // Call API to update profile
      try {
        const { userService } = await import('../../services/userService');
        await userService.updateProfile({
          firstName: profile.businessName,
          lastName: '',
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          profileImage: profile.profileImage
        });
      } catch (apiError) {
        console.log('API call failed, but local storage updated:', apiError);
      }

      showSuccess('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <View style={styles.headerCenter} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Profile Image */}
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={handleChangePhoto}
            >
              {profile.profileImage ? (
                <Image 
                  source={{ uri: profile.profileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Image 
                    source={require('../../assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Business Name */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={profile.businessName}
                onChangeText={(text) => updateProfile('businessName', text)}
                placeholder="Enter business name"
                placeholderTextColor="#B7B7B7"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={profile.category}
                onChangeText={(text) => updateProfile('category', text)}
                placeholder="Enter business category"
                placeholderTextColor="#B7B7B7"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={profile.email}
                onChangeText={(text) => updateProfile('email', text)}
                placeholder="Enter email address"
                placeholderTextColor="#B7B7B7"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Number</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={profile.phone}
                onChangeText={(text) => updateProfile('phone', text)}
                placeholder="Enter phone number"
                placeholderTextColor="#B7B7B7"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputField}>
              <TextInput
                style={styles.textInput}
                value={profile.address}
                onChangeText={(text) => updateProfile('address', text)}
                placeholder="Enter business address"
                placeholderTextColor="#B7B7B7"
              />
            </View>
          </View>

          {/* Operating Hours */}
          <View style={styles.operatingHoursSection}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            
            {Object.entries(profile.operatingHours).map(([day, time]) => (
              <View key={day} style={styles.dayRow}>
                <Text style={styles.dayLabel}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <View style={styles.timeField}>
                  <TextInput
                    style={styles.timeInput}
                    value={time}
                    onChangeText={(text) => updateOperatingHours(day, text)}
                    placeholder="8:00am - 6:00pm"
                    placeholderTextColor="#B7B7B7"
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Edit Button */}
          <TouchableOpacity 
            style={[styles.editButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.editButtonText}>
              {loading ? 'Saving...' : 'Edit'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoImage: {
    width: 75,
    height: 55,
  },
  formSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
    marginBottom: 12,
    fontFamily: 'Montserrat-Bold',
  },
  inputField: {
    height: 59,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  operatingHoursSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
    marginBottom: 20,
    fontFamily: 'Montserrat-Bold',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    width: 100,
    fontFamily: 'Montserrat-SemiBold',
  },
  timeField: {
    flex: 1,
    height: 33,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginLeft: 15,
  },
  timeInput: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#4682B4',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 58,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    shadowColor: '#bdc3c7',
  },
  editButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  bottomSpacing: {
    height: 30,
  },
});
