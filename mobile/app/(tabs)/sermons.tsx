import { useQuery } from "@tanstack/react-query";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { apiFetch } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  speaker: string | null;
  description: string | null;
};

export default function SermonsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["sermons"],
    queryFn: () => apiFetch<MediaItem[]>("/media/items?media_type=sermon&limit=30"),
  });

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
      ListEmptyComponent={<Text style={styles.empty}>No sermons yet</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          {item.speaker && <Text style={styles.meta}>{item.speaker}</Text>}
          {item.description && <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "600", color: "#0f172a" },
  meta: { marginTop: 4, fontSize: 14, color: "#64748b" },
  desc: { marginTop: 8, fontSize: 14, color: "#475569" },
  empty: { textAlign: "center", color: "#94a3b8", marginTop: 40 },
});
