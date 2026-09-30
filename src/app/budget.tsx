import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

type Budget = {
  id: number;
  name: string;
  amount: number;
};

export default function BudgetScreen() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [amount, setAmount] = useState("");

  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const loadBudget = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in to manage your budget.");
      setLoading(false);
      return;
    }

    const [budgetResult, transactionsResult] = await Promise.all([
      supabase
        .from("budgets")
        .select("id, name, amount, category, period, created_at")
        .eq("user_id", user.id)
        .eq("period", "monthly")
        .is("category", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("transactions")
        .select("amount, type, created_at")
        .eq("user_id", user.id),
    ]);

    if (budgetResult.error) {
      console.log("Budget load error:", budgetResult.error.message);
      setMessage(budgetResult.error.message);
      setLoading(false);
      return;
    }

    if (transactionsResult.error) {
      console.log(
        "Budget transaction error:",
        transactionsResult.error.message,
      );

      setMessage(transactionsResult.error.message);
      setLoading(false);
      return;
    }

    if (budgetResult.data) {
      const loadedBudget: Budget = {
        id: budgetResult.data.id,
        name: budgetResult.data.name,
        amount: Number(budgetResult.data.amount),
      };

      setBudget(loadedBudget);
      setAmount(String(loadedBudget.amount));
    } else {
      setBudget(null);
      setAmount("");
    }

    const now = new Date();

    const expenses = (transactionsResult.data ?? [])
      .filter((transaction) => {
        if (transaction.type !== "expense") {
          return false;
        }

        const transactionDate = new Date(transaction.created_at);

        return (
          transactionDate.getFullYear() === now.getFullYear() &&
          transactionDate.getMonth() === now.getMonth()
        );
      })
      .reduce((total, transaction) => total + Number(transaction.amount), 0);

    setMonthlyExpenses(expenses);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBudget();
    }, [loadBudget]),
  );

  const saveBudget = async () => {
    setMessage("");

    const budgetAmount = Number(amount);

    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      setMessage("Enter a monthly budget greater than $0.");
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

    if (budget) {
      const { error } = await supabase
        .from("budgets")
        .update({
          name: "Monthly Spending Budget",
          amount: budgetAmount,
          category: null,
          period: "monthly",
        })
        .eq("id", budget.id)
        .eq("user_id", user.id);

      if (error) {
        console.log("Budget update error:", error.message);
        setMessage(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        name: "Monthly Spending Budget",
        amount: budgetAmount,
        category: null,
        period: "monthly",
      });

      if (error) {
        console.log("Budget insert error:", error.message);
        setMessage(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    await loadBudget();
  };

  const deleteBudget = async () => {
    if (!budget) {
      return;
    }

    setDeleting(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please sign in to continue.");
      setDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", budget.id)
      .eq("user_id", user.id);

    if (error) {
      console.log("Budget delete error:", error.message);
      setMessage(error.message);
      setDeleting(false);
      return;
    }

    setBudget(null);
    setAmount("");
    setDeleting(false);
  };

  const formatMoney = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#20B486" />
      </View>
    );
  }

  const budgetAmount = budget?.amount ?? 0;

  const remaining = budget ? budgetAmount - monthlyExpenses : 0;

  const percentageUsed =
    budget && budgetAmount > 0 ? (monthlyExpenses / budgetAmount) * 100 : 0;

  const progressWidth = Math.min(Math.max(percentageUsed, 0), 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Monthly Budget</Text>

      <Text style={styles.subtitle}>
        Set a spending limit and track your monthly expenses.
      </Text>

      {budget && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>MONTHLY BUDGET</Text>

              <Text style={styles.summaryAmount}>
                ${formatMoney(budgetAmount)}
              </Text>
            </View>

            <Text style={styles.percentText}>
              {percentageUsed.toFixed(0)}% used
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressWidth}%`,
                },
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Spent this month</Text>

              <Text style={styles.statValue}>
                ${formatMoney(monthlyExpenses)}
              </Text>
            </View>

            <View style={styles.rightStat}>
              <Text style={styles.statLabel}>Remaining</Text>

              <Text
                style={[styles.statValue, remaining < 0 && styles.negativeText]}
              >
                ${formatMoney(remaining)}
              </Text>
            </View>
          </View>

          {remaining < 0 && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                You've exceeded this budget by $
                {formatMoney(Math.abs(remaining))}.
              </Text>
            </View>
          )}
        </View>
      )}

      {!budget && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No monthly budget yet</Text>

          <Text style={styles.emptyText}>
            Set a monthly spending budget to see how your expenses compare with
            your limit.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Monthly spending budget</Text>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="$1,500"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={styles.inputHint}>
        This budget tracks expense transactions recorded during the current
        month.
      </Text>

      {!!message && (
        <View style={styles.messageCard}>
          <Text style={styles.message}>{message}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={saveBudget}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {budget ? "Update Budget" : "Create Budget"}
          </Text>
        )}
      </TouchableOpacity>

      {budget && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteBudget}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Budget</Text>
          )}
        </TouchableOpacity>
      )}
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
    paddingTop: 54,
    paddingBottom: 50,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
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

  summaryCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 22,
    marginTop: 24,
  },

  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#20B486",
  },

  summaryAmount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 7,
  },

  percentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#20B486",
  },

  progressBackground: {
    height: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    height: 9,
    backgroundColor: "#20B486",
    borderRadius: 5,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: 16,
    marginTop: 18,
  },

  rightStat: {
    alignItems: "flex-end",
  },

  statLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.65,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 4,
  },

  negativeText: {
    color: "#FCA5A5",
  },

  warningCard: {
    backgroundColor: "rgba(220,38,38,0.15)",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },

  warningText: {
    fontSize: 13,
    color: "#FFFFFF",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    marginTop: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 24,
    marginBottom: 8,
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

  inputHint: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9CA3AF",
    marginTop: 8,
  },

  messageCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  message: {
    fontSize: 14,
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

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  deleteButton: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  deleteButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
