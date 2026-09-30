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

import { supabase } from "../lib/supabase";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotifications([]);
      setMessage("Please sign in to view notifications.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Notification load error:", error.message);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const formattedNotifications: Notification[] = (data ?? []).map(
      (notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read ?? false,
        createdAt: notification.created_at,
      }),
    );

    setNotifications(formattedNotifications);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const markAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notification.id)
      .eq("user_id", user.id);

    if (error) {
      console.log("Mark notification read error:", error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              isRead: true,
            }
          : item,
      ),
    );
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.log("Mark all read error:", error.message);
      setMessage(error.message);
      return;
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        isRead: true,
      })),
    );
  };

  const deleteNotification = async (id: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.log("Delete notification error:", error.message);
      setMessage(error.message);
      return;
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const getTypeSymbol = (type: string) => {
    if (type === "bill") return "$";
    if (type === "budget") return "%";
    if (type === "goal") return "◎";

    return "✦";
  };

  const formatDate = (createdAt: string) => {
    const date = new Date(createdAt);

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B486" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>

          <Text style={styles.subtitle}>
            {unreadCount === 0
              ? "You're all caught up."
              : `${unreadCount} unread ${
                  unreadCount === 1 ? "notification" : "notifications"
                }`}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!message && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{message}</Text>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>✦</Text>
          </View>

          <Text style={styles.emptyTitle}>No notifications yet</Text>

          <Text style={styles.emptyText}>
            Monevo will show important budget, bill, goal, and account reminders
            here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadNotificationCard,
              ]}
              onPress={() => markAsRead(notification)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.typeIcon,
                  !notification.isRead && styles.unreadTypeIcon,
                ]}
              >
                <Text style={styles.typeIconText}>
                  {getTypeSymbol(notification.type)}
                </Text>
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      !notification.isRead && styles.unreadTitle,
                    ]}
                  >
                    {notification.title}
                  </Text>

                  {!notification.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>

                <View style={styles.notificationFooter}>
                  <Text style={styles.dateText}>
                    {formatDate(notification.createdAt)}
                  </Text>

                  <TouchableOpacity
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 14,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#17202A",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },

  markAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#20B486",
  },

  errorCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
  },

  errorText: {
    fontSize: 14,
    color: "#DC2626",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    padding: 32,
    marginTop: 28,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E8F7F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconText: {
    fontSize: 22,
    color: "#20B486",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#17202A",
    marginTop: 16,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 7,
  },

  list: {
    marginTop: 24,
    gap: 12,
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    flexDirection: "row",
  },

  unreadNotificationCard: {
    borderColor: "#B7E8D8",
    backgroundColor: "#F8FFFC",
  },

  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  unreadTypeIcon: {
    backgroundColor: "#E8F7F2",
  },

  typeIconText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#20B486",
  },

  notificationContent: {
    flex: 1,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#17202A",
  },

  unreadTitle: {
    fontWeight: "700",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#20B486",
    marginLeft: 8,
  },

  notificationMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginTop: 5,
  },

  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
  },

  dateText: {
    fontSize: 11,
    color: "#9CA3AF",
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },
});
