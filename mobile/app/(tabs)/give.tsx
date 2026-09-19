import { View, Text, StyleSheet, Pressable, Linking } from "react-native";

const WEB_GIVE_URL = process.env.EXPO_PUBLIC_WEB_URL
  ? `${process.env.EXPO_PUBLIC_WEB_URL}/give`
  : "http://localhost:3000/give";

export default function GiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Give</Text>
      <Text style={styles.body}>
        Support the mission of Grace Church. Open the secure giving page to make a one-time or recurring gift.
      </Text>
      <Pressable style={styles.button} onPress={() => Linking.openURL(WEB_GIVE_URL)}>
        <Text style={styles.buttonText}>Open Giving Page</Text>
      </Pressable>
      <Text style={styles.note}>Gifts are processed securely via Stripe.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  body: { fontSize: 16, color: "#475569", lineHeight: 24 },
  button: { backgroundColor: "#be123c", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  note: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
});
