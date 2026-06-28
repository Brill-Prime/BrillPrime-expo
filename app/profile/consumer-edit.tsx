import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../components/AlertProvider';

interface ConsumerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  profileImage?: string;
}

export default function ConsumerEditProfileScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ConsumerProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profileImage: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadConsumerProfile();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadConsumerProfile = async () => {
    try {
      // First try to load from Supabase
      const { userService } = await import('../../services/userService');
      const response = await userService.getProfile();

      if (response.success && response.data) {
        const userData = response.data;
        const profileData = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dateOfBirth: '', // TODO: Add to database schema
          gender: '', // TODO: Add to database schema
          profileImage: userData.profileImageUrl || undefined,
        };
        setProfile(profileData);

        // Update AsyncStorage cache
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        // Fallback to AsyncStorage
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setProfile({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender || '',
            profileImage: userData.profileImageUrl || undefined,
          });
        }
      }
    } catch (error) {
      console.error('Error loading consumer profile:', error);
      showError('Error', 'Failed to load profile. Please try again.');
    }
  };

  const updateProfile = (field: keyof ConsumerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!profile.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!profile.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
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

    // Phone validation (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(profile.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'web') {
      openImageLibrary();
      return;
    }

    const options: any[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Camera', onPress: openCamera },
      { text: 'Photo Library', onPress: openImageLibrary },
      { text: 'Remove Photo', onPress: removePhoto, style: 'destructive' }
    ];

    Alert.alert('Change Profile Photo', 'Choose an option', options);
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
    if (Platform.OS === 'web') {
      if (imageInputRef.current) {
        imageInputRef.current.click();
      }
      return;
    }

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

  const handleWebImageChange = (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Profile photo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUri = e.target?.result as string;
      setProfile(prev => ({ ...prev, profileImage: imageUri }));
    };
    reader.readAsDataURL(file);

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removePhoto = () => {
    setProfile(prev => ({ ...prev, profileImage: undefined }));
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const { userService } = await import('../../services/userService');
      let profileImageUrl = profile.profileImage;

      if (profile.profileImage && profile.profileImage.startsWith('file://')) {
        const uploadResponse = await userService.uploadProfilePhoto(profile.profileImage);

        if (uploadResponse.success && uploadResponse.data) {
          profileImageUrl = uploadResponse.data.profileImageUrl;
          showSuccess('Success', 'Profile photo uploaded successfully');
        } else {
          showError('Warning', uploadResponse.error || 'Failed to upload profile photo, but continuing with profile update');
        }
      }

      const updateResponse = await userService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        profileImageUrl: profileImageUrl
      });

      if (updateResponse.success) {
        // Save to AsyncStorage
        const updatedUserData = {
          ...JSON.parse(await AsyncStorage.getItem('userData') || '{}'),
          firstName: profile.firstName,
          lastName: profile.lastName,
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          profileImageUrl: profileImageUrl,
        };

        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        await AsyncStorage.setItem('userFirstName', profile.firstName);
        await AsyncStorage.setItem('userLastName', profile.lastName);
        await AsyncStorage.setItem('userName', `${profile.firstName} ${profile.lastName}`);
        await AsyncStorage.setItem('userEmail', profile.email);
        await AsyncStorage.setItem('userPhone', profile.phone);
        await AsyncStorage.setItem('userDateOfBirth', profile.dateOfBirth);
        await AsyncStorage.setItem('userGender', profile.gender);

        if (profileImageUrl) {
          await AsyncStorage.setItem('userProfileImage', profileImageUrl);
        } else {
          await AsyncStorage.removeItem('userProfileImage');
        }

        showSuccess('Success', 'Profile updated successfully');
        router.back();
      } else {
        showError('Error', updateResponse.error || 'Failed to update profile');
      }
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
      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          ref={imageInputRef as any}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleWebImageChange}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
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
                  <Ionicons name="person" size={50} color="#4682B4" />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.changePhotoText}>Tap to change photo</Text>
            {Platform.OS === 'web' && profile.profileImage && (
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={removePhoto}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={styles.removePhotoText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Personal Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profile.firstName}
                  onChangeText={(text) => updateProfile('firstName', text)}
                  placeholder="Enter your first name"
                  placeholderTextColor="#B7B7B7"
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profile.lastName}
                  onChangeText={(text) => updateProfile('lastName', text)}
                  placeholder="Enter your last name"
                  placeholderTextColor="#B7B7B7"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profile.email}
                  onChangeText={(text) => updateProfile('email', text)}
                  placeholder="Enter your email"
                  placeholderTextColor="#B7B7B7"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profile.phone}
                  onChangeText={(text) => updateProfile('phone', text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#B7B7B7"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profile.dateOfBirth}
                  onChangeText={(text) => updateProfile('dateOfBirth', text)}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#B7B7B7"
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderOptions}>
                {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      profile.gender === option && styles.selectedGender
                    ]}
                    onPress={() => updateProfile('gender', option)}
                  >
                    <Text style={[
                      styles.genderText,
                      profile.gender === option && styles.selectedGenderText
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
    fontFamily: 'Montserrat-SemiBold',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 40,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    borderWidth: 3,
    borderColor: '#4682B4',
  },
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4682B4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4682B4',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#4682B4',
    fontFamily: 'Montserrat-Medium',
    marginTop: 8,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFF5F5',
  },
  removePhotoText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 25,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: -20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    fontFamily: 'Montserrat-Bold',
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 8,
    fontFamily: 'Montserrat-SemiBold',
  },
  inputField: {
    height: 59,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: '#fff',
  },
  selectedGender: {
    backgroundColor: '#4682B4',
  },
  genderText: {
    fontSize: 14,
    color: '#4682B4',
    fontFamily: 'Montserrat-Medium',
  },
  selectedGenderText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#4682B4',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 58,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 30,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 160,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    shadowColor: '#bdc3c7',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 30,
  },
});
