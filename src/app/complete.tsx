import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function CompleteScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>✓</Text>
      </View>

      <Text style={styles.ai}>✦ Monevo AI</Text>

      <Text style={styles.title}>You're all set!</Text>

      <Text style={styles.subtitle}>
        Your personalized Monevo plan is ready.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your money plan is ready</Text>

        <Text style={styles.cardText}>
          Monevo will help you track spending, build savings, and make smarter
          money decisions.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/dashboard")}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 32,
    justifyContent: "center",
  },

  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F7F2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  iconText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#20B486",
  },

  ai: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B486",
    textAlign: "center",
    marginTop: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
    marginTop: 12,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    padding: 20,
    marginTop: 32,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
  },

  cardText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginTop: 8,
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
