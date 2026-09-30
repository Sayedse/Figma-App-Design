import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "../lib/supabase";

type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
};

export default function AddContributionScreen() {
  const params = useLocalSearchParams<{
    goalId?: string;
    goalName?: string;
  }>();

  const goalId = Number(params.goalId);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadGoal();
  }, [goalId]);

  const loadGoal = async () => {
    setLoading(true);
    setMessage("");

    if (!Number.isFinite(goalId) || goalId <= 0) {
      setMessage("Invalid savings goal.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in to continue.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("savings_goals")
      .select("id, name, target_amount, saved_amount")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log("Goal load error:", error.message);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage("Savings goal not found.");
      setLoading(false);
      return;
    }

    setGoal({
      id: data.id,
      name: data.name,
      targetAmount: Number(data.target_amount),
      savedAmount: Number(data.saved_amount),
    });

    setLoading(false);
  };

  const addContribution = async () => {
    setMessage("");

    const contributionAmount = Number(amount);

    if (!goal) {
      setMessage("Savings goal not found.");
      return;
    }

    if (!Number.isFinite(contributionAmount) || contributionAmount <= 0) {
      setMessage("Enter a contribution amount greater than $0.");
      return;
    }

    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

    if (remaining <= 0) {
      setMessage("This goal is already fully funded.");
      return;
    }

    if (contributionAmount > remaining) {
      setMessage(
        `The most you can add is $${remaining.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}.`,
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in to continue.");
      setSaving(false);
      return;
    }

    const newSavedAmount = goal.savedAmount + contributionAmount;

    // First record the contribution.
    const { data: contribution, error: contributionError } = await supabase
      .from("goal_contributions")
      .insert({
        user_id: user.id,
        goal_id: goal.id,
        amount: contributionAmount,
        note: note.trim() || null,
      })
      .select("id")
      .single();

    if (contributionError) {
      console.log("Contribution insert error:", contributionError.message);

      setMessage(contributionError.message);
      setSaving(false);
      return;
    }

    // Then update the goal total.
    const { error: goalUpdateError } = await supabase
      .from("savings_goals")
      .update({
        saved_amount: newSavedAmount,
      })
      .eq("id", goal.id)
      .eq("user_id", user.id);

    if (goalUpdateError) {
      console.log("Goal update error:", goalUpdateError.message);

      // Prevent a contribution-history row from remaining
      // when the goal total failed to update.
      await supabase
        .from("goal_contributions")
        .delete()
        .eq("id", contribution.id)
        .eq("user_id", user.id);

      setMessage("The goal could not be updated. Please try again.");

      setSaving(false);
      return;
    }

    router.replace("/goals");
  };

  const formatMoney = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const remaining = goal
    ? Math.max(goal.targetAmount - goal.savedAmount, 0)
    : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Add Money</Text>

        <Text style={styles.subtitle}>
          Add a contribution to your savings goal.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#20B486"
            style={styles.loader}
          />
        ) : goal ? (
          <>
            <View style={styles.goalCard}>
              <Text style={styles.goalLabel}>SAVINGS GOAL</Text>

              <Text style={styles.goalName}>{goal.name}</Text>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statLabel}>Saved</Text>

                  <Text style={styles.statValue}>
                    ${formatMoney(goal.savedAmount)}
                  </Text>
                </View>

                <View style={styles.statRight}>
                  <Text style={styles.statLabel}>Remaining</Text>

                  <Text style={styles.statValue}>
                    ${formatMoney(remaining)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Contribution amount</Text>

            <TextInput
              style={styles.input}
              placeholder="$200"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.label}>Note (optional)</Text>

            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Example: September savings"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
            />

            {!!message && (
              <View style={styles.messageCard}>
                <Text style={styles.message}>{message}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={addContribution}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Add Contribution</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.helperText}>
              This contribution will be saved in your contribution history and
              added to your goal's saved amount.
            </Text>
          </>
        ) : (
          <View style={styles.messageCard}>
            <Text style={styles.message}>
              {message || "Savings goal unavailable."}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingRight: 16,
  },

  backText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#20B486",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 14,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    marginTop: 6,
  },

  loader: {
    marginTop: 50,
  },

  goalCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
  },

  goalLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#20B486",
  },

  goalName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 6,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginTop: 18,
    paddingTop: 14,
  },

  statRight: {
    alignItems: "flex-end",
  },

  statLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.65,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 4,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 22,
    marginBottom: 8,
  },

  input: {
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#17202A",
  },

  noteInput: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  messageCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#DC2626",
  },

  saveButton: {
    height: 54,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.55,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 14,
  },
});
