import React from 'react';
import { View } from 'react-native';

export const PROVIDER_GOOGLE = 'google' as const;

export const Marker = () => null; // no-op on web

export default function MapViewWeb({ style, children, ...props }: { 
  style?: any; 
  children?: React.ReactNode;
  [key: string]: any;
}) {
  return <View style={[style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>{children}</View>;
}