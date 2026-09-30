import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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

type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  savedAmount: number;
};

type Contribution = {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
};

export default function GoalDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string;
  }>();

  const goalId = Number(params.id);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadGoalDetails = useCallback(async () => {
    setLoading(true);
    setMessage("");

    if (!Number.isFinite(goalId) || goalId <= 0) {
      setGoal(null);
      setContributions([]);
      setMessage("Invalid savings goal.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setGoal(null);
      setContributions([]);
      setMessage("Please sign in to view this goal.");
      setLoading(false);
      return;
    }

    const [goalResult, contributionsResult] = await Promise.all([
      supabase
        .from("savings_goals")
        .select("id, name, target_amount, saved_amount")
        .eq("id", goalId)
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("goal_contributions")
        .select("id, amount, note, created_at")
        .eq("goal_id", goalId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (goalResult.error) {
      console.log("Goal details error:", goalResult.error.message);

      setGoal(null);
      setContributions([]);
      setMessage(goalResult.error.message);
      setLoading(false);
      return;
    }

    if (!goalResult.data) {
      setGoal(null);
      setContributions([]);
      setMessage("Savings goal not found.");
      setLoading(false);
      return;
    }

    if (contributionsResult.error) {
      console.log(
        "Contribution history error:",
        contributionsResult.error.message,
      );

      setGoal(null);
      setContributions([]);
      setMessage(contributionsResult.error.message);
      setLoading(false);
      return;
    }

    setGoal({
      id: goalResult.data.id,
      name: goalResult.data.name,
      targetAmount: Number(goalResult.data.target_amount),
      savedAmount: Number(goalResult.data.saved_amount),
    });

    setContributions(
      (contributionsResult.data ?? []).map((contribution) => ({
        id: contribution.id,
        amount: Number(contribution.amount),
        note: contribution.note,
        createdAt: contribution.created_at,
      })),
    );

    setLoading(false);
  }, [goalId]);

  useFocusEffect(
    useCallback(() => {
      loadGoalDetails();
    }, [loadGoalDetails]),
  );

  const formatMoney = (amount: number) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#20B486" />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>Goal unavailable</Text>

        <Text style={styles.errorText}>
          {message || "This savings goal could not be loaded."}
        </Text>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => router.replace("/goals")}
        >
          <Text style={styles.returnButtonText}>Return to Goals</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress =
    goal.targetAmount > 0
      ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
      : 0;

  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

  const totalContributed = contributions.reduce(
    (total, contribution) => total + contribution.amount,
    0,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.titleRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{goal.name}</Text>

          <Text style={styles.subtitle}>Savings goal</Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            router.push({
              pathname: "/goal-details" as any,
              params: {
                id: goal.id.toString(),
              },
            })
          }
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>PROGRESS</Text>

          <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
        </View>

        <Text style={styles.savedAmount}>${formatMoney(goal.savedAmount)}</Text>

        <Text style={styles.targetText}>
          saved of ${formatMoney(goal.targetAmount)}
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

        <View style={styles.progressBottom}>
          <View>
            <Text style={styles.smallLabel}>Remaining</Text>

            <Text style={styles.smallValue}>${formatMoney(remaining)}</Text>
          </View>

          <View style={styles.rightStat}>
            <Text style={styles.smallLabel}>Contributions</Text>

            <Text style={styles.smallValue}>{contributions.length}</Text>
          </View>
        </View>
      </View>

      {remaining > 0 ? (
        <TouchableOpacity
          style={styles.addMoneyButton}
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
          <Text style={styles.addMoneyButtonText}>+ Add Money</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completedCard}>
          <Text style={styles.completedTitle}>✓ Goal completed</Text>

          <Text style={styles.completedText}>
            You've reached your savings target.
          </Text>
        </View>
      )}

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Contribution History</Text>

        <Text style={styles.historyTotal}>
          ${formatMoney(totalContributed)}
        </Text>
      </View>

      {contributions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No contributions yet</Text>

          <Text style={styles.emptyText}>
            Contributions you add to this goal will appear here.
          </Text>
        </View>
      ) : (
        contributions.map((contribution) => (
          <View key={contribution.id} style={styles.contributionCard}>
            <View style={styles.contributionIcon}>
              <Text style={styles.contributionIconText}>+</Text>
            </View>

            <View style={styles.contributionInfo}>
              <Text style={styles.contributionAmount}>
                +${formatMoney(contribution.amount)}
              </Text>

              <Text style={styles.contributionDate}>
                {formatDate(contribution.createdAt)}
              </Text>

              {!!contribution.note && (
                <Text style={styles.contributionNote}>{contribution.note}</Text>
              )}
            </View>
          </View>
        ))
      )}

      <Text style={styles.helperText}>
        Contribution history shows money added through Monevo's Add Money
        feature.
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
    paddingTop: 54,
    paddingBottom: 50,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },

  errorScreen: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    paddingHorizontal: 24,
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

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  titleContainer: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  editButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17202A",
  },

  progressCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 22,
    marginTop: 24,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#20B486",
  },

  progressPercent: {
    fontSize: 15,
    fontWeight: "700",
    color: "#20B486",
  },

  savedAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 14,
  },

  targetText: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.7,
    marginTop: 3,
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

  progressBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    paddingTop: 14,
    marginTop: 18,
  },

  rightStat: {
    alignItems: "flex-end",
  },

  smallLabel: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.65,
  },

  smallValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 4,
  },

  addMoneyButton: {
    height: 54,
    backgroundColor: "#20B486",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  addMoneyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  completedCard: {
    backgroundColor: "#E8F7F2",
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
  },

  completedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#20B486",
  },

  completedText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#17202A",
  },

  historyTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20B486",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 20,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#17202A",
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 5,
  },

  contributionCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  contributionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F7F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  contributionIconText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#20B486",
  },

  contributionInfo: {
    flex: 1,
  },

  contributionAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#20B486",
  },

  contributionDate: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  contributionNote: {
    fontSize: 13,
    color: "#17202A",
    marginTop: 6,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#17202A",
  },

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },

  returnButton: {
    height: 50,
    backgroundColor: "#102A43",
    borderRadius: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },

  returnButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
