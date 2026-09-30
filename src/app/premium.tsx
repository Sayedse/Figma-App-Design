import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    getPremiumStatus,
    purchasePremium,
    restorePremium,
} from "../lib/revenuecat";

export default function PremiumScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  async function checkPremiumStatus() {
    try {
      const premium = await getPremiumStatus();
      setIsPremium(premium);
    } catch (error) {
      console.log("Premium status check error:", error);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handlePurchase() {
    if (Platform.OS === "web") {
      setMessage(
        "Premium purchase testing is currently available in the mobile app.",
      );
      return;
    }

    if (isPremium) {
      setMessage("Monevo Premium is already active on this account.");
      return;
    }

    setPurchasing(true);
    setMessage("");

    try {
      const result = await purchasePremium();

      setMessage(result.message);

      if (result.premium) {
        setIsPremium(true);
      }
    } catch (error) {
      console.log("Premium purchase error:", error);
      setMessage("We couldn't complete the purchase. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (Platform.OS === "web") {
      setMessage("Restore Purchases is currently available in the mobile app.");
      return;
    }

    setRestoring(true);
    setMessage("");

    try {
      const result = await restorePremium();

      setMessage(result.message);

      if (result.premium) {
        setIsPremium(true);
      }
    } catch (error) {
      console.log("Restore purchase error:", error);
      setMessage("We couldn't restore purchases. Please try again.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* TOP */}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.brand}>✦ MONEVO</Text>
      </View>

      {/* HERO */}

      <View style={styles.hero}>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>MONEVO PREMIUM</Text>
        </View>

        <Text style={styles.title}>Make smarter money moves.</Text>

        <Text style={styles.subtitle}>
          Unlock Monevo&apos;s advanced tools and AI-powered financial insights.
        </Text>
      </View>

      {/* PREMIUM STATUS */}

      {!checkingStatus && isPremium && (
        <View style={styles.activeCard}>
          <View style={styles.activeIcon}>
            <Text style={styles.activeCheck}>✓</Text>
          </View>

          <View style={styles.activeContent}>
            <Text style={styles.activeTitle}>Premium is active</Text>

            <Text style={styles.activeDescription}>
              This Monevo account has access to Premium features.
            </Text>
          </View>
        </View>
      )}

      {/* PRICE */}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Monevo Premium</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>$4.99</Text>

          <Text style={styles.pricePeriod}>/ month</Text>
        </View>

        <Text style={styles.cancelText}>Cancel anytime.</Text>
      </View>

      {/* FEATURES */}

      <Text style={styles.sectionTitle}>Everything in Premium</Text>

      <View style={styles.featuresCard}>
        <Feature
          title="✦ Monevo AI"
          description="Ask personalized questions about your spending, budget, bills, savings, and goals."
        />

        <Feature
          title="Can I Afford It?"
          description="See how a purchase could affect your budget and financial goals before you buy."
        />

        <Feature
          title="Unlimited savings goals"
          description="Create and track as many financial goals as you need."
        />

        <Feature
          title="Smart money insights"
          description="Get useful insights based on your financial activity."
        />

        <Feature
          title="Advanced reports"
          description="Understand your spending and financial progress in more detail."
        />

        <Feature
          title="Weekly money summary"
          description="Get a simple overview of your financial progress each week."
          last
        />
      </View>

      {/* MESSAGE */}

      {message !== "" && (
        <View
          style={[styles.messageCard, isPremium && styles.successMessageCard]}
        >
          <Text
            style={[styles.messageText, isPremium && styles.successMessageText]}
          >
            {message}
          </Text>
        </View>
      )}

      {/* SUBSCRIBE */}

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          (purchasing || isPremium) && styles.subscribeButtonDisabled,
        ]}
        onPress={handlePurchase}
        disabled={purchasing || isPremium}
      >
        {purchasing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.subscribeButtonText}>
            {isPremium ? "Monevo Premium Active" : "Start Monevo Premium"}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.subscriptionNote}>
        During development, purchases use RevenueCat&apos;s Test Store. Real App
        Store and Google Play billing will be configured before release.
      </Text>

      {/* RESTORE */}

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={restoring}
      >
        {restoring ? (
          <ActivityIndicator color="#20B486" />
        ) : (
          <Text style={styles.restoreText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      {/* DISCLAIMER */}

      <Text style={styles.disclaimer}>
        Monevo provides financial planning and educational tools. It does not
        provide professional financial, investment, tax, or legal advice.
      </Text>
    </ScrollView>
  );
}

type FeatureProps = {
  title: string;
  description: string;
  last?: boolean;
};

function Feature({ title, description, last = false }: FeatureProps) {
  return (
    <View style={[styles.feature, last && styles.lastFeature]}>
      <View style={styles.checkCircle}>
        <Text style={styles.check}>✓</Text>
      </View>

      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>

        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
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
    paddingBottom: 60,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
  },

  backButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B486",
  },

  brand: {
    fontSize: 15,
    fontWeight: "700",
    color: "#102A43",
  },

  hero: {
    alignItems: "center",
    marginBottom: 26,
  },

  premiumBadge: {
    backgroundColor: "#E8F7F2",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 18,
  },

  premiumBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#20B486",
    letterSpacing: 0.7,
  },

  title: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "700",
    color: "#17202A",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    maxWidth: 420,
  },

  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F7F2",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#20B486",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  activeCheck: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  activeContent: {
    flex: 1,
  },

  activeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#17202A",
  },

  activeDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    marginTop: 2,
  },

  priceCard: {
    backgroundColor: "#102A43",
    borderRadius: 20,
    padding: 22,
    marginBottom: 30,
  },

  priceLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 6,
  },

  price: {
    fontSize: 38,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pricePeriod: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginLeft: 5,
    marginBottom: 6,
  },

  cancelText: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.7,
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#17202A",
    marginBottom: 12,
  },

  featuresCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 18,
    marginBottom: 24,
  },

  feature: {
    flexDirection: "row",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  lastFeature: {
    borderBottomWidth: 0,
  },

  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8F7F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },

  check: {
    fontSize: 14,
    fontWeight: "700",
    color: "#20B486",
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#17202A",
  },

  featureDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 4,
  },

  messageCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 13,
    marginBottom: 14,
  },

  successMessageCard: {
    backgroundColor: "#E8F7F2",
    borderColor: "#20B486",
  },

  messageText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    textAlign: "center",
  },

  successMessageText: {
    color: "#17202A",
  },

  subscribeButton: {
    backgroundColor: "#20B486",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },

  subscribeButtonDisabled: {
    opacity: 0.65,
  },

  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  subscriptionNote: {
    fontSize: 11,
    lineHeight: 17,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },

  restoreButton: {
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },

  restoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#20B486",
  },

  disclaimer: {
    fontSize: 11,
    lineHeight: 17,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },
});
