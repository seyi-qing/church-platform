import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { Link } from "expo-router";
import { getUser, getToken } from "@/lib/api";
import { prefetchForOffline, flushSyncQueue, getSyncQueue } from "@/lib/offline";

const links = [
  { href: "/live", label: "Watch Live", color: "#1d4ed8" },
  { href: "/sermons", label: "Sermons", color: "#0f766e" },
  { href: "/events", label: "Events", color: "#b45309" },
  { href: "/give", label: "Give", color: "#be123c" },
];

export default function HomeScreen() {
  const [user, setUserState] = useState<any>(null);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) setUserState(await getUser());
      const queue = await getSyncQueue();
      setPendingSync(queue.length);
      if (queue.length) {
        await flushSyncQueue().catch(() => null);
        setPendingSync((await getSyncQueue()).length);
      }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Welcome</Text>
      <Text style={styles.sub}>
        {user ? `Signed in as ${user.full_name || user.email}` : "Stay connected beyond Sunday."}
      </Text>
      {pendingSync > 0 && (
        <Text style={styles.pending}>{pendingSync} actions pending sync</Text>
      )}
      <View style={styles.grid}>
        {links.map((l) => (
          <Link key={l.href} href={l.href as any} asChild>
            <Pressable style={[styles.card, { backgroundColor: l.color }]}>
              <Text style={styles.cardText}>{l.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
      <Pressable
        style={styles.offlineBtn}
        onPress={async () => {
          try {
            const n = await prefetchForOffline();
            Alert.alert("Offline ready", `Cached ${n} data sets`);
          } catch {
            Alert.alert("Failed", "Could not cache content");
          }
        }}
      >
        <Text style={styles.offlineText}>Save content for offline</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  heading: { fontSize: 28, fontWeight: "700", color: "#0f172a" },
  sub: { fontSize: 16, color: "#64748b", marginBottom: 8 },
  pending: { color: "#b45309", fontSize: 13 },
  grid: { gap: 12, marginTop: 8 },
  card: { padding: 20, borderRadius: 12 },
  cardText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  offlineBtn: { marginTop: 16, borderWidth: 1, borderColor: "#cbd5e1", padding: 14, borderRadius: 10, alignItems: "center" },
  offlineText: { color: "#334155", fontWeight: "600" },
});
