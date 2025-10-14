
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAlert } from './AlertProvider';

const { width } = Dimensions.get('window');

export interface Attachment {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'document';
  size?: number;
  mimeType?: string;
}

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxAttachments?: number;
  allowedTypes?: ('image' | 'document')[];
  maxFileSize?: number; // in MB
  placeholder?: string;
  style?: any;
}

export default function AttachmentUploader({
  attachments,
  onAttachmentsChange,
  maxAttachments = 5,
  allowedTypes = ['image', 'document'],
  maxFileSize = 10,
  placeholder = 'Add attachments',
  style,
}: AttachmentUploaderProps) {
  const { showError, showSuccess } = useAlert();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const requestPermissions = async () => {
    if (allowedTypes.includes('image')) {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        showError(
          'Permissions Required',
          'Please grant camera and photo library permissions to upload images.'
        );
        return false;
      }
    }
    return true;
  };

  const validateFile = (file: any): boolean => {
    if (file.size && file.size > maxFileSize * 1024 * 1024) {
      showError('File Too Large', `File size must be less than ${maxFileSize}MB`);
      return false;
    }
    return true;
  };

  const addAttachment = (attachment: Attachment) => {
    if (attachments.length >= maxAttachments) {
      showError('Limit Reached', `You can only upload up to ${maxAttachments} attachments`);
      return;
    }
    
    const newAttachments = [...attachments, attachment];
    onAttachmentsChange(newAttachments);
    showSuccess('Success', 'Attachment added successfully');
  };

  const removeAttachment = (id: string) => {
    const newAttachments = attachments.filter(att => att.id !== id);
    onAttachmentsChange(newAttachments);
  };

  const takePhoto = async () => {
    try {
      setUploading(true);
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (validateFile(asset)) {
          const attachment: Attachment = {
            id: Date.now().toString(),
            uri: asset.uri,
            name: `photo_${Date.now()}.jpg`,
            type: 'image',
            size: asset.fileSize,
            mimeType: 'image/jpeg',
          };
          addAttachment(attachment);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showError('Error', 'Failed to take photo');
    } finally {
      setUploading(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      setUploading(true);
      
      // Use web input for web platform
      if (Platform.OS === 'web') {
        selectFromGalleryWeb();
        setUploading(false);
        return;
      }

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: maxAttachments - attachments.length,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          if (validateFile(asset)) {
            const attachment: Attachment = {
              id: `${Date.now()}_${Math.random()}`,
              uri: asset.uri,
              name: asset.fileName || `image_${Date.now()}.jpg`,
              type: 'image',
              size: asset.fileSize,
              mimeType: asset.mimeType || 'image/jpeg',
            };
            addAttachment(attachment);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      showError('Error', 'Failed to select images');
    } finally {
      setUploading(false);
    }
  };

  const selectDocument = async () => {
    try {
      setUploading(true);
      
      // Use web input for web platform
      if (Platform.OS === 'web') {
        handleWebDocumentSelect();
        setUploading(false);
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          if (validateFile(asset)) {
            const attachment: Attachment = {
              id: `${Date.now()}_${Math.random()}`,
              uri: asset.uri,
              name: asset.name,
              type: 'document',
              size: asset.size,
              mimeType: asset.mimeType,
            };
            addAttachment(attachment);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      showError('Error', 'Failed to select document');
    } finally {
      setUploading(false);
    }
  };

  const selectFromGalleryWeb = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleWebDocumentSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleWebImageChange = (event: any) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    Array.from(files).forEach((file: any) => {
      if (file.size > maxFileSize * 1024 * 1024) {
        showError('File Too Large', `File size must be less than ${maxFileSize}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: Attachment = {
          id: `${Date.now()}_${Math.random()}`,
          uri: e.target?.result as string,
          name: file.name,
          type: 'image',
          size: file.size,
          mimeType: file.type,
        };
        addAttachment(attachment);
      };
      reader.readAsDataURL(file);
    });
    setUploading(false);
    
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleWebFileChange = (event: any) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    Array.from(files).forEach((file: any) => {
      if (file.size > maxFileSize * 1024 * 1024) {
        showError('File Too Large', `File size must be less than ${maxFileSize}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: Attachment = {
          id: `${Date.now()}_${Math.random()}`,
          uri: e.target?.result as string,
          name: file.name,
          type: 'document',
          size: file.size,
          mimeType: file.type,
        };
        addAttachment(attachment);
      };
      reader.readAsDataURL(file);
    });
    setUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const showUploadOptions = () => {
    const options: any[] = [];
    
    if (allowedTypes.includes('image')) {
      // On web, don't show "Take Photo" option
      if (Platform.OS !== 'web') {
        options.push({ text: 'Take Photo', onPress: takePhoto });
      }
      options.push({ text: 'Choose from Gallery', onPress: selectFromGallery });
    }
    
    if (allowedTypes.includes('document')) {
      options.push({ text: 'Select Document', onPress: selectDocument });
    }
    
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Add Attachment', 'Choose how you want to add an attachment', options);
  };

  const getFileIcon = (attachment: Attachment) => {
    if (attachment.type === 'image') {
      return 'image';
    }
    
    const ext = attachment.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'document-text';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'grid';
      case 'ppt':
      case 'pptx':
        return 'easel';
      default:
        return 'attach';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Hidden file inputs for web */}
      {Platform.OS === 'web' && (
        <>
          <input
            ref={imageInputRef as any}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleWebImageChange}
          />
          <input
            ref={fileInputRef as any}
            type="file"
            accept="*/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleWebFileChange}
          />
        </>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={showUploadOptions}
        disabled={uploading || attachments.length >= maxAttachments}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#4682B4" />
        ) : (
          <Ionicons name="add" size={24} color="#4682B4" />
        )}
        <Text style={styles.uploadButtonText}>
          {uploading ? 'Uploading...' : placeholder}
        </Text>
        <Text style={styles.uploadLimitText}>
          {attachments.length}/{maxAttachments}
        </Text>
      </TouchableOpacity>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <ScrollView style={styles.attachmentsList} showsVerticalScrollIndicator={false}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              {attachment.type === 'image' ? (
                <Image source={{ uri: attachment.uri }} style={styles.thumbnailImage} />
              ) : (
                <View style={styles.documentIcon}>
                  <Ionicons name={getFileIcon(attachment)} size={24} color="#4682B4" />
                </View>
              )}
              
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                {attachment.size && (
                  <Text style={styles.attachmentSize}>
                    {formatFileSize(attachment.size)}
                  </Text>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeAttachment(attachment.id)}
              >
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4682B4',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#4682B4',
    marginLeft: 8,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  uploadLimitText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  attachmentsList: {
    marginTop: 10,
    maxHeight: 200,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f7ff',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Montserrat-Medium',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Montserrat-Regular',
  },
  removeButton: {
    padding: 4,
  },
});
