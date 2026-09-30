import { Stack, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { initializeRevenueCat } from "../lib/revenuecat";
import { supabase } from "../lib/supabase";

const publicRoutes = [
  "",
  "index",
  "sign-in",
  "sign-up",
  "onboarding",
  "income",
  "expenses",
  "savings",
  "goals-setup",
  "priority",
  "complete",
];

export default function RootLayout() {
  const segments = useSegments();

  const [checkingSession, setCheckingSession] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setIsSignedIn(!!session);

      if (session?.user?.id) {
        try {
          await initializeRevenueCat(session.user.id);
        } catch (error) {
          console.log("RevenueCat initialization error:", error);
        }
      }

      if (mounted) {
        setCheckingSession(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setIsSignedIn(!!session);

      if (session?.user?.id) {
        initializeRevenueCat(session.user.id).catch((error) => {
          console.log("RevenueCat auth error:", error);
        });
      }

      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (checkingSession) return;

    const currentRoute = segments.length > 0 ? String(segments[0]) : "";

    const isPublicRoute = publicRoutes.includes(currentRoute);

    if (!isSignedIn && !isPublicRoute) {
      router.replace("/sign-in");
    }
  }, [checkingSession, isSignedIn, segments]);

  if (checkingSession) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#20B486" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },
});
