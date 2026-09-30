import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

import BottomNav from "../components/bottom-nav";
import { supabase } from "../lib/supabase";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type Transaction = {
  id: number;
  name: string;
  amount: number;
  type: "expense" | "income";
  category: string;
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
  category: string;
  frequency: string;
  dueDay: number | null;
  isActive: boolean;
};

export default function AICoachScreen() {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm Monevo AI. Ask me about your spending, recurring bills, savings, budget, or goals.",
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [goals, setGoals] = useState<Goal[]>([]);

  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dataError, setDataError] = useState("");

  const loadFinancialData = useCallback(async () => {
    setLoading(true);
    setDataError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setTransactions([]);
      setGoals([]);
      setRecurringExpenses([]);
      setLoading(false);
      setDataError("Please sign in to use Monevo AI.");
      return;
    }

    const [transactionsResult, goalsResult, recurringResult] =
      await Promise.all([
        supabase
          .from("transactions")
          .select("id, name, amount, type, category, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("savings_goals")
          .select("id, name, target_amount, saved_amount, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("recurring_expenses")
          .select("id, name, amount, category, frequency, due_day, is_active")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

    if (transactionsResult.error) {
      console.log(
        "AI Coach transaction error:",
        transactionsResult.error.message,
      );

      setDataError(transactionsResult.error.message);
      setLoading(false);
      return;
    }

    if (goalsResult.error) {
      console.log("AI Coach goals error:", goalsResult.error.message);

      setDataError(goalsResult.error.message);
      setLoading(false);
      return;
    }

    if (recurringResult.error) {
      console.log(
        "AI Coach recurring bills error:",
        recurringResult.error.message,
      );

      setDataError(recurringResult.error.message);
      setLoading(false);
      return;
    }

    const formattedTransactions: Transaction[] = (
      transactionsResult.data ?? []
    ).map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      amount: Number(transaction.amount),
      type: transaction.type as "expense" | "income",
      category: transaction.category || "Other",
      createdAt: transaction.created_at,
    }));

    const formattedGoals: Goal[] = (goalsResult.data ?? []).map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      savedAmount: Number(goal.saved_amount),
    }));

    const formattedRecurring: RecurringExpense[] = (
      recurringResult.data ?? []
    ).map((expense) => ({
      id: expense.id,
      name: expense.name,
      amount: Number(expense.amount),
      category: expense.category || "Other",
      frequency: expense.frequency ?? "monthly",
      dueDay: expense.due_day,
      isActive: expense.is_active ?? true,
    }));

    setTransactions(formattedTransactions);
    setGoals(formattedGoals);
    setRecurringExpenses(formattedRecurring);

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFinancialData();
    }, [loadFinancialData]),
  );

  const now = new Date();

  // CURRENT MONTH

  const monthlyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.createdAt);

    return (
      transactionDate.getFullYear() === now.getFullYear() &&
      transactionDate.getMonth() === now.getMonth()
    );
  });

  const monthlyIncome = monthlyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const availableThisMonth = monthlyIncome - monthlyExpenses;

  // RECURRING BILLS

  const activeRecurringExpenses = recurringExpenses.filter(
    (expense) => expense.isActive,
  );

  const getMonthlyEquivalent = (expense: RecurringExpense) => {
    if (expense.frequency === "weekly") {
      return (expense.amount * 52) / 12;
    }

    if (expense.frequency === "yearly") {
      return expense.amount / 12;
    }

    return expense.amount;
  };

  const monthlyRecurringTotal = activeRecurringExpenses.reduce(
    (total, expense) => total + getMonthlyEquivalent(expense),
    0,
  );

  const availableAfterRecurringBills =
    availableThisMonth - monthlyRecurringTotal;

  const recurringBillsForAI = recurringExpenses.map((expense) => ({
    name: expense.name,
    amount: expense.amount,
    category: expense.category,
    frequency: expense.frequency,
    dueDay: expense.dueDay,
    isActive: expense.isActive,
    monthlyEquivalent: getMonthlyEquivalent(expense),
  }));

  // CURRENT WEEK — MONDAY THROUGH NOW

  const startOfWeek = new Date(now);

  const currentDay = startOfWeek.getDay();

  const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.createdAt);

    return transactionDate >= startOfWeek && transactionDate <= now;
  });

  const weeklyExpenses = weeklyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const weeklyIncome = weeklyTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  // ALL-TIME TOTALS

  const allTimeIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const allTimeExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  // SAVINGS GOALS

  const totalSaved = goals.reduce((total, goal) => total + goal.savedAmount, 0);

  const totalGoalTargets = goals.reduce(
    (total, goal) => total + goal.targetAmount,
    0,
  );

  const totalGoalRemaining = goals.reduce(
    (total, goal) => total + Math.max(goal.targetAmount - goal.savedAmount, 0),
    0,
  );

  // MONTHLY EXPENSES BY CATEGORY

  const monthlyCategoryTotals = monthlyTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((totals, transaction) => {
      const category = transaction.category || "Other";

      totals[category] = (totals[category] || 0) + transaction.amount;

      return totals;
    }, {});

  const spendingByCategory = Object.entries(monthlyCategoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // SEND ONLY RECENT TRANSACTIONS TO AI

  const recentTransactions = transactions.slice(0, 20).map((transaction) => ({
    name: transaction.name,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: transaction.createdAt,
  }));

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const monthName = now.toLocaleString("default", {
    month: "long",
  });

  const sendMessage = async (question?: string) => {
    const text = (question ?? input).trim();

    if (!text || loading || sending || dataError) {
      return;
    }

    const timestamp = Date.now();

    const userMessage: Message = {
      id: `${timestamp}-user`,
      role: "user",
      text,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);

    setInput("");
    setSending(true);

    try {
      const financialContext = {
        currentDate: now.toISOString(),
        currentMonth: monthName,

        currentMonthSummary: {
          income: monthlyIncome,
          recordedExpenses: monthlyExpenses,
          availableBeforeRecurringBills: availableThisMonth,
          activeRecurringBills: monthlyRecurringTotal,
          availableAfterRecurringBills,
          transactionCount: monthlyTransactions.length,
        },

        recurringBillsSummary: {
          activeMonthlyEquivalent: monthlyRecurringTotal,
          activeBillCount: activeRecurringExpenses.length,
          totalBillCount: recurringExpenses.length,

          note: "Recurring bills are planning commitments. They may overlap with recorded expense transactions because recurring bills and transactions are not yet linked.",
        },

        recurringBills: recurringBillsForAI,

        currentWeekSummary: {
          income: weeklyIncome,
          expenses: weeklyExpenses,
          transactionCount: weeklyTransactions.length,
          weekStartsOn: "Monday",
        },

        allTimeSummary: {
          income: allTimeIncome,
          expenses: allTimeExpenses,
          transactionCount: transactions.length,
        },

        savingsSummary: {
          totalSaved,
          totalGoalTargets,
          totalGoalRemaining,
          numberOfGoals: goals.length,
        },

        goals: goals.map((goal) => ({
          name: goal.name,
          targetAmount: goal.targetAmount,
          savedAmount: goal.savedAmount,

          remainingAmount: Math.max(goal.targetAmount - goal.savedAmount, 0),

          progressPercent:
            goal.targetAmount > 0
              ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
              : 0,
        })),

        spendingByCategory,

        recentTransactions,
      };

      const { data, error } = await supabase.functions.invoke("monevo-ai", {
        body: {
          question: text,
          financialContext,
        },
      });

      if (error) {
        console.log("Monevo AI function error:", error.message);

        throw error;
      }

      if (!data?.answer) {
        throw new Error(data?.error || "Monevo AI returned an empty response.");
      }

      const aiMessage: Message = {
        id: `${timestamp}-assistant`,
        role: "assistant",
        text: data.answer,
      };

      setMessages((currentMessages) => [...currentMessages, aiMessage]);
    } catch (error) {
      console.log("Monevo AI error:", error);

      const errorMessage: Message = {
        id: `${timestamp}-error`,
        role: "assistant",
        text: "I couldn't connect to Monevo AI right now. Your financial data loaded correctly, but the AI service is currently unavailable.",
      };

      setMessages((currentMessages) => [...currentMessages, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const suggestedQuestions = [
    "How much did I spend this week?",
    "How much are my recurring bills each month?",
    "Can I afford a $1,200 phone after my bills?",
    "How am I doing on my savings goals?",
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.chat}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.aiLabel}>✦ Monevo AI</Text>

        <Text style={styles.title}>Your AI Financial Coach</Text>

        <Text style={styles.subtitle}>
          Ask questions about your spending, recurring bills, savings, budget,
          and goals.
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryMonth}>{monthName} overview</Text>

          <Text style={styles.summaryLabel}>Estimated after bills</Text>

          {loading ? (
            <ActivityIndicator color="#FFFFFF" style={styles.summaryLoader} />
          ) : (
            <Text
              style={[
                styles.summaryAmount,
                availableAfterRecurringBills < 0 &&
                  styles.negativeSummaryAmount,
              ]}
            >
              ${formatMoney(availableAfterRecurringBills)}
            </Text>
          )}

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summarySmallLabel}>Income</Text>

              <Text style={styles.summarySmallAmount}>
                ${formatMoney(monthlyIncome)}
              </Text>
            </View>

            <View style={styles.summaryRight}>
              <Text style={styles.summarySmallLabel}>Expenses</Text>

              <Text style={styles.summarySmallAmount}>
                ${formatMoney(monthlyExpenses)}
              </Text>
            </View>
          </View>

          <View style={styles.billRow}>
            <View>
              <Text style={styles.summarySmallLabel}>Recurring bills</Text>

              <Text style={styles.summarySmallAmount}>
                ${formatMoney(monthlyRecurringTotal)}
              </Text>
            </View>

            <View style={styles.summaryRight}>
              <Text style={styles.summarySmallLabel}>Active</Text>

              <Text style={styles.summarySmallAmount}>
                {activeRecurringExpenses.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.weekCard}>
          <View>
            <Text style={styles.weekLabel}>Spent this week</Text>

            <Text style={styles.weekSubtext}>Monday through today</Text>
          </View>

          <Text style={styles.weekAmount}>${formatMoney(weeklyExpenses)}</Text>
        </View>

        {!!dataError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{dataError}</Text>
          </View>
        )}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.role === "user" && styles.userMessageText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}

        {sending && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color="#20B486" />

              <Text style={styles.thinkingText}>Monevo AI is thinking...</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Try asking</Text>

        {suggestedQuestions.map((question) => (
          <TouchableOpacity
            key={question}
            style={styles.questionCard}
            onPress={() => sendMessage(question)}
            disabled={loading || sending || !!dataError}
          >
            <Text style={styles.questionText}>{question}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.disclaimer}>
          Monevo provides budgeting information based on the financial data you
          record. Recurring commitments are planning estimates and may overlap
          with recorded transactions. It is not financial, investment, tax, or
          legal advice.
        </Text>
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder={
            loading
              ? "Loading your finances..."
              : sending
                ? "Monevo AI is thinking..."
                : "Ask Monevo AI..."
          }
          placeholderTextColor="#6B7280"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          editable={!loading && !sending && !dataError}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || loading || sending || !!dataError) &&
              styles.disabledButton,
          ]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading || sending || !!dataError}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>

      <BottomNav />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  chat: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
  },

  aiLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#20B486",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 10,
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

  summaryMonth: {
    fontSize: 12,
    fontWeight: "700",
    color: "#20B486",
    marginBottom: 12,
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

  negativeSummaryAmount: {
    color: "#FCA5A5",
  },

  summaryLoader: {
    alignSelf: "flex-start",
    marginTop: 10,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginTop: 18,
    paddingTop: 14,
  },

  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  summaryRight: {
    alignItems: "flex-end",
  },

  summarySmallLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.65,
  },

  summarySmallAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 4,
  },

  weekCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
  },

  errorCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },

  errorText: {
    fontSize: 14,
    color: "#DC2626",
  },

  messageBubble: {
    maxWidth: "88%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 14,
  },

  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F7F2",
  },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#102A43",
  },

  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#17202A",
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  thinkingText: {
    fontSize: 14,
    color: "#6B7280",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 28,
    marginBottom: 12,
  },

  questionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  questionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#17202A",
  },

  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
  },

  inputArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 10,
  },

  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#F6F8FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#17202A",
  },

  sendButton: {
    height: 48,
    paddingHorizontal: 18,
    backgroundColor: "#102A43",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.45,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
