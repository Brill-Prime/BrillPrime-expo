
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ArrowForwardIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const ArrowForwardIcon: React.FC<ArrowForwardIconProps> = ({ 
  size = 20, 
  color = 'white',
  style 
}) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 34 21" 
        fill="none"
      >
        <Path 
          d="M20.8661 20.9124L19.6577 19.8916L29.9286 11.2145H0.807739V9.78532H29.9286L19.6577 1.10824L20.8661 0.0874023L33.1911 10.4999L20.8661 20.9124Z" 
          fill={color}
        />
      </Svg>
    </View>
  );
};

export default ArrowForwardIcon;
