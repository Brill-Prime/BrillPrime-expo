import React from 'react';
import { View, ViewStyle } from 'react-native';

interface SimpleArrowIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const SimpleArrowIcon: React.FC<SimpleArrowIconProps> = ({ 
  size = 20, 
  color = 'white',
  style 
}) => {
  return (
    <View 
      style={[
        {
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style
      ]}
    >
      <View 
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
};

export default SimpleArrowIcon;
export { SimpleArrowIcon };