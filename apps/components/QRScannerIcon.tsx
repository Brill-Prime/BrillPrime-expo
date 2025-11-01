
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

interface QRScannerIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const QRScannerIcon: React.FC<QRScannerIconProps> = ({ 
  size = 50, 
  color = '#4682b4',
  style 
}) => {
  const gradientId = `gradient_${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 256 256" 
        fill="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="50%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        
        {/* Corner frames */}
        <Path d="M32 32V64H48V48H64V32H32Z" fill={color}/>
        <Path d="M224 32V64H208V48H192V32H224Z" fill={color}/>
        <Path d="M32 224V192H48V208H64V224H32Z" fill={color}/>
        <Path d="M224 224V192H208V208H192V224H224Z" fill={color}/>
        
        {/* Border */}
        <Rect x="16" y="16" width="224" height="224" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.3" rx="24"/>
        
        {/* Scanning line */}
        <Line x1="32" y1="128" x2="224" y2="128" stroke={`url(#${gradientId})`} strokeWidth="2"/>
      </Svg>
    </View>
  );
};

export default QRScannerIcon;
