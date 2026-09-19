import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerForPushNotifications } from "@/lib/push";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotifications().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Sign In" }} />
      </Stack>
    </QueryClientProvider>
  );
}
