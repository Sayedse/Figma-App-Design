export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
};
export const goals: Goal[] = [
  {
    id: "1",
    name: "Emergency Fund",
    targetAmount: 10000,
    savedAmount: 3500,
  },
  {
    id: "2",
    name: "Vacation",
    targetAmount: 5000,
    savedAmount: 2000,
  },
];
export function addGoal(goal: Goal) {
  goals.unshift(goal);
}
