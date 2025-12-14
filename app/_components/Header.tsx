import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

interface HeaderProps {
  onMenuPress: () => void;
  onBackPress: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress, onBackPress }) => {
  const handleBackPress = () => {
    onBackPress();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        {/* Add back icon here - you can use react-native-vector-icons or similar */}
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        {/* Add menu icon here */}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  menuButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
});

export default Header;
