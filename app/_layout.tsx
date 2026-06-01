import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppProvider } from '../context/AppContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

function NavigationHandler() {
  const { korisnik, ucitavanje } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [spreman, setSpreman] = useState(false);

  useEffect(() => {
    setSpreman(true);
  }, []);

  useEffect(() => {
    if (!spreman || ucitavanje) return;

    const uTabs = segments[0] === '(tabs)';
    const naLoginu = segments[0] === 'login';
    const naCheckinu = (segments[0] as string) === 'checkin';
    const naCheckoutu = (segments[0] as string) === 'checkout';

    // Checkin i checkout su javne stranice — ne diramo ih
    if (naCheckinu || naCheckoutu) return;

    if (!korisnik && !naLoginu) {
      router.replace('/login');
    } else if (korisnik && !uTabs) {
      router.replace('/(tabs)');
    }
  }, [korisnik, ucitavanje, segments, spreman]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <StatusBar style="dark" backgroundColor="#F2EDE4" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="checkin" />
          <Stack.Screen name="checkout" />
        </Stack>
        <NavigationHandler />
      </AppProvider>
    </AuthProvider>
  );
}