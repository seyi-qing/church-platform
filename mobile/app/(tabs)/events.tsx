import { useQuery } from "@tanstack/react-query";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { apiFetch } from "@/lib/api";
import { queueSync } from "@/lib/offline";

type Event = {
  id: number;
  title: string;
  location: string | null;
  start_at: string;
  description: string | null;
};

export default function EventsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<Event[]>("/events?limit=30"),
  });

  async function register(eventId: number) {
    try {
      await apiFetch("/events/register", {
        method: "POST",
        body: JSON.stringify({ event_id: eventId }),
      });
      Alert.alert("Registered", "You're signed up for this event.");
    } catch (e: any) {
      await queueSync("POST", "/events/register", { event_id: eventId });
      Alert.alert("Saved offline", "Registration will sync when you're back online.");
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={data || []}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={<Text style={styles.empty}>No upcoming events</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {new Date(item.start_at).toLocaleString()}
            {item.location ? ` · ${item.location}` : ""}
          </Text>
          {item.description && <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>}
          <Pressable style={styles.btn} onPress={() => register(item.id)}>
            <Text style={styles.btnText}>Register</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "600" },
  meta: { marginTop: 4, fontSize: 13, color: "#64748b" },
  desc: { marginTop: 8, fontSize: 14, color: "#475569" },
  btn: { marginTop: 12, backgroundColor: "#1d4ed8", padding: 10, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
});
