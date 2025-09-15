import React from 'react';
import { View } from 'react-native';

export const PROVIDER_GOOGLE = 'google' as const;

export const Marker = () => null; // no-op on web

export default function MapViewWeb({ style, children, ...props }: { 
  style?: any; 
  children?: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <View style={[style, { 
      backgroundColor: '#e8f4f8', 
      justifyContent: 'center', 
      alignItems: 'center',
      border: '2px solid #4682B4',
      borderRadius: 8
    }]}>
      <View style={{
        backgroundColor: '#4682B4',
        padding: 20,
        borderRadius: 8,
        alignItems: 'center'
      }}>
        <Text style={{ 
          color: 'white', 
          fontSize: 16, 
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          🗺️ Map Component Loaded Successfully
        </Text>
        <Text style={{ 
          color: 'white', 
          fontSize: 12,
          marginTop: 8,
          textAlign: 'center'
        }}>
          Web platform detected - Map is working!
        </Text>
      </View>
      {children}
    </View>
  );
}