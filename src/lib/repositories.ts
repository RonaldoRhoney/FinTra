import { supabase } from "./supabaseClient";
import type {
  Account,
  Budget,
  Goal,
  GoalContribution,
  Transaction,
  TransactionCategory,
} from "../types/finance";

function mapAccount(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    institutionName: row.institution_name,
    accountType: row.account_type,
    initialBalance: Number(row.initial_balance),
  };
}

function mapCategory(row: any): TransactionCategory {
  return { id: row.id, name: row.name, categoryType: row.category_type, color: row.color };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    description: row.description,
    occurredAt: row.occurred_at,
  };
}

function mapBudget(row: any): Budget {
  return { id: row.id, categoryId: row.category_id, referenceMonth: row.reference_month, limitAmount: Number(row.limit_amount) };
}

function mapGoal(row: any): Goal {
  return { id: row.id, name: row.name, targetAmount: Number(row.target_amount), targetDate: row.target_date };
}

function mapGoalContribution(row: any): GoalContribution {
  return { id: row.id, goalId: row.goal_id, amount: Number(row.amount), contributedAt: row.contributed_at };
}

function assertOk<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Operação não retornou dado.");
  return data;
}

export const accountsRepo = {
  async list(): Promise<Account[]> {
    const { data, error } = await supabase.from("accounts").select("*").order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapAccount);
  },
  async create(input: { name: string; institutionName: string | null; accountType: Account["accountType"]; initialBalance: number }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: userData.user?.id,
        name: input.name,
        institution_name: input.institutionName,
        account_type: input.accountType,
        initial_balance: input.initialBalance,
      })
      .select()
      .single();
    return mapAccount(assertOk(data, error));
  },
  async remove(id: string) {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const categoriesRepo = {
  async list(): Promise<TransactionCategory[]> {
    const { data, error } = await supabase.from("transaction_categories").select("*").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCategory);
  },
  async create(input: { name: string; categoryType: TransactionCategory["categoryType"]; color: string }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("transaction_categories")
      .insert({ user_id: userData.user?.id, name: input.name, category_type: input.categoryType, color: input.color })
      .select()
      .single();
    return mapCategory(assertOk(data, error));
  },
  async remove(id: string) {
    const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const transactionsRepo = {
  async list(): Promise<Transaction[]> {
    const { data, error } = await supabase.from("transactions").select("*").order("occurred_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTransaction);
  },
  async create(input: {
    accountId: string;
    categoryId: string | null;
    transactionType: Transaction["transactionType"];
    amount: number;
    description: string | null;
    occurredAt: string;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userData.user?.id,
        account_id: input.accountId,
        category_id: input.categoryId,
        transaction_type: input.transactionType,
        amount: input.amount,
        description: input.description,
        occurred_at: input.occurredAt,
      })
      .select()
      .single();
    return mapTransaction(assertOk(data, error));
  },
  async remove(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const budgetsRepo = {
  async list(): Promise<Budget[]> {
    const { data, error } = await supabase.from("budgets").select("*").order("reference_month", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapBudget);
  },
  async create(input: { categoryId: string; referenceMonth: string; limitAmount: number }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: userData.user?.id,
        category_id: input.categoryId,
        reference_month: input.referenceMonth,
        limit_amount: input.limitAmount,
      })
      .select()
      .single();
    return mapBudget(assertOk(data, error));
  },
  async remove(id: string) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const goalsRepo = {
  async list(): Promise<Goal[]> {
    const { data, error } = await supabase.from("goals").select("*").order("created_at");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapGoal);
  },
  async create(input: { name: string; targetAmount: number; targetDate: string | null }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("goals")
      .insert({ user_id: userData.user?.id, name: input.name, target_amount: input.targetAmount, target_date: input.targetDate })
      .select()
      .single();
    return mapGoal(assertOk(data, error));
  },
  async remove(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export const goalContributionsRepo = {
  async list(): Promise<GoalContribution[]> {
    const { data, error } = await supabase.from("goal_contributions").select("*").order("contributed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapGoalContribution);
  },
  async create(input: { goalId: string; amount: number; contributedAt: string }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("goal_contributions")
      .insert({ user_id: userData.user?.id, goal_id: input.goalId, amount: input.amount, contributed_at: input.contributedAt })
      .select()
      .single();
    return mapGoalContribution(assertOk(data, error));
  },
  async remove(id: string) {
    const { error } = await supabase.from("goal_contributions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
