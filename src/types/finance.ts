export type TransactionType = "income" | "expense";

export type AccountType = "corrente" | "poupanca" | "carteira" | "investimento" | "outro";

export interface Account {
  id: string;
  name: string;
  institutionName: string | null;
  accountType: AccountType;
  initialBalance: number;
}

export interface TransactionCategory {
  id: string;
  name: string;
  categoryType: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  transactionType: TransactionType;
  amount: number;
  description: string | null;
  occurredAt: string; // ISO date (YYYY-MM-DD)
}

export interface Budget {
  id: string;
  categoryId: string;
  referenceMonth: string; // "YYYY-MM"
  limitAmount: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  contributedAt: string;
}
