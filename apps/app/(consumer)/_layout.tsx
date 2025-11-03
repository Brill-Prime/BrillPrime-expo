
import { Stack } from 'expo-router';

export default function ConsumerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="merchant" />
      <Stack.Screen name="order-tracking" />
    </Stack>
  );
}
