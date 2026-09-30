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

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadGoal();
  }, [id]);

  const loadGoal = async () => {
    if (!id) {
      setMessage("Goal ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in to edit this goal.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("savings_goals")
      .select("id, name, target_amount, saved_amount")
      .eq("id", Number(id))
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.error("Goal load error:", error);
      setMessage("Could not load this goal.");
      setLoading(false);
      return;
    }

    setName(data.name ?? "");
    setTargetAmount(String(data.target_amount ?? ""));
    setSavedAmount(String(data.saved_amount ?? ""));

    setLoading(false);
  };

  const saveGoal = async () => {
    const cleanName = name.trim();

    const numericTarget = Number(targetAmount.replace(/[$,\s]/g, ""));

    const numericSaved = Number(savedAmount.replace(/[$,\s]/g, ""));

    if (!cleanName) {
      setMessage("Enter a goal name.");
      return;
    }

    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      setMessage("Enter a valid target amount greater than 0.");
      return;
    }

    if (!Number.isFinite(numericSaved) || numericSaved < 0) {
      setMessage("Enter a valid saved amount.");
      return;
    }

    if (numericSaved > numericTarget) {
      setMessage("Saved amount cannot be greater than the target amount.");
      return;
    }

    if (!id) {
      setMessage("Goal ID is missing.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("savings_goals")
      .update({
        name: cleanName,
        target_amount: numericTarget,
        saved_amount: numericSaved,
      })
      .eq("id", Number(id))
      .eq("user_id", user.id);

    if (error) {
      console.error("Goal update error:", error);
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.replace("/goals");
  };

  const deleteGoal = async () => {
    if (!id) {
      setMessage("Goal ID is missing.");
      return;
    }

    setDeleting(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in again.");
      setDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", Number(id))
      .eq("user_id", user.id);

    if (error) {
      console.error("Goal delete error:", error);
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    setDeleting(false);
    router.replace("/goals");
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#20B486" />
        <Text style={styles.loadingText}>Loading goal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Edit Goal</Text>

      <Text style={styles.subtitle}>
        Update your savings goal and progress.
      </Text>

      <Text style={styles.label}>Goal name</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Emergency Fund"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Target amount</Text>

      <TextInput
        style={styles.input}
        value={targetAmount}
        onChangeText={setTargetAmount}
        placeholder="$10,000"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Currently saved</Text>

      <TextInput
        style={styles.input}
        value={savedAmount}
        onChangeText={setSavedAmount}
        placeholder="$0"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

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
        onPress={saveGoal}
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
        onPress={deleteGoal}
        disabled={saving || deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#DC2626" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Goal</Text>
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
    paddingTop: 50,
    paddingBottom: 60,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 12,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  backText: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "600",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginBottom: 8,
    marginTop: 16,
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

  messageCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },

  messageText: {
    color: "#DC2626",
    fontSize: 14,
  },

  saveButton: {
    height: 54,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
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
    fontSize: 16,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.5,
  },
});
