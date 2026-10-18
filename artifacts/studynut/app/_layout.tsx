import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { StudyProvider } from '@/context/StudyProvider';
import { SubscriptionProvider } from '@/lib/revenuecat';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;
setBaseUrl(
  Platform.OS === 'web' ? null : apiDomain ? `https://${apiDomain}` : null,
);

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="library" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
      <Stack.Screen name="ghost" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppProviders({
  storageScope = 'guest',
  remoteEnabled = false,
}: {
  storageScope?: string;
  remoteEnabled?: boolean;
}) {
  const appUserId = storageScope.startsWith('user:')
    ? storageScope.slice('user:'.length)
    : undefined;
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StudyProvider
          key={storageScope}
          storageScope={storageScope}
          remoteEnabled={remoteEnabled}
        >
          <SubscriptionProvider appUserId={appUserId}>
            <ErrorBoundary>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </ErrorBoundary>
          </SubscriptionProvider>
        </StudyProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function ClerkApp() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const [tokenReady, setTokenReady] = React.useState(false);
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
    setTokenReady(true);
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);
  const storageScope =
    isLoaded && isSignedIn && userId ? `user:${userId}` : 'guest';
  return (
    <AppProviders
      storageScope={storageScope}
      remoteEnabled={tokenReady && isLoaded && Boolean(isSignedIn && userId)}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn('Clerk publishable key is not available; running guest mode.');
    return <AppProviders />;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined}
    >
      <ClerkApp />
    </ClerkProvider>
  );
}
