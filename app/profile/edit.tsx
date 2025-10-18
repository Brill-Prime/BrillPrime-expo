
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
  const imageInputRef = useRef<HTMLInputElement>(null);
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
    // For web, directly open file picker
    if (Platform.OS === 'web') {
      openImageLibrary();
      return;
    }

    // For mobile, show alert dialog with options
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
    // Use web input for web platform
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Profile photo must be less than 5MB');
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUri = e.target?.result as string;
      setProfile(prev => ({ ...prev, profileImage: imageUri }));
    };
    reader.readAsDataURL(file);

    // Reset input
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

      // Upload profile photo if it's a local file URI (not a URL)
      if (profile.profileImage && profile.profileImage.startsWith('file://')) {
        const uploadResponse = await userService.uploadProfilePhoto(profile.profileImage);
        
        if (uploadResponse.success && uploadResponse.data) {
          profileImageUrl = uploadResponse.data.profileImageUrl;
          showSuccess('Success', 'Profile photo uploaded successfully');
        } else {
          showError('Warning', uploadResponse.error || 'Failed to upload profile photo, but continuing with profile update');
        }
      }

      // Update profile with all data including photo URL
      const updateResponse = await userService.updateProfile({
        firstName: profile.businessName,
        lastName: '',
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        profileImageUrl: profileImageUrl
      });

      if (updateResponse.success) {
        // Save to AsyncStorage for offline access
        await AsyncStorage.setItem('merchantBusinessName', profile.businessName);
        await AsyncStorage.setItem('userName', profile.businessName);
        await AsyncStorage.setItem('merchantCategory', profile.category);
        await AsyncStorage.setItem('userEmail', profile.email);
        await AsyncStorage.setItem('userPhone', profile.phone);
        if (profile.address) {
          await AsyncStorage.setItem('userAddress', profile.address);
        }
        await AsyncStorage.setItem('merchantOperatingHours', JSON.stringify(profile.operatingHours));
        
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
                  <Ionicons name="business" size={50} color="#4682B4" />
                </View>
              )}
              <View style={styles.editIconContainer}>
                <Image 
                  source={require('../../assets/images/camera_icon.png')}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
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
  inputLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    fontFamily: 'Montserrat-Bold',
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
  operatingHoursSection: {
    marginBottom: 30,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: -20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    fontFamily: 'Montserrat-SemiBold',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 5,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    width: 100,
    fontFamily: 'Montserrat-SemiBold',
  },
  timeField: {
    flex: 1,
    height: 33,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginLeft: 15,
  },
  timeInput: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  editButton: {
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
  editButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 30,
  },
});
