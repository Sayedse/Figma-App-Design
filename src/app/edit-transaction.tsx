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

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    if (!id) {
      setMessage("Transaction ID is missing.");
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
      setMessage("Please sign in to edit this transaction.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("id, name, amount, type, category")
      .eq("id", Number(id))
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.error("Transaction load error:", error);
      setMessage("Could not load this transaction.");
      setLoading(false);
      return;
    }

    setName(data.name ?? "");
    setAmount(String(data.amount ?? ""));
    setCategory(data.category ?? "");
    setType(data.type === "income" ? "income" : "expense");

    setLoading(false);
  };

  const saveTransaction = async () => {
    const cleanName = name.trim();
    const cleanCategory = category.trim();
    const numericAmount = Number(amount.replace(/[$,\s]/g, ""));

    if (!cleanName) {
      setMessage("Enter a transaction name.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Enter a valid amount greater than 0.");
      return;
    }

    if (!cleanCategory) {
      setMessage("Enter a category.");
      return;
    }

    if (!id) {
      setMessage("Transaction ID is missing.");
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
      .from("transactions")
      .update({
        name: cleanName,
        amount: numericAmount,
        category: cleanCategory,
        type,
      })
      .eq("id", Number(id))
      .eq("user_id", user.id);

    if (error) {
      console.error("Transaction update error:", error);
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.replace("/transactions");
  };

  const deleteTransaction = async () => {
    if (!id) {
      setMessage("Transaction ID is missing.");
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
      .from("transactions")
      .delete()
      .eq("id", Number(id))
      .eq("user_id", user.id);

    if (error) {
      console.error("Transaction delete error:", error);
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    setDeleting(false);
    router.replace("/transactions");
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#20B486" />
        <Text style={styles.loadingText}>Loading transaction...</Text>
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

      <Text style={styles.title}>Edit Transaction</Text>

      <Text style={styles.subtitle}>Update or remove this transaction.</Text>

      <Text style={styles.label}>Transaction name</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Groceries"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Amount</Text>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="$0.00"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Category</Text>

      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Food"
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Type</Text>

      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === "expense" && styles.activeTypeButton,
          ]}
          onPress={() => setType("expense")}
        >
          <Text
            style={[
              styles.typeText,
              type === "expense" && styles.activeTypeText,
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            type === "income" && styles.activeTypeButton,
          ]}
          onPress={() => setType("income")}
        >
          <Text
            style={[
              styles.typeText,
              type === "income" && styles.activeTypeText,
            ]}
          >
            Income
          </Text>
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
        onPress={saveTransaction}
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
        onPress={deleteTransaction}
        disabled={saving || deleting}
      >
        {deleting ? (
          <ActivityIndicator color="#DC2626" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Transaction</Text>
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

  typeRow: {
    flexDirection: "row",
    gap: 10,
  },

  typeButton: {
    flex: 1,
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTypeButton: {
    backgroundColor: "#E8F7F2",
    borderColor: "#20B486",
  },

  typeText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },

  activeTypeText: {
    color: "#20B486",
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
