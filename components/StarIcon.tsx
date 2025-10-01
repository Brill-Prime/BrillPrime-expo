
import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface StarIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
  style?: ViewStyle;
}

const StarIcon: React.FC<StarIconProps> = ({ 
  size = 39, 
  color,
  filled = false,
  style 
}) => {
  const fillColor = color || (filled ? '#4682B4' : '#D9D9D9');
  
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg 
        width={size} 
        height={size} 
        viewBox="0 0 39 36" 
        fill="none"
      >
        <Path 
          d="M19.5 0L23.878 13.4742H38.0456L26.5838 21.8017L30.9618 35.2758L19.5 26.9483L8.03819 35.2758L12.4162 21.8017L0.954397 13.4742H15.122L19.5 0Z" 
          fill={fillColor}
        />
      </Svg>
    </View>
  );
};

export default StarIcon;
