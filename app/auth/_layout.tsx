import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'Montserrat-SemiBold',
        },
        contentStyle: {
          backgroundColor: colors.background,
          padding: 0,
        },
        animation: 'fade',
      }}
    >
      <Stack.Screen
        name="signin"
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="role-selection"
        options={{
          title: 'Select Role',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="verify-email"
        options={{
          title: 'Verify Email',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Forgot Password',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
