import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace("/dashboard")}
      >
        <Text style={styles.icon}>⌂</Text>
        <Text
          style={[
            styles.label,
            pathname === "/dashboard" && styles.activeLabel,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace("/transactions")}
      >
        <Text style={styles.icon}>↕</Text>
        <Text
          style={[
            styles.label,
            pathname === "/transactions" && styles.activeLabel,
          ]}
        >
          Transactions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace("/goals")}
      >
        <Text style={styles.icon}>◎</Text>
        <Text
          style={[styles.label, pathname === "/goals" && styles.activeLabel]}
        >
          Goals
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace("/ai-coach")}
      >
        <Text style={styles.icon}>✦</Text>
        <Text
          style={[styles.label, pathname === "/ai-coach" && styles.activeLabel]}
        >
          AI Coach
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => router.replace("/profile")}
      >
        <Text style={styles.icon}>○</Text>
        <Text
          style={[styles.label, pathname === "/profile" && styles.activeLabel]}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 76,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 8,
    paddingTop: 8,
  },

  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 20,
    color: "#6B7280",
    marginBottom: 4,
  },

  label: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
  },

  activeLabel: {
    color: "#20B486",
    fontWeight: "700",
  },
});
