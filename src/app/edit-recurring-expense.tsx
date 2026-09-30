import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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

export default function EditRecurringExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [dueDay, setDueDay] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadExpense = async () => {
      if (!id) {
        setMessage("Recurring bill not found.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/sign-in");
        return;
      }

      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("id, name, amount, category, frequency, due_day, is_active")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        console.log("Recurring bill load error:", error?.message);

        setMessage("Unable to load this recurring bill.");
        setLoading(false);
        return;
      }

      setName(data.name ?? "");
      setAmount(String(data.amount ?? ""));
      setCategory(data.category ?? "");
      setFrequency((data.frequency as Frequency) ?? "monthly");
      setDueDay(
        data.due_day !== null && data.due_day !== undefined
          ? String(data.due_day)
          : "",
      );
      setIsActive(data.is_active ?? true);

      setLoading(false);
    };

    loadExpense();
  }, [id]);

  const validateForm = () => {
    const cleanAmount = amount.replace(/[$,\s]/g, "");
    const numericAmount = Number(cleanAmount);

    if (!name.trim()) {
      setMessage("Please enter a bill name.");
      return null;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Please enter a valid amount.");
      return null;
    }

    if (!category.trim()) {
      setMessage("Please enter a category.");
      return null;
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
        return null;
      }
    }

    return {
      numericAmount,
      numericDueDay,
    };
  };

  const handleSave = async () => {
    if (saving || deleting) return;

    setMessage("");

    const validated = validateForm();

    if (!validated) return;

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

    const { error } = await supabase
      .from("recurring_expenses")
      .update({
        name: name.trim(),
        amount: validated.numericAmount,
        category: category.trim(),
        frequency,
        due_day: validated.numericDueDay,
        is_active: isActive,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.log("Recurring bill update error:", error.message);

      setMessage("Unable to update this recurring bill.");
      setSaving(false);
      return;
    }

    router.replace("/recurring-expenses" as any);
  };

  const handleDelete = async () => {
    if (saving || deleting) return;

    setMessage("");
    setDeleting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setDeleting(false);
      setMessage("Please sign in again.");
      return;
    }

    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.log("Recurring bill delete error:", error.message);

      setMessage("Unable to delete this recurring bill.");
      setDeleting(false);
      return;
    }

    router.replace("/recurring-expenses" as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#20B486" />

        <Text style={styles.loadingText}>Loading recurring bill...</Text>
      </View>
    );
  }

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

      <Text style={styles.title}>Edit Recurring Bill</Text>

      <Text style={styles.subtitle}>
        Update, pause, or remove this recurring financial commitment.
      </Text>

      <Text style={styles.label}>Bill name</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Rent"
        placeholderTextColor="#6B7280"
      />

      <Text style={styles.label}>Amount</Text>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="$1,500"
        placeholderTextColor="#6B7280"
      />

      <Text style={styles.label}>Category</Text>

      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Housing"
        placeholderTextColor="#6B7280"
      />

      <Text style={styles.label}>How often?</Text>

      <View style={styles.frequencyRow}>
        {(["monthly", "weekly", "yearly"] as Frequency[]).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.frequencyButton,
              frequency === option && styles.frequencyButtonActive,
            ]}
            onPress={() => setFrequency(option)}
          >
            <Text
              style={[
                styles.frequencyText,
                frequency === option && styles.frequencyTextActive,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {frequency === "monthly" && (
        <>
          <Text style={styles.label}>Due day</Text>

          <TextInput
            style={styles.input}
            value={dueDay}
            onChangeText={setDueDay}
            keyboardType="number-pad"
            placeholder="15"
            placeholderTextColor="#6B7280"
            maxLength={2}
          />

          <Text style={styles.helperText}>Enter a day from 1 to 31.</Text>
        </>
      )}

      <View style={styles.statusCard}>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>Active recurring bill</Text>

          <Text style={styles.statusDescription}>
            Inactive bills are saved but excluded from Monevo's monthly bill
            calculations.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.toggle, isActive && styles.toggleActive]}
          onPress={() => setIsActive((current) => !current)}
        >
          <View
            style={[styles.toggleCircle, isActive && styles.toggleCircleActive]}
          />
        </TouchableOpacity>
      </View>

      {!!message && (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          (saving || deleting) && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={saving || deleting}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          (saving || deleting) && styles.disabledButton,
        ]}
        onPress={handleDelete}
        disabled={saving || deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#DC2626" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Recurring Bill</Text>
        )}
      </TouchableOpacity>
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

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
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
    marginTop: 7,
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },

  statusInfo: {
    flex: 1,
    paddingRight: 15,
  },

  statusTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#17202A",
  },

  statusDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: 4,
  },

  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1D5DB",
    padding: 3,
    justifyContent: "center",
  },

  toggleActive: {
    backgroundColor: "#20B486",
  },

  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },

  toggleCircleActive: {
    alignSelf: "flex-end",
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

  deleteButton: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  deleteButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
