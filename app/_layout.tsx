import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { MockStripeModal } from '@/components/MockStripeModal';
import { UserIconButton } from '@/components/UserIconButton';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider as AppThemeProvider } from '@/context/ThemeContext';
import { UserProvider } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import '@/services/i18n';
import { stripeService } from '@/services/stripeService';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useState } from 'react';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Sv1fmBjCaXwc4cHDQ1uH6JIO4xxDT3A6TtUB5sDZiIdqaTdfh8pOEqgkJf3f9bH75uqz9HZ79GqBWVcKwWTZjlS00Eppdb72D';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Wrapper component to avoid importing Stripe in Expo Go and causing crashes
const SafeStripeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mockVisible, setMockVisible] = useState(false);
  const [mockAmount, setMockAmount] = useState(500);

  useEffect(() => {
    if (isExpoGo) {
      stripeService.registerMockModal((visible, amount) => {
        setMockVisible(visible);
        setMockAmount(amount);
      });
    }
  }, []);

  const handleMockSuccess = () => {
    setMockVisible(false);
    stripeService.handleMockPayment(true);
  };

  const handleMockCancel = () => {
    setMockVisible(false);
    stripeService.handleMockPayment(false);
  };

  if (isExpoGo) {
    return (
      <>
        {children}
        <MockStripeModal 
          visible={mockVisible}
          amount={mockAmount}
          currency="eur"
          onSuccess={handleMockSuccess}
          onCancel={handleMockCancel}
        />
      </>
    );
  }
  try {
    const { StripeProvider } = require('@stripe/stripe-react-native');
    return <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>;
  } catch (e) {
    console.warn('Failed to load StripeProvider:', e);
    return <>{children}</>;
  }
};

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <SafeStripeProvider>
        <AuthProvider>
          <UserProvider>
            <InnerLayout />
          </UserProvider>
        </AuthProvider>
      </SafeStripeProvider>
    </AppThemeProvider>
  );
}

function InnerLayout() {
  const { profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const protectedScreens = ['basket-demo', 'settings'];
    const accessingProtected = segments[0] === '(tabs)' && segments[1] && protectedScreens.includes(segments[1]);

    if (!profile && accessingProtected) {
      // Redirect to the login page if the user is not authenticated and tries to access protected content
      router.replace('/(auth)/login');
    } else if (profile && inAuthGroup) {
      // Redirect to the tabs if the user is authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [profile, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerRight: () => <UserIconButton color={Colors[colorScheme ?? 'light'].text} />,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="live-broadcast" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
