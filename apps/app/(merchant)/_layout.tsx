
import { Stack } from 'expo-router';

export default function MerchantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="commodities" />
      <Stack.Screen name="order-management" />
      <Stack.Screen name="store-settings" />
    </Stack>
  );
}
