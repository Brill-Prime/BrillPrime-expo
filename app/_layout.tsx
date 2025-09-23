import React from "react";
import { Stack } from "expo-router";
import { AlertProvider } from "../components/AlertProvider";
import OfflineBanner from "../components/OfflineBanner";
import { View, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <AlertProvider>
      <View style={styles.container}>
        <OfflineBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' },
            animation: 'fade',
          }}
        />
      </View>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});