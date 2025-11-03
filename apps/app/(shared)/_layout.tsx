
import { Stack } from 'expo-router';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="about" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
