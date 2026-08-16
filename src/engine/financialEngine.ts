import type { Account, Budget, Goal, GoalContribution, Transaction, TransactionCategory } from "../types/finance";

export interface DateRange {
  from: string; // ISO date, inclusive
  to: string; // ISO date, inclusive
}

function isWithinRange(date: string, range?: DateRange): boolean {
  if (!range) return true;
  return date >= range.from && date <= range.to;
}

export function calculateBalance(accounts: Account[], transactions: Transaction[]): number {
  const initial = accounts.reduce((sum, account) => sum + account.initialBalance, 0);
  const net = transactions.reduce(
    (sum, t) => sum + (t.transactionType === "income" ? t.amount : -t.amount),
    0,
  );
  return initial + net;
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  net: number;
}

export function summarizePeriod(transactions: Transaction[], range?: DateRange): PeriodSummary {
  const period = transactions.filter((t) => isWithinRange(t.occurredAt, range));
  const income = period.filter((t) => t.transactionType === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = period.filter((t) => t.transactionType === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

export function calculateSavingsRate(income: number, expenses: number): number | null {
  if (income <= 0) return null;
  return (income - expenses) / income;
}

export interface CategoryAggregate {
  categoryId: string;
  name: string;
  color: string;
  total: number;
  percentage: number;
}

export function aggregateByCategory(
  transactions: Transaction[],
  categories: TransactionCategory[],
  type: "income" | "expense",
  range?: DateRange,
): CategoryAggregate[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const relevant = transactions.filter((t) => t.transactionType === type && isWithinRange(t.occurredAt, range));

  const totals = new Map<string, number>();
  for (const t of relevant) {
    if (!t.categoryId) continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
  }

  const grandTotal = [...totals.values()].reduce((s, v) => s + v, 0);

  return [...totals.entries()]
    .map(([categoryId, total]) => {
      const category = categoryById.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? "Sem categoria",
        color: category?.color ?? "#6b7280",
        total,
        percentage: grandTotal > 0 ? total / grandTotal : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export interface BudgetProgress {
  budgetId: string;
  categoryId: string;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export function calculateBudgetProgress(budget: Budget, transactions: Transaction[]): BudgetProgress {
  const spent = transactions
    .filter(
      (t) =>
        t.transactionType === "expense" &&
        t.categoryId === budget.categoryId &&
        t.occurredAt.slice(0, 7) === budget.referenceMonth,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    limitAmount: budget.limitAmount,
    spent,
    remaining: budget.limitAmount - spent,
    percentage: budget.limitAmount > 0 ? spent / budget.limitAmount : 0,
    isOverBudget: spent > budget.limitAmount,
  };
}

export interface GoalProgress {
  goalId: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  isComplete: boolean;
}

export function calculateGoalProgress(goal: Goal, contributions: GoalContribution[]): GoalProgress {
  const currentAmount = contributions
    .filter((c) => c.goalId === goal.id)
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    goalId: goal.id,
    targetAmount: goal.targetAmount,
    currentAmount,
    remaining: Math.max(goal.targetAmount - currentAmount, 0),
    percentage: goal.targetAmount > 0 ? Math.min(currentAmount / goal.targetAmount, 1) : 0,
    isComplete: currentAmount >= goal.targetAmount,
  };
}
