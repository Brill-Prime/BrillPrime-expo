import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminAuthIndex() {
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const [adminToken, adminTokenExpiry] = await AsyncStorage.multiGet([
        'adminToken',
        'adminTokenExpiry'
      ]);

      const isTokenExpired = adminTokenExpiry[1] 
        ? Date.now() > parseInt(adminTokenExpiry[1]) 
        : true;

      if (adminToken[1] && !isTokenExpired) {
        // Admin is already authenticated, redirect to admin dashboard
        router.replace('/admin');
      } else {
        // No valid admin session, redirect to admin signin
        router.replace('/admin/auth/signin');
      }
    } catch (error) {
      console.error('Admin auth check error:', error);
      router.replace('/admin/auth/signin');
    }
  };

  return null; // This component just handles routing
}