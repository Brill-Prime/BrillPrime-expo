
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Messages() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual messages screen
    router.replace('/messages');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4682B4" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
