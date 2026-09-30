export type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: "expense" | "income";
  category: string;
};
export const transactions: Transaction[] = [
  {
    id: "1",
    name: "Groceries",
    amount: 85.4,
    type: "expense",
    category: "Food",
  },
  {
    id: "2",
    name: "Gas",
    amount: 42,
    type: "expense",
    category: "Transportation",
  },
  {
    id: "3",
    name: "Paycheck",
    amount: 2000,
    type: "income",
    category: "Income",
  },
  {
    id: "4",
    name: "Netflix",
    amount: 15.49,
    type: "expense",
    category: "Subscription",
  },
];
export function addTransaction(transaction: Transaction) {
  transactions.unshift(transaction);
}
