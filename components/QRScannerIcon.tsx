import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';

interface QRScannerIconProps {
  size?: number;
  color?: string;
}

const QRScannerIcon: React.FC<QRScannerIconProps> = ({ 
  size = 50, 
  color = '#4682b4' 
}) => {
  const scale = size / 256; // Original size is 256x256
  
  return (
    <View style={{ width: size, height: size }}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 256 256" 
        fill="none"
      >
        {/* Corner frames */}
        <Path d="M32 32V64H48V48H64V32H32Z" fill={color}/>
        <Path d="M224 32V64H208V48H192V32H224Z" fill={color}/>
        <Path d="M32 224V192H48V208H64V224H32Z" fill={color}/>
        <Path d="M224 224V192H208V208H192V224H224Z" fill={color}/>
        
        {/* Border */}
        <Rect x="16" y="16" width="224" height="224" fill="none" stroke={color} strokeWidth="2" strokeOpacity="0.3" rx="24"/>
        
        {/* Scanning line */}
        <Line x1="32" y1="128" x2="224" y2="128" stroke={color} strokeWidth="2" opacity="0.8"/>
      </Svg>
    </View>
  );
};

export default QRScannerIcon;
export { QRScannerIcon };