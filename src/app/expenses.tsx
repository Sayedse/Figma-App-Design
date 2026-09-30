import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>Step 3 of 6</Text>

      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.title}>What are your monthly expenses?</Text>

      <Text style={styles.subtitle}>Enter an estimate for each category.</Text>

      <Text style={styles.label}>Housing</Text>
      <TextInput style={styles.input} placeholder="$1,200" />

      <Text style={styles.label}>Utilities</Text>
      <TextInput style={styles.input} placeholder="$200" />

      <Text style={styles.label}>Transportation</Text>
      <TextInput style={styles.input} placeholder="$300" />

      <Text style={styles.label}>Food</Text>
      <TextInput style={styles.input} placeholder="$500" />

      <Text style={styles.label}>Other</Text>
      <TextInput style={styles.input} placeholder="$200" />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/savings")}
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
    width: "50%",
    height: 6,
    backgroundColor: "#20B486",
    borderRadius: 3,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 32,
    lineHeight: 36,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    height: 48,
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
    marginTop: 24,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
