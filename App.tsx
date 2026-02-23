import React, { useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./global.css";

// Font loading
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";

// Screens
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AddSubscriptionScreen from "./screens/AddSubscriptionScreen";
import DetailsScreen from "./screens/DetailsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";
import * as Notifications from 'expo-notifications';
import { supabase } from "./lib/supabase";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// Define a professional dark theme to avoid white flashes during transitions
const SubScriptTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A192F',
    card: '#0D1F3D',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-navy items-center justify-center">
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: true
          }}
          className="w-16 h-16 bg-teal/20 rounded-3xl items-center justify-center border border-teal/40"
        >
          <View className="w-8 h-8 bg-teal rounded-full animate-pulse" />
        </MotiView>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A192F' },
        animation: 'slide_from_right' // Smooth modern transitions
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen
            name="AddSubscription"
            component={AddSubscriptionScreen}
            options={{ animation: 'slide_from_bottom' }} // Modal feel
          />
          <Stack.Screen name="Details" component={DetailsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    console.log('App: useEffect triggered. fontsLoaded:', fontsLoaded);
    if (fontsLoaded) {
      console.log('App: Hiding Splash Screen...');
      SplashScreen.hideAsync().catch(err => console.log('App: Error hiding splash screen:', err));
    }

    // Safety fallback: Hide splash screen after 5s anyway
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => { });
    }, 5000);

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { subId } = response.notification.request.content.data;

      if (subId) {
        // Navigate to details
        const navigateToDetails = async () => {
          // We need to fetch the sub because DetailsScreen expects the full object
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('id', subId)
            .single();

          if (data && !error && navigationRef.isReady()) {
            // Use the global ref to navigate
            (navigationRef as any).navigate('Details', { subscription: data });
          }
        };
        navigateToDetails();
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#0A192F" />
        <NavigationContainer ref={navigationRef} theme={SubScriptTheme}>
          <RootNavigator />
        </NavigationContainer>
        <Toast />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
