import React from "react";
import { Stack } from "expo-router";
import { AlertProvider } from "../components/AlertProvider";
import OfflineBanner from "../components/OfflineBanner";

export default function RootLayout() {
  return (
    <AlertProvider>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerShown: false, // Remove top navigation bar
        }}
      />
    </AlertProvider>
  );
}