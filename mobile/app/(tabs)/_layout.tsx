import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/constants/theme";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: "🏠",
    Live: "🔴",
    Sermons: "🎧",
    Events: "📅",
    Give: "💝",
    More: "☰",
  };
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || "•"}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 56,
        },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} /> }} />
      <Tabs.Screen name="live" options={{ title: "Live", tabBarIcon: ({ focused }) => <TabIcon label="Live" focused={focused} /> }} />
      <Tabs.Screen name="sermons" options={{ title: "Sermons", tabBarIcon: ({ focused }) => <TabIcon label="Sermons" focused={focused} /> }} />
      <Tabs.Screen name="events" options={{ title: "Events", tabBarIcon: ({ focused }) => <TabIcon label="Events" focused={focused} /> }} />
      <Tabs.Screen name="give" options={{ title: "Give", tabBarIcon: ({ focused }) => <TabIcon label="Give" focused={focused} /> }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: ({ focused }) => <TabIcon label="More" focused={focused} /> }} />
    </Tabs>
  );
}
