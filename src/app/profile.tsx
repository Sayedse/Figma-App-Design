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
  amount: number;
  type: "expense" | "income";
  createdAt: string;
};

type Goal = {
  savedAmount: number;
};

export default function ProfileScreen() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
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

    const userEmail = user.email ?? "";
    setEmail(userEmail);

    const fallbackName = userEmail ? userEmail.split("@")[0] : "Monevo User";

    const [profileResult, transactionsResult, goalsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("transactions")
        .select("amount, type, created_at")
        .eq("user_id", user.id),

      supabase
        .from("savings_goals")
        .select("saved_amount")
        .eq("user_id", user.id),
    ]);

    if (profileResult.error) {
      console.log(
        "Profile information unavailable:",
        profileResult.error.message,
      );
    }

    setDisplayName(profileResult.data?.full_name?.trim() || fallbackName);

    if (transactionsResult.error) {
      console.error("Profile transaction error:", transactionsResult.error);

      setMessage("Some financial information could not be loaded.");
    } else {
      const formattedTransactions: Transaction[] = (
        transactionsResult.data ?? []
      ).map((transaction) => ({
        amount: Number(transaction.amount),
        type: transaction.type as "expense" | "income",
        createdAt: transaction.created_at,
      }));

      setTransactions(formattedTransactions);
    }

    if (goalsResult.error) {
      console.error("Profile goals error:", goalsResult.error);

      setMessage("Some financial information could not be loaded.");
    } else {
      const formattedGoals: Goal[] = (goalsResult.data ?? []).map((goal) => ({
        savedAmount: Number(goal.saved_amount),
      }));

      setGoals(formattedGoals);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
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

  const currentSavings = goals.reduce(
    (total, goal) => total + goal.savedAmount,
    0,
  );

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getInitials = () => {
    const name = displayName.trim();

    if (!name) {
      return "M";
    }

    const parts = name.split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      setMessage("Unable to sign out. Please try again.");
      setSigningOut(false);
      return;
    }

    router.replace("/sign-in");
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          {loading ? (
            <ActivityIndicator size="large" color="#20B486" />
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>

              <Text style={styles.name}>{displayName}</Text>

              <Text style={styles.email}>{email}</Text>
            </>
          )}
        </View>

        {!!message && (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Financial overview</Text>

        <View style={styles.moneyCard}>
          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Income this month</Text>

            <Text style={styles.moneyValue}>
              {loading ? "—" : `$${formatMoney(monthlyIncome)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Expenses this month</Text>

            <Text style={styles.moneyValue}>
              {loading ? "—" : `$${formatMoney(monthlyExpenses)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.moneyRow}>
            <Text style={styles.moneyLabel}>Saved toward goals</Text>

            <Text style={styles.moneyValue}>
              {loading ? "—" : `$${formatMoney(currentSavings)}`}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.setting}>
          <Text style={styles.settingText}>Notifications</Text>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.setting}>
          <Text style={styles.settingText}>Privacy & Security</Text>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.premiumCard}>
          <Text style={styles.premiumTitle}>✦ Monevo Premium</Text>

          <Text style={styles.premiumText}>
            Unlock AI Coach, unlimited goals, and smarter financial insights.
          </Text>

          <Text style={styles.premiumPrice}>$4.99 / month</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutButton, signingOut && styles.disabledButton]}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Text style={styles.signOutText}>Sign Out</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.versionText}>Monevo</Text>
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
    paddingBottom: 120,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    alignItems: "center",
    padding: 24,
    marginTop: 24,
    minHeight: 170,
    justifyContent: "center",
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F7F2",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#20B486",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 14,
  },

  email: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  messageCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },

  messageText: {
    fontSize: 13,
    color: "#DC2626",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 28,
    marginBottom: 12,
  },

  moneyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 17,
  },

  moneyLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  moneyValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#17202A",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  setting: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  settingText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#17202A",
  },

  arrow: {
    fontSize: 26,
    color: "#6B7280",
  },

  premiumCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 20,
    marginTop: 18,
  },

  premiumTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  premiumText: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    lineHeight: 21,
    marginTop: 8,
  },

  premiumPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#20B486",
    marginTop: 14,
  },

  signOutButton: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },

  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },

  disabledButton: {
    opacity: 0.6,
  },

  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 18,
  },
});
