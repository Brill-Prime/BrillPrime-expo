
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ConsumerHomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Consumer Home Tab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
