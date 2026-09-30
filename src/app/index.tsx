import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from 'expo-router';
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>✦ MONEVO</Text>

      <Text style={styles.title}>
        Your money.{"\n"}
        Your goals.{"\n"}
        Your next move.
      </Text>

      <Text style={styles.subtitle}>
        Your AI-powered financial coach for smarter money decisions.
      </Text>

      <TouchableOpacity
  style={styles.primaryButton}
  onPress={() => router.push('/onboarding')}
>
  <Text style={styles.primaryButtonText}>Get Started</Text>
</TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>
          I already have an account
        </Text>
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

  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#102A43",
    textAlign: "center",
    marginBottom: 32,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
    lineHeight: 40,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 20,
  },

  primaryButton: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#102A43",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#102A43",
  },
});
