import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;

export const PREMIUM_ENTITLEMENT = "premium";

let configured = false;

export async function initializeRevenueCat(userId?: string) {
  // Native subscription testing only for now.
  if (Platform.OS === "web") {
    return;
  }

  if (configured) {
    if (userId) {
      await Purchases.logIn(userId);
    }
    return;
  }

  if (!REVENUECAT_API_KEY) {
    console.log("Missing RevenueCat API key.");
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserID: userId,
  });

  configured = true;
}

export async function getPremiumStatus() {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();

    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  } catch (error) {
    console.log("RevenueCat status error:", error);
    return false;
  }
}

export async function getMonthlyPackage() {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.log("No current RevenueCat offering.");
      return null;
    }

    return (
      offerings.current.monthly ??
      offerings.current.availablePackages[0] ??
      null
    );
  } catch (error) {
    console.log("RevenueCat offerings error:", error);
    return null;
  }
}

export async function purchasePremium() {
  if (Platform.OS === "web") {
    return {
      success: false,
      premium: false,
      message: "Purchases are currently available in the mobile app.",
    };
  }

  try {
    const packageToPurchase = await getMonthlyPackage();

    if (!packageToPurchase) {
      return {
        success: false,
        premium: false,
        message: "Monevo Premium is currently unavailable.",
      };
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    const premium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    return {
      success: premium,
      premium,
      message: premium
        ? "Monevo Premium is now active."
        : "The purchase completed, but Premium is not active yet.",
    };
  } catch (error: any) {
    if (error?.userCancelled) {
      return {
        success: false,
        premium: false,
        message: "Purchase cancelled.",
      };
    }

    console.log("RevenueCat purchase error:", error);

    return {
      success: false,
      premium: false,
      message: "We couldn't complete the purchase. Please try again.",
    };
  }
}

export async function restorePremium() {
  if (Platform.OS === "web") {
    return {
      success: false,
      premium: false,
      message: "Restore Purchases is available in the mobile app.",
    };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();

    const premium =
      customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

    return {
      success: premium,
      premium,
      message: premium
        ? "Monevo Premium has been restored."
        : "No active Monevo Premium subscription was found.",
    };
  } catch (error) {
    console.log("RevenueCat restore error:", error);

    return {
      success: false,
      premium: false,
      message: "We couldn't restore purchases. Please try again.",
    };
  }
}
