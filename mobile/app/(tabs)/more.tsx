import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { getUser, logout } from "@/lib/api";
import { useEffect, useState } from "react";
import { prefetchForOffline, flushSyncQueue, getSyncQueue } from "@/lib/offline";

export default function MoreScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handlePrefetch() {
    try {
      const n = await prefetchForOffline();
      Alert.alert("Saved offline", `Cached ${n} data sets.`);
    } catch {
      Alert.alert("Failed", "Could not cache content.");
    }
  }

  async function handleSync() {
    const result = await flushSyncQueue();
    const remaining = (await getSyncQueue()).length;
    Alert.alert("Sync", `OK ${result.ok}, failed ${result.failed}, pending ${remaining}`);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>More</Text>
      {user ? (
        <Text style={styles.sub}>Signed in as {user.full_name || user.email}</Text>
      ) : (
        <Pressable style={styles.btn} onPress={() => router.push("/login")}>
          <Text style={styles.btnText}>Sign In</Text>
        </Pressable>
      )}
      <Pressable style={styles.btnSecondary} onPress={handlePrefetch}>
        <Text style={styles.btnSecondaryText}>Save content offline</Text>
      </Pressable>
      <Pressable style={styles.btnSecondary} onPress={handleSync}>
        <Text style={styles.btnSecondaryText}>Sync pending actions</Text>
      </Pressable>
      {user && (
        <Pressable
          style={styles.btnDanger}
          onPress={async () => {
            await logout();
            setUser(null);
          }}
        >
          <Text style={styles.btnText}>Sign Out</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  heading: { fontSize: 24, fontWeight: "700" },
  sub: { color: "#64748b", marginBottom: 8 },
  btn: { backgroundColor: "#1d4ed8", padding: 14, borderRadius: 10, alignItems: "center" },
  btnSecondary: { borderWidth: 1, borderColor: "#cbd5e1", padding: 14, borderRadius: 10, alignItems: "center" },
  btnDanger: { backgroundColor: "#be123c", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  btnText: { color: "#fff", fontWeight: "600" },
  btnSecondaryText: { color: "#334155", fontWeight: "600" },
});
