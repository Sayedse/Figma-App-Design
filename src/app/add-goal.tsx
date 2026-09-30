import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

export default function AddGoalScreen() {
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddGoal = async () => {
    setMessage("");

    if (!goalName.trim() || !targetAmount.trim()) {
      setMessage("Please enter a goal name and target amount.");
      return;
    }

    const numericTarget = Number(targetAmount);
    const numericSaved = savedAmount.trim() ? Number(savedAmount) : 0;

    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      setMessage("Please enter a valid target amount.");
      return;
    }

    if (!Number.isFinite(numericSaved) || numericSaved < 0) {
      setMessage("Please enter a valid saved amount.");
      return;
    }

    if (numericSaved > numericTarget) {
      setMessage("Saved amount cannot be greater than the target amount.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setMessage("Please sign in before creating a goal.");
      return;
    }

    const { error } = await supabase.from("savings_goals").insert({
      user_id: user.id,
      name: goalName.trim(),
      target_amount: numericTarget,
      saved_amount: numericSaved,
    });

    setLoading(false);

    if (error) {
      console.error("Goal insert error:", error);
      setMessage(error.message);
      return;
    }

    router.replace("/goals");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace("/goals")}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Add New Goal</Text>

      <Text style={styles.subtitle}>
        Create a savings goal and start tracking your progress.
      </Text>

      <Text style={styles.label}>Goal name</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: Emergency Fund"
        placeholderTextColor="#9CA3AF"
        value={goalName}
        onChangeText={setGoalName}
      />

      <Text style={styles.label}>Target amount</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: 5000"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
        value={targetAmount}
        onChangeText={setTargetAmount}
      />

      <Text style={styles.label}>Already saved</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: 500"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
        value={savedAmount}
        onChangeText={setSavedAmount}
      />

      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity
        style={[styles.createButton, loading && styles.disabledButton]}
        onPress={handleAddGoal}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>Create Goal</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  back: {
    fontSize: 15,
    fontWeight: "600",
    color: "#102A43",
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 4,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 24,
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#17202A",
  },

  message: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 16,
  },

  createButton: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  disabledButton: {
    opacity: 0.6,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
