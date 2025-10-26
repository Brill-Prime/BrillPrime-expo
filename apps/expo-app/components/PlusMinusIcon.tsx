
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PlusMinusIconProps {
  size?: number;
  color?: string;
  type: 'plus' | 'minus';
  style?: ViewStyle;
}

const PlusMinusIcon: React.FC<PlusMinusIconProps> = ({ 
  size = 20, 
  color = '#0B1A51',
  type,
  style 
}) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg 
        width={size} 
        height={size} 
        viewBox={type === 'plus' ? "0 0 19 20" : "0 0 13 5"} 
        fill="none"
      >
        {type === 'plus' ? (
          <Path 
            d="M7.68695 19.2533V0.753906H11.2348V19.2533H7.68695ZM0 11.693V8.35639H18.9217V11.693H0Z" 
            fill={color}
          />
        ) : (
          <Path 
            d="M0.651672 4.05893V0.553345H12.0132V4.05893H0.651672Z" 
            fill={color}
          />
        )}
      </Svg>
    </View>
  );
};

export default PlusMinusIcon;
