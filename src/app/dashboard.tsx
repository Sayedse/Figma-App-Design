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
import { generateFinancialNotifications } from "../lib/notification-service";
import { supabase } from "../lib/supabase";

type Transaction = {
  id: number;
  name: string;
  amount: number;
  type: "expense" | "income";
  createdAt: string;
};

type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
};

type RecurringExpense = {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  dueDay: number | null;
  isActive: boolean;
};

type Budget = {
  id: number;
  name: string;
  amount: number;
};

export default function DashboardScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);

  const [budget, setBudget] = useState<Budget | null>(null);

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setTransactions([]);
      setGoals([]);
      setRecurringExpenses([]);
      setBudget(null);
      setUnreadNotifications(0);

      setMessage("Please sign in to view your dashboard.");

      setLoading(false);
      return;
    }

    const [transactionsResult, goalsResult, recurringResult, budgetResult] =
      await Promise.all([
        supabase
          .from("transactions")
          .select("id, name, amount, type, created_at")
          .eq("user_id", user.id),

        supabase
          .from("savings_goals")
          .select("id, name, target_amount, saved_amount, created_at")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("recurring_expenses")
          .select("id, name, amount, frequency, due_day, is_active")
          .eq("user_id", user.id),

        supabase
          .from("budgets")
          .select("id, name, amount, category, period, created_at")
          .eq("user_id", user.id)
          .eq("period", "monthly")
          .is("category", null)
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle(),
      ]);

    if (transactionsResult.error) {
      console.log(
        "Dashboard transaction error:",
        transactionsResult.error.message,
      );

      setMessage(transactionsResult.error.message);

      setLoading(false);
      return;
    }

    if (goalsResult.error) {
      console.log("Dashboard goals error:", goalsResult.error.message);

      setMessage(goalsResult.error.message);

      setLoading(false);
      return;
    }

    if (recurringResult.error) {
      console.log("Dashboard recurring error:", recurringResult.error.message);

      setMessage(recurringResult.error.message);

      setLoading(false);
      return;
    }

    if (budgetResult.error) {
      console.log("Dashboard budget error:", budgetResult.error.message);

      setMessage(budgetResult.error.message);

      setLoading(false);
      return;
    }

    // -----------------------------------------
    // FORMAT TRANSACTIONS
    // -----------------------------------------

    const formattedTransactions: Transaction[] = (
      transactionsResult.data ?? []
    ).map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      amount: Number(transaction.amount),
      type: transaction.type as "expense" | "income",
      createdAt: transaction.created_at,
    }));

    // -----------------------------------------
    // FORMAT GOALS
    // -----------------------------------------

    const formattedGoals: Goal[] = (goalsResult.data ?? []).map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      savedAmount: Number(goal.saved_amount),
    }));

    // -----------------------------------------
    // FORMAT RECURRING BILLS
    // -----------------------------------------

    const formattedRecurringExpenses: RecurringExpense[] = (
      recurringResult.data ?? []
    ).map((expense) => ({
      id: expense.id,
      name: expense.name,
      amount: Number(expense.amount),
      frequency: expense.frequency ?? "monthly",
      dueDay: expense.due_day,
      isActive: expense.is_active ?? true,
    }));

    // -----------------------------------------
    // FORMAT BUDGET
    // -----------------------------------------

    let formattedBudget: Budget | null = null;

    if (budgetResult.data) {
      formattedBudget = {
        id: budgetResult.data.id,
        name: budgetResult.data.name,
        amount: Number(budgetResult.data.amount),
      };
    }

    setTransactions(formattedTransactions);
    setGoals(formattedGoals);

    setRecurringExpenses(formattedRecurringExpenses);

    setBudget(formattedBudget);

    // -----------------------------------------
    // GENERATE REMINDERS
    // -----------------------------------------

    await generateFinancialNotifications({
      userId: user.id,
      transactions: formattedTransactions,
      budget: formattedBudget,
      recurringExpenses: formattedRecurringExpenses,
    });

    // -----------------------------------------
    // UNREAD NOTIFICATION COUNT
    // -----------------------------------------

    const { count, error: notificationError } = await supabase
      .from("notifications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (notificationError) {
      console.log("Notification count error:", notificationError.message);

      setUnreadNotifications(0);
    } else {
      setUnreadNotifications(count ?? 0);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  // -----------------------------------------
  // CURRENT MONTH
  // -----------------------------------------

  const now = new Date();

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.createdAt);

    return (
      transactionDate.getFullYear() === currentYear &&
      transactionDate.getMonth() === currentMonth
    );
  });

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const availableToSpend = monthlyIncome - monthlyExpenses;

  // -----------------------------------------
  // BUDGET
  // -----------------------------------------

  const budgetAmount = budget?.amount ?? 0;

  const budgetRemaining = budget ? budgetAmount - monthlyExpenses : 0;

  const budgetPercent =
    budget && budgetAmount > 0 ? (monthlyExpenses / budgetAmount) * 100 : 0;

  const budgetProgressWidth = Math.min(Math.max(budgetPercent, 0), 100);

  // -----------------------------------------
  // RECURRING BILLS
  // -----------------------------------------

  const activeRecurringExpenses = recurringExpenses.filter(
    (expense) => expense.isActive,
  );

  const monthlyRecurringTotal = activeRecurringExpenses.reduce(
    (total, expense) => {
      if (expense.frequency.toLowerCase() === "weekly") {
        return total + (expense.amount * 52) / 12;
      }

      if (expense.frequency.toLowerCase() === "yearly") {
        return total + expense.amount / 12;
      }

      return total + expense.amount;
    },
    0,
  );

  const afterRecurringBills = availableToSpend - monthlyRecurringTotal;

  // -----------------------------------------
  // CURRENT WEEK
  // -----------------------------------------

  const startOfWeek = new Date(now);

  const day = startOfWeek.getDay();

  const daysSinceMonday = day === 0 ? 6 : day - 1;

  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyExpenses = transactions
    .filter((transaction) => {
      if (transaction.type !== "expense") {
        return false;
      }

      const transactionDate = new Date(transaction.createdAt);

      return transactionDate >= startOfWeek && transactionDate <= now;
    })
    .reduce((total, transaction) => total + transaction.amount, 0);

  // -----------------------------------------
  // GOALS
  // -----------------------------------------

  const totalSaved = goals.reduce((total, goal) => total + goal.savedAmount, 0);

  const primaryGoal = goals[0];

  const goalProgress =
    primaryGoal && primaryGoal.targetAmount > 0
      ? Math.min(
          (primaryGoal.savedAmount / primaryGoal.targetAmount) * 100,
          100,
        )
      : 0;

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const monthName = now.toLocaleString("default", {
    month: "long",
  });

  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B486" />

        <Text style={styles.loadingText}>Loading your money...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* TOP BAR */}

        <View style={styles.topBar}>
          <Text style={styles.logo}>✦ MONEVO</Text>

          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/notifications" as any)}
            >
              <Text style={styles.notificationIcon}>🔔</Text>

              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Text style={styles.profileLink}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.greeting}>Good morning 👋</Text>

        <Text style={styles.title}>Your money overview</Text>

        {!!message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.monthBadge}>
          <Text style={styles.monthBadgeText}>{monthName} overview</Text>
        </View>

        {/* AVAILABLE */}

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available this month</Text>

          <Text style={styles.balanceAmount}>
            ${formatMoney(availableToSpend)}
          </Text>

          <Text style={styles.balanceText}>
            Income minus recorded expenses this month.
          </Text>
        </View>

        {/* INCOME / EXPENSE */}

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => router.push("/transactions")}
          >
            <Text style={styles.cardLabel}>Income this month</Text>

            <Text style={styles.cardAmount}>${formatMoney(monthlyIncome)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallCard}
            onPress={() => router.push("/transactions")}
          >
            <Text style={styles.cardLabel}>Expenses this month</Text>

            <Text style={styles.cardAmount}>
              ${formatMoney(monthlyExpenses)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* WEEK */}

        <View style={styles.weekCard}>
          <View>
            <Text style={styles.weekLabel}>Spent this week</Text>

            <Text style={styles.weekSubtext}>Monday through today</Text>
          </View>

          <Text style={styles.weekAmount}>${formatMoney(weeklyExpenses)}</Text>
        </View>

        {/* BUDGET */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly budget</Text>

            <TouchableOpacity onPress={() => router.push("/budget" as any)}>
              <Text style={styles.viewLink}>Manage →</Text>
            </TouchableOpacity>
          </View>

          {budget ? (
            <TouchableOpacity
              style={styles.budgetCard}
              onPress={() => router.push("/budget" as any)}
            >
              <View style={styles.budgetTop}>
                <View>
                  <Text style={styles.budgetLabel}>Spending limit</Text>

                  <Text style={styles.budgetAmount}>
                    ${formatMoney(budgetAmount)}
                  </Text>
                </View>

                <View style={styles.budgetPercentBadge}>
                  <Text style={styles.budgetPercentText}>
                    {budgetPercent.toFixed(0)}% used
                  </Text>
                </View>
              </View>

              <View style={styles.budgetProgressBackground}>
                <View
                  style={[
                    styles.budgetProgressFill,
                    {
                      width: `${budgetProgressWidth}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.budgetBottom}>
                <Text style={styles.budgetSpentText}>
                  ${formatMoney(monthlyExpenses)} spent
                </Text>

                <Text
                  style={[
                    styles.budgetRemainingText,
                    budgetRemaining < 0 && styles.negativeAmount,
                  ]}
                >
                  ${formatMoney(budgetRemaining)} left
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.budgetEmptyCard}
              onPress={() => router.push("/budget" as any)}
            >
              <Text style={styles.budgetEmptyTitle}>
                Set your monthly budget
              </Text>

              <Text style={styles.budgetEmptyText}>
                Create a spending limit and track your monthly progress.
              </Text>

              <Text style={styles.budgetEmptyLink}>Create Budget →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RECURRING BILLS */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recurring bills</Text>

            <TouchableOpacity
              onPress={() => router.push("/recurring-expenses" as any)}
            >
              <Text style={styles.viewLink}>View Bills →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.billsCard}
            onPress={() => router.push("/recurring-expenses" as any)}
          >
            <View style={styles.billSummaryRow}>
              <View>
                <Text style={styles.billSummaryLabel}>Monthly commitments</Text>

                <Text style={styles.billSummaryAmount}>
                  ${formatMoney(monthlyRecurringTotal)}
                </Text>
              </View>

              <View style={styles.billCountBadge}>
                <Text style={styles.billCountText}>
                  {activeRecurringExpenses.length} active
                </Text>
              </View>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billBottomRow}>
              <View style={styles.billBottomInfo}>
                <Text style={styles.billBottomLabel}>
                  After reserving for bills
                </Text>

                <Text style={styles.billBottomHint}>Planning estimate</Text>
              </View>

              <Text
                style={[
                  styles.billRemainingAmount,
                  afterRecurringBills < 0 && styles.negativeAmount,
                ]}
              >
                ${formatMoney(afterRecurringBills)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* GOALS */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Savings goals</Text>

            <Text style={styles.totalSavedText}>
              ${formatMoney(totalSaved)} saved
            </Text>
          </View>

          {primaryGoal ? (
            <TouchableOpacity
              style={styles.goalCard}
              onPress={() => router.push("/goals")}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{primaryGoal.name}</Text>

                <Text style={styles.goalPercent}>
                  {goalProgress.toFixed(0)}%
                </Text>
              </View>

              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${goalProgress}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.goalText}>
                ${primaryGoal.savedAmount.toLocaleString()} of $
                {primaryGoal.targetAmount.toLocaleString()} saved
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.goalCard}
              onPress={() => router.push("/add-goal")}
            >
              <Text style={styles.goalName}>No savings goal yet</Text>

              <Text style={styles.goalText}>
                Tap here to create your first savings goal.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CAN I AFFORD IT */}

        <TouchableOpacity
          style={styles.affordCard}
          onPress={() => router.push("/can-i-afford-it")}
        >
          <Text style={styles.affordTitle}>Can I Afford It?</Text>

          <Text style={styles.affordText}>
            Check how a purchase could affect your budget, recurring bills, and
            goals.
          </Text>

          <Text style={styles.affordLink}>Check a purchase →</Text>
        </TouchableOpacity>

        {/* AI */}

        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => router.push("/ai-coach")}
        >
          <Text style={styles.aiTitle}>✦ Monevo AI</Text>

          <Text style={styles.aiText}>
            Ask questions about your spending, budget, recurring bills, savings,
            goals, and financial plan.
          </Text>

          <Text style={styles.aiLink}>Ask Monevo AI →</Text>
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

  loadingContainer: {
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

  message: {
    fontSize: 14,
    color: "#DC2626",
    marginBottom: 16,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  logo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#102A43",
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  notificationButton: {
    position: "relative",
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    fontSize: 20,
  },

  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F6F8FA",
  },

  notificationBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  profileLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B486",
  },

  greeting: {
    fontSize: 15,
    color: "#6B7280",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 4,
    marginBottom: 14,
  },

  monthBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F7F2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
  },

  monthBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#20B486",
  },

  balanceCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 22,
  },

  balanceLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },

  balanceText: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  smallCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  cardAmount: {
    fontSize: 21,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 6,
  },

  weekCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  weekLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
  },

  weekSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },

  weekAmount: {
    fontSize: 19,
    fontWeight: "700",
    color: "#17202A",
  },

  section: {
    marginTop: 28,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
  },

  viewLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#20B486",
  },

  budgetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  budgetLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  budgetAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 5,
  },

  budgetPercentBadge: {
    backgroundColor: "#E8F7F2",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  budgetPercentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#20B486",
  },

  budgetProgressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 16,
  },

  budgetProgressFill: {
    height: 8,
    backgroundColor: "#20B486",
    borderRadius: 4,
  },

  budgetBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  budgetSpentText: {
    fontSize: 12,
    color: "#6B7280",
  },

  budgetRemainingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#20B486",
  },

  budgetEmptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
  },

  budgetEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17202A",
  },

  budgetEmptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 5,
  },

  budgetEmptyLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#20B486",
    marginTop: 12,
  },

  billsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  billSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  billSummaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  billSummaryAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 5,
  },

  billCountBadge: {
    backgroundColor: "#E8F7F2",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  billCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#20B486",
  },

  billDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },

  billBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  billBottomInfo: {
    flex: 1,
    paddingRight: 12,
  },

  billBottomLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#17202A",
  },

  billBottomHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },

  billRemainingAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#20B486",
  },

  negativeAmount: {
    color: "#DC2626",
  },

  totalSavedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#20B486",
  },

  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  goalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },

  goalPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20B486",
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },

  progressFill: {
    height: 8,
    backgroundColor: "#20B486",
    borderRadius: 4,
  },

  goalText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 10,
  },

  affordCard: {
    backgroundColor: "#E8F7F2",
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
  },

  affordTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
  },

  affordText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 6,
  },

  affordLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B486",
    marginTop: 12,
  },

  aiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 16,
  },

  aiTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#20B486",
  },

  aiText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginTop: 8,
  },

  aiLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B486",
    marginTop: 12,
  },
});
