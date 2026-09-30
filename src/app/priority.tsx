import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from 'expo-router';

export default function PriorityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>Step 6 of 6</Text>

      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.title}>What matters most to you?</Text>

      <Text style={styles.subtitle}>Choose your main financial priority.</Text>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionTitle}>💰 Save more money</Text>
        <Text style={styles.optionText}>
          Build savings and reach your goals faster.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionTitle}>📉 Reduce spending</Text>
        <Text style={styles.optionText}>
          Understand and control where your money goes.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionTitle}>💳 Pay off debt</Text>
        <Text style={styles.optionText}>
          Create a plan to reduce your debt.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.option}>
        <Text style={styles.optionTitle}>📈 Improve overall finances</Text>
        <Text style={styles.optionText}>
          Build better financial habits with Monevo.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/complete")}
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
    width: "100%",
    height: 6,
    backgroundColor: "#20B486",
    borderRadius: 3,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 40,
    lineHeight: 40,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
    marginBottom: 20,
  },

  option: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },

  optionText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
    lineHeight: 18,
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
