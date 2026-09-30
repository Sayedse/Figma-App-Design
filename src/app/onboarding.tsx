import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.progress}>Step 1 of 6</Text>

      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.title}>Let’s build your money plan</Text>

      <Text style={styles.subtitle}>
        Answer a few quick questions so Monevo can personalize your financial
        plan.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/income")}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 32,
    paddingTop: 60,
  },

  progress: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
  },

  progressBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
  },

  progressFill: {
    width: "17%",
    height: 6,
    backgroundColor: "#20B486",
    borderRadius: 3,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 48,
    lineHeight: 40,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginTop: 16,
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 48,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
