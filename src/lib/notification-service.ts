import { supabase } from "./supabase";

export type NotificationTransaction = {
  amount: number;
  type: "expense" | "income";
  createdAt: string;
};

export type NotificationBudget = {
  id: number;
  name: string;
  amount: number;
} | null;

export type NotificationRecurringExpense = {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  dueDay: number | null;
  isActive: boolean;
};

type ReminderInput = {
  userId: string;
  transactions: NotificationTransaction[];
  budget: NotificationBudget;
  recurringExpenses: NotificationRecurringExpense[];
};

type NewNotification = {
  user_id: string;
  title: string;
  message: string;
  type: "budget" | "bill" | "goal" | "general";
  is_read: boolean;
};

export async function generateFinancialNotifications({
  userId,
  transactions,
  budget,
  recurringExpenses,
}: ReminderInput) {
  try {
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // -----------------------------------------
    // MONTHLY EXPENSES
    // -----------------------------------------

    const monthlyExpenses = transactions
      .filter((transaction) => {
        if (transaction.type !== "expense") {
          return false;
        }

        const transactionDate = new Date(transaction.createdAt);

        return (
          transactionDate.getFullYear() === currentYear &&
          transactionDate.getMonth() === currentMonth
        );
      })
      .reduce((total, transaction) => total + Number(transaction.amount), 0);

    // -----------------------------------------
    // CURRENT MONTH NOTIFICATIONS
    // -----------------------------------------

    const monthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);

    const { data: existingNotifications, error: existingError } = await supabase
      .from("notifications")
      .select("id, title, message, type, created_at")
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    if (existingError) {
      console.log("Notification duplicate check error:", existingError.message);

      return;
    }

    const existing = existingNotifications ?? [];

    const notificationsToCreate: NewNotification[] = [];

    // -----------------------------------------
    // BUDGET WARNING
    // -----------------------------------------

    if (budget && budget.amount > 0) {
      const budgetPercent = (monthlyExpenses / budget.amount) * 100;

      // 100%+ BUDGET WARNING

      if (budgetPercent >= 100) {
        const title = "Monthly budget exceeded";

        const alreadyExists = existing.some(
          (notification) =>
            notification.type === "budget" && notification.title === title,
        );

        if (!alreadyExists) {
          const overAmount = monthlyExpenses - budget.amount;

          notificationsToCreate.push({
            user_id: userId,
            title,
            message:
              `You've spent $${monthlyExpenses.toFixed(2)} this month. ` +
              `That's $${overAmount.toFixed(
                2,
              )} over your $${budget.amount.toFixed(2)} monthly budget.`,
            type: "budget",
            is_read: false,
          });
        }
      }

      // 80%-99% BUDGET WARNING

      if (budgetPercent >= 80 && budgetPercent < 100) {
        const title = "You're nearing your budget";

        const alreadyExists = existing.some(
          (notification) =>
            notification.type === "budget" && notification.title === title,
        );

        if (!alreadyExists) {
          const remaining = budget.amount - monthlyExpenses;

          notificationsToCreate.push({
            user_id: userId,
            title,
            message:
              `You've used ${budgetPercent.toFixed(
                0,
              )}% of your monthly budget. ` +
              `$${remaining.toFixed(
                2,
              )} remains before reaching your spending limit.`,
            type: "budget",
            is_read: false,
          });
        }
      }
    }

    // -----------------------------------------
    // UPCOMING MONTHLY BILLS
    // -----------------------------------------

    const activeMonthlyBills = recurringExpenses.filter(
      (expense) =>
        expense.isActive &&
        expense.frequency.toLowerCase() === "monthly" &&
        expense.dueDay !== null,
    );

    for (const bill of activeMonthlyBills) {
      if (bill.dueDay === null) {
        continue;
      }

      /*
       * Build today's date and the bill's due date.
       * We use midnight so the comparison is based
       * on calendar days rather than the current time.
       */

      const today = new Date(
        currentYear,
        currentMonth,
        now.getDate(),
        0,
        0,
        0,
        0,
      );

      const dueDate = new Date(
        currentYear,
        currentMonth,
        bill.dueDay,
        0,
        0,
        0,
        0,
      );

      const millisecondsPerDay = 1000 * 60 * 60 * 24;

      const daysUntilDue = Math.round(
        (dueDate.getTime() - today.getTime()) / millisecondsPerDay,
      );

      /*
       * Only notify when the bill is due
       * today or within the next 3 days.
       */

      if (daysUntilDue < 0 || daysUntilDue > 3) {
        continue;
      }

      const title = `${bill.name} bill coming up`;

      const alreadyExists = existing.some(
        (notification) =>
          notification.type === "bill" && notification.title === title,
      );

      if (alreadyExists) {
        continue;
      }

      let dueText = "";

      if (daysUntilDue === 0) {
        dueText = "due today";
      } else if (daysUntilDue === 1) {
        dueText = "due tomorrow";
      } else {
        dueText = `due in ${daysUntilDue} days`;
      }

      notificationsToCreate.push({
        user_id: userId,
        title,
        message: `Your ${bill.name} bill of $${Number(bill.amount).toFixed(
          2,
        )} is ${dueText}.`,
        type: "bill",
        is_read: false,
      });
    }

    // -----------------------------------------
    // INSERT
    // -----------------------------------------

    if (notificationsToCreate.length === 0) {
      return;
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notificationsToCreate);

    if (insertError) {
      console.log("Notification creation error:", insertError.message);

      return;
    }

    console.log(`${notificationsToCreate.length} notification(s) created.`);
  } catch (error) {
    console.log("Financial notification service error:", error);
  }
}
