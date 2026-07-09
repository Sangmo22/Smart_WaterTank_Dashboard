import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "@/services/notification.service";
import { AuthProvider, useAuth } from "@/state/auth-context";
import { LoginScreen } from "@/components/login-screen";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const prevUserRef = useRef<typeof user>(undefined);

  // Navigate to the dashboard whenever the user logs in
  useEffect(() => {
    if (prevUserRef.current === undefined) {
      // First render — just record the initial value, don't navigate yet
      prevUserRef.current = user;
      return;
    }
    if (!prevUserRef.current && user) {
      // User just signed in — push to dashboard
      router.replace("/");
    }
    prevUserRef.current = user;
  }, [user]);

  useEffect(() => {
    async function setup() {
      if (Platform.OS === 'web') return;

      try {
        // 1) Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permission not granted');
          return;
        }

        // 2) Get push token
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: '06e6b11b-0ebb-4b0e-8229-d58178720195',
        });
        console.log('Push token:', token.data);
        setExpoPushToken(token.data);
        await AsyncStorage.setItem('expoPushToken', token.data);

        // 3) Set up notification handler (optional but useful)
        Notifications.setNotificationHandler({
          handleNotification: async (notification) => {
            console.log('Notification received:', notification);
            return {
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            };
          },
        });
      } catch (error) {
        console.error('Failed to setup notifications:', error);
      }
    }

    setup();
  }, []);

  if (isLoading) {
    const isDark = colorScheme === "dark";
    return (
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#000000" : "#ffffff" }}>
          <ActivityIndicator size="large" color="#1890ff" />
          <ThemedText style={{ marginTop: Spacing.three }} type="smallBold">
            Checking session...
          </ThemedText>
        </View>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <LoginScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="pump-settings" />
        <Stack.Screen name="settings" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
