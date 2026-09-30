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

export default function AddTransactionScreen() {
  const [transactionName, setTransactionName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("Other");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddTransaction = async () => {
    setMessage("");

    if (!transactionName.trim() || !amount.trim()) {
      setMessage("Please enter a transaction name and amount.");
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setMessage("Please sign in before adding a transaction.");
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      name: transactionName.trim(),
      amount: numericAmount,
      type,
      category: type === "income" ? "Income" : category,
    });

    setLoading(false);

    if (error) {
      console.error("Transaction insert error:", error);
      setMessage(error.message);
      return;
    }

    router.replace("/transactions");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace("/transactions")}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Add Transaction</Text>

      <Text style={styles.subtitle}>
        Add an income or expense to your Monevo account.
      </Text>

      <Text style={styles.label}>Transaction type</Text>

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
              styles.typeButtonText,
              type === "expense" && styles.activeTypeButtonText,
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
              styles.typeButtonText,
              type === "income" && styles.activeTypeButtonText,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {type === "expense" && (
        <>
          <Text style={styles.label}>Category</Text>

          <View style={styles.categoryRow}>
            {["Food", "Transportation", "Bills", "Shopping", "Other"].map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.categoryButton,
                    category === item && styles.activeCategoryButton,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.activeCategoryText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </>
      )}

      <Text style={styles.label}>Transaction name</Text>

      <TextInput
        style={styles.input}
        placeholder="Example: Groceries"
        placeholderTextColor="#6B7280"
        value={transactionName}
        onChangeText={setTransactionName}
      />

      <Text style={styles.label}>Amount</Text>

      <TextInput
        style={styles.input}
        placeholder="$0.00"
        placeholderTextColor="#6B7280"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleAddTransaction}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Add Transaction</Text>
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

  backButton: {
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
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginBottom: 8,
    marginTop: 14,
  },

  typeRow: {
    flexDirection: "row",
    gap: 12,
  },

  typeButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  activeTypeButton: {
    backgroundColor: "#102A43",
    borderColor: "#102A43",
  },

  typeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },

  activeTypeButtonText: {
    color: "#FFFFFF",
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  activeCategoryButton: {
    backgroundColor: "#E8F7F2",
    borderColor: "#20B486",
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },

  activeCategoryText: {
    color: "#20B486",
    fontWeight: "700",
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

  message: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 16,
  },

  button: {
    height: 54,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
