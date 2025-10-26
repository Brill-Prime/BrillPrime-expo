
import React, { useState } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OptimizedImageProps extends ImageProps {
  fallback?: boolean;
  showLoader?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallback = true,
  showLoader = true,
  style,
  resizeMode = 'cover',
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {!error ? (
        <>
          <Image
            source={source}
            style={[styles.image, style]}
            resizeMode={resizeMode}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            {...props}
          />
          {loading && showLoader && (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color="#4682B4" />
            </View>
          )}
        </>
      ) : fallback ? (
        <View style={[styles.fallback, style]}>
          <Ionicons name="image-outline" size={40} color="#ccc" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
