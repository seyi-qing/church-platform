import { useQuery } from "@tanstack/react-query";
import { View, Text, StyleSheet, ActivityIndicator, Linking, Pressable } from "react-native";
import { apiFetch } from "@/lib/api";

type Livestream = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  playback_url: string | null;
  youtube_url: string | null;
};

export default function LiveScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["live"],
    queryFn: () => apiFetch<Livestream | null>("/livestream/sessions/live"),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nothing live right now</Text>
        <Text style={styles.emptySub}>Check back on Sunday</Text>
      </View>
    );
  }

  const url = data.youtube_url || data.playback_url;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data.title}</Text>
      {data.description && <Text style={styles.desc}>{data.description}</Text>}
      {url ? (
        <Pressable style={styles.button} onPress={() => Linking.openURL(url)}>
          <Text style={styles.buttonText}>Open Stream</Text>
        </Pressable>
      ) : (
        <Text style={styles.emptySub}>Stream link not available yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  desc: { fontSize: 16, color: "#475569" },
  button: { marginTop: 16, backgroundColor: "#1d4ed8", padding: 16, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#334155" },
  emptySub: { marginTop: 8, color: "#94a3b8" },
});
