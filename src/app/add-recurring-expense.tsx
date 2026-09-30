import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "../lib/supabase";

type Frequency = "monthly" | "weekly" | "yearly";

export default function AddRecurringExpenseScreen() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [dueDay, setDueDay] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (saving) return;

    setMessage("");

    const cleanAmount = amount.replace(/[$,\s]/g, "");
    const numericAmount = Number(cleanAmount);

    if (!name.trim()) {
      setMessage("Please enter a bill name.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    if (!category.trim()) {
      setMessage("Please enter a category.");
      return;
    }

    let numericDueDay: number | null = null;

    if (frequency === "monthly") {
      numericDueDay = Number(dueDay);

      if (
        !dueDay.trim() ||
        !Number.isInteger(numericDueDay) ||
        numericDueDay < 1 ||
        numericDueDay > 31
      ) {
        setMessage("Please enter a due day between 1 and 31.");
        return;
      }
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      setMessage("Please sign in again.");
      return;
    }

    const { error } = await supabase.from("recurring_expenses").insert({
      user_id: user.id,
      name: name.trim(),
      amount: numericAmount,
      category: category.trim(),
      frequency,
      due_day: numericDueDay,
      is_active: true,
    });

    if (error) {
      console.error("Add recurring expense error:", error);

      setMessage("Unable to save this recurring bill.");
      setSaving(false);
      return;
    }

    router.replace("/recurring-expenses" as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        onPress={() => router.replace("/recurring-expenses" as any)}
      >
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Add Recurring Bill</Text>

      <Text style={styles.subtitle}>
        Add a repeating bill or subscription so Monevo can understand your
        monthly commitments.
      </Text>

      <Text style={styles.label}>Bill name</Text>

      <TextInput
        style={styles.input}
        placeholder="Rent"
        placeholderTextColor="#6B7280"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Amount</Text>

      <TextInput
        style={styles.input}
        placeholder="$1,500"
        placeholderTextColor="#6B7280"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Category</Text>

      <TextInput
        style={styles.input}
        placeholder="Housing"
        placeholderTextColor="#6B7280"
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>How often?</Text>

      <View style={styles.frequencyRow}>
        <TouchableOpacity
          style={[
            styles.frequencyButton,
            frequency === "monthly" && styles.frequencyButtonActive,
          ]}
          onPress={() => setFrequency("monthly")}
        >
          <Text
            style={[
              styles.frequencyText,
              frequency === "monthly" && styles.frequencyTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyButton,
            frequency === "weekly" && styles.frequencyButtonActive,
          ]}
          onPress={() => setFrequency("weekly")}
        >
          <Text
            style={[
              styles.frequencyText,
              frequency === "weekly" && styles.frequencyTextActive,
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.frequencyButton,
            frequency === "yearly" && styles.frequencyButtonActive,
          ]}
          onPress={() => setFrequency("yearly")}
        >
          <Text
            style={[
              styles.frequencyText,
              frequency === "yearly" && styles.frequencyTextActive,
            ]}
          >
            Yearly
          </Text>
        </TouchableOpacity>
      </View>

      {frequency === "monthly" && (
        <>
          <Text style={styles.label}>Due day</Text>

          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            value={dueDay}
            onChangeText={setDueDay}
            maxLength={2}
          />

          <Text style={styles.helperText}>
            Enter the day of the month the bill is normally due, from 1 to 31.
          </Text>
        </>
      )}

      {!!message && (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Add Recurring Bill</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        You can edit, deactivate, or delete this recurring bill later.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 50,
  },

  backButton: {
    fontSize: 15,
    fontWeight: "600",
    color: "#102A43",
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginBottom: 8,
    marginTop: 20,
  },

  input: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#17202A",
  },

  frequencyRow: {
    flexDirection: "row",
    gap: 8,
  },

  frequencyButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  frequencyButtonActive: {
    backgroundColor: "#E8F7F2",
    borderColor: "#20B486",
  },

  frequencyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  frequencyTextActive: {
    color: "#20B486",
  },

  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
    marginTop: 7,
  },

  messageCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },

  messageText: {
    color: "#DC2626",
    fontSize: 14,
  },

  saveButton: {
    height: 54,
    backgroundColor: "#20B486",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },

  disclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 16,
  },
});
