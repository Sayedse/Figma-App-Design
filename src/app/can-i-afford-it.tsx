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

type Transaction = {
  amount: number;
  type: "expense" | "income";
  createdAt: string;
};

type Goal = {
  name: string;
  targetAmount: number;
  savedAmount: number;
};

type RecurringExpense = {
  amount: number;
  frequency: string;
  isActive: boolean;
};

type Assessment = "comfortable" | "possible" | "tight" | "over-budget" | null;

export default function CanIAffordItScreen() {
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpense[]
  >([]);

  const [checkedPrice, setCheckedPrice] = useState<number | null>(null);

  const [remainingAfterPurchase, setRemainingAfterPurchase] = useState<
    number | null
  >(null);

  const [assessment, setAssessment] = useState<Assessment>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadFinancialData = useCallback(async () => {
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
      setLoading(false);
      setMessage("Please sign in to check affordability.");
      return;
    }

    const [transactionsResult, goalsResult, recurringResult] =
      await Promise.all([
        supabase
          .from("transactions")
          .select("amount, type, created_at")
          .eq("user_id", user.id),

        supabase
          .from("savings_goals")
          .select("name, target_amount, saved_amount")
          .eq("user_id", user.id),

        supabase
          .from("recurring_expenses")
          .select("amount, frequency, is_active")
          .eq("user_id", user.id),
      ]);

    if (transactionsResult.error) {
      console.log(
        "Affordability transaction error:",
        transactionsResult.error.message,
      );

      setMessage(transactionsResult.error.message);
      setLoading(false);
      return;
    }

    if (goalsResult.error) {
      console.log("Affordability goals error:", goalsResult.error.message);

      setMessage(goalsResult.error.message);
      setLoading(false);
      return;
    }

    if (recurringResult.error) {
      console.log(
        "Affordability recurring bills error:",
        recurringResult.error.message,
      );

      setMessage(recurringResult.error.message);
      setLoading(false);
      return;
    }

    const formattedTransactions: Transaction[] = (
      transactionsResult.data ?? []
    ).map((transaction) => ({
      amount: Number(transaction.amount),
      type: transaction.type as "expense" | "income",
      createdAt: transaction.created_at,
    }));

    const formattedGoals: Goal[] = (goalsResult.data ?? []).map((goal) => ({
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      savedAmount: Number(goal.saved_amount),
    }));

    const formattedRecurring: RecurringExpense[] = (
      recurringResult.data ?? []
    ).map((expense) => ({
      amount: Number(expense.amount),
      frequency: expense.frequency ?? "monthly",
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

  const availableBeforeBills = monthlyIncome - monthlyExpenses;

  const activeRecurringExpenses = recurringExpenses.filter(
    (expense) => expense.isActive,
  );

  const monthlyRecurringTotal = activeRecurringExpenses.reduce(
    (total, expense) => {
      if (expense.frequency === "weekly") {
        return total + (expense.amount * 52) / 12;
      }

      if (expense.frequency === "yearly") {
        return total + expense.amount / 12;
      }

      return total + expense.amount;
    },
    0,
  );

  const availableAfterBills = availableBeforeBills - monthlyRecurringTotal;

  const totalGoalSavings = goals.reduce(
    (total, goal) => total + goal.savedAmount,
    0,
  );

  const totalGoalRemaining = goals.reduce(
    (total, goal) => total + Math.max(goal.targetAmount - goal.savedAmount, 0),
    0,
  );

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleCheckAffordability = () => {
    setMessage("");

    const cleanPrice = price.replace(/[$,\s]/g, "");
    const purchasePrice = Number(cleanPrice);

    if (
      !price.trim() ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice <= 0
    ) {
      setCheckedPrice(null);
      setRemainingAfterPurchase(null);
      setAssessment(null);
      setMessage("Please enter a valid purchase price.");
      return;
    }

    const remaining = availableAfterBills - purchasePrice;

    setCheckedPrice(purchasePrice);
    setRemainingAfterPurchase(remaining);

    if (availableAfterBills <= 0 || purchasePrice > availableAfterBills) {
      setAssessment("over-budget");
      return;
    }

    const remainingRatio = remaining / availableAfterBills;

    if (remainingRatio >= 0.5) {
      setAssessment("comfortable");
    } else if (remainingRatio >= 0.25) {
      setAssessment("possible");
    } else {
      setAssessment("tight");
    }
  };

  const getAssessmentTitle = () => {
    switch (assessment) {
      case "comfortable":
        return "Comfortable after planned bills";

      case "possible":
        return "Possible, but it reduces your flexibility";

      case "tight":
        return "This would leave your budget tight";

      case "over-budget":
        return "This exceeds your planned available money";

      default:
        return "Your affordability result";
    }
  };

  const getAssessmentText = () => {
    if (
      assessment === null ||
      checkedPrice === null ||
      remainingAfterPurchase === null
    ) {
      return "Enter a purchase price and tap Check Affordability.";
    }

    const item = itemName.trim() || "this item";

    if (assessment === "over-budget") {
      const shortage = Math.abs(remainingAfterPurchase);

      return `Buying ${item} for $${formatMoney(
        checkedPrice,
      )} would put you about $${formatMoney(
        shortage,
      )} beyond your estimated available money after reserving for recurring bills.`;
    }

    return `After reserving for recurring bills and buying ${item} for $${formatMoney(
      checkedPrice,
    )}, you would have approximately $${formatMoney(
      remainingAfterPurchase,
    )} left for the month.`;
  };

  const getGuidance = () => {
    switch (assessment) {
      case "comfortable":
        return "After accounting for your recurring commitments, this purchase would leave at least half of your estimated available money.";

      case "possible":
        return "The purchase fits within your estimated money after recurring commitments, but it would use a significant portion of what remains.";

      case "tight":
        return "The purchase fits within the planning estimate, but it would leave less than 25% of the money available after recurring commitments.";

      case "over-budget":
        return "The purchase is greater than the estimated money available after reserving for your active recurring commitments.";

      default:
        return "Enter a purchase price to see how it could affect your monthly budget, recurring commitments, and savings goals.";
    }
  };

  const monthName = now.toLocaleString("default", {
    month: "long",
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.replace("/dashboard")}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.aiLabel}>✦ Monevo AI</Text>

      <Text style={styles.title}>Can I Afford It?</Text>

      <Text style={styles.subtitle}>
        See how a purchase could affect your monthly budget, recurring
        commitments, and savings goals.
      </Text>

      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View>
            <Text style={styles.budgetLabel}>Estimated after bills</Text>

            <Text style={styles.monthText}>{monthName}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#20B486" />
          ) : (
            <Text
              style={[
                styles.budgetAmount,
                availableAfterBills < 0 && styles.negativeAmount,
              ]}
            >
              ${formatMoney(availableAfterBills)}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.moneyRow}>
          <Text style={styles.moneyLabel}>Monthly income</Text>

          <Text style={styles.moneyValue}>${formatMoney(monthlyIncome)}</Text>
        </View>

        <View style={styles.moneyRow}>
          <Text style={styles.moneyLabel}>Recorded expenses</Text>

          <Text style={styles.moneyValue}>${formatMoney(monthlyExpenses)}</Text>
        </View>

        <View style={styles.moneyRow}>
          <Text style={styles.moneyLabel}>Active recurring bills</Text>

          <Text style={styles.moneyValue}>
            ${formatMoney(monthlyRecurringTotal)}
          </Text>
        </View>

        <View style={styles.moneyRow}>
          <Text style={styles.moneyLabel}>Active bills</Text>

          <Text style={styles.moneyValue}>
            {activeRecurringExpenses.length}
          </Text>
        </View>

        <Text style={styles.planningNote}>
          Recurring bills are reserved for planning. If a bill is also recorded
          as a transaction, it may already be included in recorded expenses.
        </Text>
      </View>

      <View style={styles.savingsCard}>
        <View>
          <Text style={styles.savingsLabel}>Saved toward goals</Text>

          <Text style={styles.savingsAmount}>
            ${formatMoney(totalGoalSavings)}
          </Text>
        </View>

        <View style={styles.savingsRight}>
          <Text style={styles.savingsLabel}>Still needed</Text>

          <Text style={styles.savingsRemaining}>
            ${formatMoney(totalGoalRemaining)}
          </Text>
        </View>
      </View>

      <Text style={styles.label}>What do you want to buy?</Text>

      <TextInput
        style={styles.input}
        placeholder="New phone"
        placeholderTextColor="#6B7280"
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.label}>Purchase price</Text>

      <TextInput
        style={styles.input}
        placeholder="$1,200"
        placeholderTextColor="#6B7280"
        keyboardType="decimal-pad"
        value={price}
        onChangeText={setPrice}
      />

      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleCheckAffordability}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Check Affordability</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Monevo assessment</Text>

        <Text style={styles.resultTitle}>{getAssessmentTitle()}</Text>

        <Text style={styles.resultText}>{getAssessmentText()}</Text>

        {checkedPrice !== null && remainingAfterPurchase !== null && (
          <View style={styles.afterPurchaseCard}>
            <Text style={styles.afterPurchaseLabel}>
              After bills + purchase
            </Text>

            <Text
              style={[
                styles.afterPurchaseAmount,
                remainingAfterPurchase < 0 && styles.negativeAmount,
              ]}
            >
              ${formatMoney(remainingAfterPurchase)}
            </Text>

            <Text style={styles.afterPurchaseText}>
              estimated money remaining this month
            </Text>
          </View>
        )}

        <Text style={styles.resultTip}>✦ Monevo AI: {getGuidance()}</Text>

        {goals.length > 0 && assessment !== null && (
          <Text style={styles.goalWarning}>
            You currently have {goals.length} savings{" "}
            {goals.length === 1 ? "goal" : "goals"} with $
            {formatMoney(totalGoalRemaining)} still needed. This purchase does
            not automatically withdraw money from your savings, but it may
            reduce what you can contribute this month.
          </Text>
        )}
      </View>

      <Text style={styles.disclaimer}>
        Monevo provides budgeting estimates based on the financial information
        you record. Recurring commitments are planning estimates and may overlap
        with recorded transactions. Monevo is not financial advice.
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
    marginBottom: 22,
  },

  budgetCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 18,
  },

  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  budgetLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  monthText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#20B486",
    marginTop: 4,
  },

  budgetAmount: {
    fontSize: 25,
    fontWeight: "700",
    color: "#20B486",
  },

  negativeAmount: {
    color: "#DC2626",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },

  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  moneyLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  moneyValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#17202A",
  },

  planningNote: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 17,
    marginTop: 14,
  },

  savingsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#E8F7F2",
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },

  savingsRight: {
    alignItems: "flex-end",
  },

  savingsLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

  savingsAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#20B486",
    marginTop: 5,
  },

  savingsRemaining: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 5,
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

  message: {
    color: "#DC2626",
    fontSize: 14,
    marginTop: 14,
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  resultCard: {
    backgroundColor: "#E8F7F2",
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
  },

  resultLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 6,
  },

  resultText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    marginTop: 10,
  },

  afterPurchaseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 15,
    marginTop: 16,
  },

  afterPurchaseLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

  afterPurchaseAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#20B486",
    marginTop: 4,
  },

  afterPurchaseText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  resultTip: {
    fontSize: 14,
    fontWeight: "500",
    color: "#20B486",
    lineHeight: 21,
    marginTop: 16,
  },

  goalWarning: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 14,
  },

  disclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
    textAlign: "center",
    marginTop: 20,
  },
});
