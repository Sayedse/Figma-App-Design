import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function IncomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>Step 2 of 6</Text>

      <View style={styles.progressBackground}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.title}>What’s your monthly income?</Text>

      <Text style={styles.subtitle}>Enter your typical take-home income.</Text>

      <TextInput
        style={styles.input}
        placeholder="$4,000"
        placeholderTextColor="#6B7280"
        keyboardType="numeric"
      />

      <View style={styles.options}>
        <TouchableOpacity style={styles.selectedOption}>
          <Text style={styles.selectedOptionText}>Monthly</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Biweekly</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Weekly</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/expenses")}
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
    width: "33%",
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
    marginTop: 12,
  },

  input: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    color: "#17202A",
    marginTop: 32,
  },

  options: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  selectedOption: {
    flex: 1,
    height: 44,
    backgroundColor: "#102A43",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedOptionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  option: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
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
