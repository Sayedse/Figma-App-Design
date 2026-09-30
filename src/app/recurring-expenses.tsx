import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { supabase } from "../lib/supabase";

type RecurringExpense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  dueDay: number | null;
  isActive: boolean;
};

export default function RecurringExpensesScreen() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadRecurringExpenses = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      router.replace("/sign-in");
      return;
    }

    const { data, error } = await supabase
      .from("recurring_expenses")
      .select(
        "id, name, amount, category, frequency, due_day, is_active, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Recurring expenses error:", error);
      setMessage("Unable to load recurring bills.");
      setExpenses([]);
      setLoading(false);
      return;
    }

    const formattedExpenses: RecurringExpense[] = (data ?? []).map(
      (expense) => ({
        id: expense.id,
        name: expense.name,
        amount: Number(expense.amount),
        category: expense.category || "Other",
        frequency: expense.frequency || "monthly",
        dueDay: expense.due_day,
        isActive: expense.is_active ?? true,
      }),
    );

    setExpenses(formattedExpenses);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecurringExpenses();
    }, [loadRecurringExpenses]),
  );

  const activeExpenses = expenses.filter((expense) => expense.isActive);

  const monthlyEquivalent = activeExpenses.reduce((total, expense) => {
    if (expense.frequency === "weekly") {
      return total + (expense.amount * 52) / 12;
    }

    if (expense.frequency === "yearly") {
      return total + expense.amount / 12;
    }

    return total + expense.amount;
  }, 0);

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatFrequency = (frequency: string) => {
    if (frequency === "weekly") {
      return "Weekly";
    }

    if (frequency === "yearly") {
      return "Yearly";
    }

    return "Monthly";
  };

  const formatDueDate = (expense: RecurringExpense) => {
    if (expense.frequency === "monthly" && expense.dueDay) {
      return `Due on day ${expense.dueDay}`;
    }

    if (expense.frequency === "weekly") {
      return "Recurring weekly";
    }

    if (expense.frequency === "yearly") {
      return "Recurring yearly";
    }

    return "Recurring";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.replace("/dashboard")}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Recurring Bills</Text>

      <Text style={styles.subtitle}>
        Track bills and subscriptions that repeat automatically.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Estimated monthly bills</Text>

        {loading ? (
          <ActivityIndicator color="#FFFFFF" style={styles.loader} />
        ) : (
          <Text style={styles.summaryAmount}>
            ${formatMoney(monthlyEquivalent)}
          </Text>
        )}

        <Text style={styles.summaryText}>
          Based on your active recurring expenses.
        </Text>

        {!loading && (
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryFooterText}>
              {activeExpenses.length} active{" "}
              {activeExpenses.length === 1 ? "bill" : "bills"}
            </Text>
          </View>
        )}
      </View>

      {!!message && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your bills</Text>

        {!loading && <Text style={styles.billCount}>{expenses.length}</Text>}
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#20B486" />

          <Text style={styles.loadingText}>Loading recurring bills...</Text>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>↻</Text>

          <Text style={styles.emptyTitle}>No recurring bills yet</Text>

          <Text style={styles.emptyText}>
            Add rent, subscriptions, insurance, phone bills, memberships, or
            other repeating expenses.
          </Text>
        </View>
      ) : (
        expenses.map((expense) => (
          <TouchableOpacity
            key={expense.id}
            style={[styles.billCard, !expense.isActive && styles.inactiveCard]}
            onPress={() =>
              router.push(`/edit-recurring-expense?id=${expense.id}` as any)
            }
          >
            <View style={styles.billTop}>
              <View style={styles.billLeft}>
                <View style={styles.billIcon}>
                  <Text style={styles.billIconText}>↻</Text>
                </View>

                <View style={styles.billInfo}>
                  <Text style={styles.billName}>{expense.name}</Text>

                  <Text style={styles.billCategory}>
                    {expense.category} • {formatFrequency(expense.frequency)}
                  </Text>
                </View>
              </View>

              <Text style={styles.billAmount}>
                ${formatMoney(expense.amount)}
              </Text>
            </View>

            <View style={styles.billBottom}>
              <Text style={styles.dueText}>{formatDueDate(expense)}</Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    !expense.isActive && styles.inactiveDot,
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    !expense.isActive && styles.inactiveText,
                  ]}
                >
                  {expense.isActive ? "Active" : "Inactive"}
                </Text>

                <Text style={styles.editText}>Edit ›</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/add-recurring-expense" as any)}
      >
        <Text style={styles.addButtonText}>+ Add Recurring Bill</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Monevo uses active recurring bills to better understand your monthly
        financial commitments.
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
  },

  summaryCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.8,
  },

  summaryAmount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 6,
  },

  summaryText: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.75,
    marginTop: 6,
  },

  loader: {
    alignSelf: "flex-start",
    marginTop: 12,
  },

  summaryFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginTop: 18,
    paddingTop: 14,
  },

  summaryFooterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#20B486",
  },

  errorCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
  },

  billCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  loadingArea: {
    alignItems: "center",
    paddingVertical: 40,
  },

  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 30,
    color: "#20B486",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 10,
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
  },

  billCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
  },

  inactiveCard: {
    opacity: 0.6,
  },

  billTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  billLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  billIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E8F7F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  billIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#20B486",
  },

  billInfo: {
    flex: 1,
  },

  billName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#17202A",
  },

  billCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  billAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
    marginLeft: 10,
  },

  billBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  dueText: {
    fontSize: 12,
    color: "#6B7280",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#20B486",
    marginRight: 5,
  },

  inactiveDot: {
    backgroundColor: "#9CA3AF",
  },

  statusText: {
    fontSize: 12,
    color: "#20B486",
    fontWeight: "600",
  },

  inactiveText: {
    color: "#9CA3AF",
  },

  editText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#102A43",
    marginLeft: 12,
  },

  addButton: {
    height: 54,
    backgroundColor: "#20B486",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 16,
  },
});
