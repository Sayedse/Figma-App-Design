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

type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
};

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setGoals([]);
      setLoading(false);
      setMessage("Please sign in to view your savings goals.");
      return;
    }

    const { data, error } = await supabase
      .from("savings_goals")
      .select("id, name, target_amount, saved_amount, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Goal load error:", error.message);
      setGoals([]);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const formattedGoals: Goal[] = (data ?? []).map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      savedAmount: Number(goal.saved_amount),
      createdAt: goal.created_at,
    }));

    setGoals(formattedGoals);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals]),
  );

  const totalSaved = goals.reduce((total, goal) => total + goal.savedAmount, 0);

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Savings Goals</Text>

        <Text style={styles.subtitle}>
          Track your progress and reach your goals.
        </Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total saved</Text>

          <Text style={styles.totalAmount}>${formatMoney(totalSaved)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Your goals</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#20B486"
            style={styles.loader}
          />
        ) : message ? (
          <Text style={styles.message}>{message}</Text>
        ) : goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No savings goals yet</Text>

            <Text style={styles.emptyText}>
              Create your first goal and start tracking your progress.
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const progress =
              goal.targetAmount > 0
                ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
                : 0;

            const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

            return (
              <View key={goal.id} style={styles.goalCard}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/edit-goal",
                      params: {
                        id: goal.id.toString(),
                      },
                    })
                  }
                >
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>

                    <Text style={styles.percent}>{progress.toFixed(0)}%</Text>
                  </View>

                  <Text style={styles.amount}>
                    ${formatMoney(goal.savedAmount)} of $
                    {formatMoney(goal.targetAmount)}
                  </Text>

                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progress}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.goalBottom}>
                    <Text style={styles.goalInfo}>
                      ${formatMoney(remaining)} remaining
                    </Text>

                    <Text style={styles.editHint}>Edit ›</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contributionButton}
                  onPress={() =>
                    router.push({
                      pathname: "/add-contribution" as any,
                      params: {
                        goalId: goal.id.toString(),
                        goalName: goal.name,
                      },
                    })
                  }
                >
                  <Text style={styles.contributionButtonText}>+ Add Money</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/add-goal")}
        >
          <Text style={styles.buttonText}>+ Add New Goal</Text>
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

  totalCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 22,
    marginTop: 24,
  },

  totalLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },

  totalAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#17202A",
    marginTop: 28,
    marginBottom: 12,
  },

  loader: {
    marginTop: 30,
  },

  message: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 22,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#17202A",
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 6,
  },

  goalCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  goalName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#17202A",
  },

  percent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20B486",
  },

  amount: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },

  progressBackground: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 14,
    overflow: "hidden",
  },

  progressFill: {
    height: 8,
    backgroundColor: "#20B486",
    borderRadius: 4,
  },

  goalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  goalInfo: {
    fontSize: 13,
    color: "#6B7280",
  },

  editHint: {
    fontSize: 12,
    color: "#6B7280",
  },

  contributionButton: {
    height: 44,
    backgroundColor: "#E8F7F2",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  contributionButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20B486",
  },

  button: {
    height: 52,
    backgroundColor: "#102A43",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
