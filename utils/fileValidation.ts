
export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  file?: {
    name: string;
    size: number;
    type: string;
    uri: string;
  };
}

export const validateFileUpload = (
  file: {
    name: string;
    size: number;
    type: string;
    uri: string;
  },
  options: FileValidationOptions = {}
): FileValidationResult => {
  const {
    maxSizeInMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
  } = options;

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeInMB}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file extension
  const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
    };
  }

  return { isValid: true, file };
};

export const validateImageDimensions = async (
  uri: string,
  maxWidth: number = 4096,
  maxHeight: number = 4096
): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => {
        if (img.width > maxWidth || img.height > maxHeight) {
          resolve({
            isValid: false,
            error: `Image dimensions too large. Max: ${maxWidth}x${maxHeight}px, Current: ${img.width}x${img.height}px`
          });
        } else {
          resolve({ isValid: true });
        }
      };
      img.onerror = () => {
        resolve({ isValid: false, error: 'Failed to load image' });
      };
      img.src = uri;
    } else {
      // Mobile environment - skip dimension check
      resolve({ isValid: true });
    }
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
