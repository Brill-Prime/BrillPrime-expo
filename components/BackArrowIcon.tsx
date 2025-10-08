
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Mask, Rect, G, Defs } from 'react-native-svg';

interface BackArrowIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const BackArrowIcon: React.FC<BackArrowIconProps> = ({ 
  size = 24, 
  color = '#1C1B1F',
  style 
}) => {
  const maskId = `mask_back_${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none"
      >
        <Defs>
          <Mask id={maskId} maskContentUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
            <Rect width="24" height="24" fill="white"/>
          </Mask>
        </Defs>
        <G mask={`url(#${maskId})`}>
          <Path 
            d="M7.825 13L13.425 18.6L12 20L4 12L12 4L13.425 5.4L7.825 11H20V13H7.825Z" 
            fill={color}
          />
        </G>
      </Svg>
    </View>
  );
};

export default BackArrowIcon;
