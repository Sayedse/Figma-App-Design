import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function GoalsSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>Step 5 of 6</Text>

      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.title}>What are you saving for?</Text>

      <Text style={styles.subtitle}>Create your first financial goal.</Text>

      <Text style={styles.label}>Goal name</Text>

      <TextInput
        style={styles.input}
        placeholder="Emergency Fund"
        placeholderTextColor="#6B7280"
      />

      <Text style={styles.label}>Target amount</Text>

      <TextInput
        style={styles.input}
        placeholder="$10,000"
        placeholderTextColor="#6B7280"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/priority")}
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

  progressText: {
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
    width: "83%",
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

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 28,
    marginBottom: 8,
  },

  input: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#17202A",
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
