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
          padding: 16,
        },
        animation: 'fade',
      }}
    >
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Sign In',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          title: 'Forgot Password',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="reset-password" 
        options={{ 
          title: 'Reset Password',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack>
  );
}
