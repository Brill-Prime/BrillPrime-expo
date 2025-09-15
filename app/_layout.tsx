
import React from "react";
import { Stack } from "expo-router";
import { AlertProvider } from "../components/AlertProvider";

export default function RootLayout() {
  return (
    <AlertProvider>
      <Stack
        screenOptions={{
          headerShown: false, // Remove top navigation bar
        }}
      />
    </AlertProvider>
  );
}
