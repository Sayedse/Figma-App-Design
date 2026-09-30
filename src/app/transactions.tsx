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

import BottomNav from "../components/bottom-nav";
import { supabase } from "../lib/supabase";

type Transaction = {
  id: number;
  name: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  created_at: string;
};

type TypeFilter = "all" | "income" | "expense";
type PeriodFilter = "month" | "week" | "all";

export default function TransactionsScreen() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setTransactions([]);
      setLoading(false);
      setMessage("Please sign in to view your transactions.");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("id, name, amount, type, category, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Transaction load error:", error);
      setTransactions([]);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const formattedTransactions: Transaction[] = (data ?? []).map(
      (transaction) => ({
        id: transaction.id,
        name: transaction.name,
        amount: Number(transaction.amount),
        type: transaction.type as "expense" | "income",
        category: transaction.category,
        created_at: transaction.created_at,
      }),
    );

    setTransactions(formattedTransactions);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const now = new Date();

  const startOfWeek = new Date(now);

  const currentDay = startOfWeek.getDay();
  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

  startOfWeek.setHours(0, 0, 0, 0);

  const periodTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.created_at);

    if (periodFilter === "all") {
      return true;
    }

    if (periodFilter === "month") {
      return (
        transactionDate.getFullYear() === now.getFullYear() &&
        transactionDate.getMonth() === now.getMonth()
      );
    }

    if (periodFilter === "week") {
      return transactionDate >= startOfWeek && transactionDate <= now;
    }

    return true;
  });

  const filteredTransactions = periodTransactions.filter((transaction) => {
    if (typeFilter === "all") {
      return true;
    }

    return transaction.type === typeFilter;
  });

  const totalExpenses = periodTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalIncome = periodTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const periodLabel =
    periodFilter === "month"
      ? "This month"
      : periodFilter === "week"
        ? "This week"
        : "All time";

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Transactions</Text>

        <Text style={styles.subtitle}>Track where your money is going.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryPeriod}>{periodLabel}</Text>

          <Text style={styles.summaryLabel}>Total spent</Text>

          <Text style={styles.summaryAmount}>
            ${formatMoney(totalExpenses)}
          </Text>

          <View style={styles.summaryBottom}>
            <Text style={styles.summaryIncomeLabel}>Income</Text>

            <Text style={styles.summaryIncome}>
              +${formatMoney(totalIncome)}
            </Text>
          </View>
        </View>

        <Text style={styles.filterLabel}>Time period</Text>

        <View style={styles.filters}>
          <TouchableOpacity
            style={
              periodFilter === "month" ? styles.activeFilter : styles.filter
            }
            onPress={() => setPeriodFilter("month")}
          >
            <Text
              style={
                periodFilter === "month"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              This Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              periodFilter === "week" ? styles.activeFilter : styles.filter
            }
            onPress={() => setPeriodFilter("week")}
          >
            <Text
              style={
                periodFilter === "week"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              This Week
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={periodFilter === "all" ? styles.activeFilter : styles.filter}
            onPress={() => setPeriodFilter("all")}
          >
            <Text
              style={
                periodFilter === "all"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.filterLabel}>Transaction type</Text>

        <View style={styles.filters}>
          <TouchableOpacity
            style={typeFilter === "all" ? styles.activeFilter : styles.filter}
            onPress={() => setTypeFilter("all")}
          >
            <Text
              style={
                typeFilter === "all"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              typeFilter === "income" ? styles.activeFilter : styles.filter
            }
            onPress={() => setTypeFilter("income")}
          >
            <Text
              style={
                typeFilter === "income"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              typeFilter === "expense" ? styles.activeFilter : styles.filter
            }
            onPress={() => setTypeFilter("expense")}
          >
            <Text
              style={
                typeFilter === "expense"
                  ? styles.activeFilterText
                  : styles.filterText
              }
            >
              Expenses
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>

          <Text style={styles.transactionCount}>
            {filteredTransactions.length}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#20B486"
            style={styles.loader}
          />
        ) : message ? (
          <Text style={styles.message}>{message}</Text>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transactions found</Text>

            <Text style={styles.emptyText}>
              There are no transactions for the selected filters.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transaction}
              onPress={() =>
                router.push({
                  pathname: "/edit-transaction",
                  params: {
                    id: transaction.id.toString(),
                  },
                })
              }
            >
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionName}>{transaction.name}</Text>

                <View style={styles.transactionMeta}>
                  <Text style={styles.transactionCategory}>
                    {transaction.category}
                  </Text>

                  <Text style={styles.dateDot}>•</Text>

                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.created_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.amountArea}>
                <Text
                  style={
                    transaction.type === "income"
                      ? styles.income
                      : styles.expense
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}$
                  {formatMoney(transaction.amount)}
                </Text>

                <Text style={styles.editHint}>Edit ›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/add-transaction")}
        >
          <Text style={styles.buttonText}>+ Add Transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav />
    </>
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
    paddingBottom: 110,
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
  },

  summaryCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 22,
    marginTop: 24,
  },

  summaryPeriod: {
    color: "#20B486",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },

  summaryLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },

  summaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 6,
  },

  summaryBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },

  summaryIncomeLabel: {
    color: "#FFFFFF",
    opacity: 0.75,
    fontSize: 13,
  },

  summaryIncome: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 22,
    marginBottom: 9,
  },

  filters: {
    flexDirection: "row",
    gap: 8,
  },

  activeFilter: {
    flex: 1,
    backgroundColor: "#102A43",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  activeFilterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  filter: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  filterText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
  },

  transactionCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  loader: {
    marginTop: 30,
  },

  message: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 20,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 24,
  },

  emptyTitle: {
    color: "#17202A",
    fontSize: 16,
    fontWeight: "600",
  },

  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },

  transaction: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  transactionInfo: {
    flex: 1,
    paddingRight: 12,
  },

  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },

  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  transactionCategory: {
    fontSize: 13,
    color: "#6B7280",
  },

  dateDot: {
    fontSize: 13,
    color: "#9CA3AF",
    marginHorizontal: 6,
  },

  transactionDate: {
    fontSize: 13,
    color: "#6B7280",
  },

  amountArea: {
    alignItems: "flex-end",
  },

  expense: {
    fontSize: 15,
    fontWeight: "600",
    color: "#17202A",
  },

  income: {
    fontSize: 15,
    fontWeight: "600",
    color: "#20B486",
  },

  editHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
