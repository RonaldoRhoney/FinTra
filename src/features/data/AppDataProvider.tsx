import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  accountsRepo,
  alertsRepo,
  budgetsRepo,
  categoriesRepo,
  goalContributionsRepo,
  goalsRepo,
  profileRepo,
  transactionsRepo,
} from "../../lib/repositories";
import type { Account, Alert, Budget, Goal, GoalContribution, Profile, Transaction, TransactionCategory } from "../../types/finance";
import { useAuth } from "../auth/AuthProvider";

interface AppDataContextValue {
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  accounts: Account[];
  categories: TransactionCategory[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  goalContributions: GoalContribution[];
  alerts: Alert[];
  refetch: () => Promise<void>;
  refetchAlerts: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalContributions, setGoalContributions] = useState<GoalContribution[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const refetchAlerts = useCallback(async () => {
    if (!user) return;
    setAlerts(await alertsRepo.list());
  }, [user]);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, accountsData, categoriesData, transactionsData, budgetsData, goalsData, contributionsData, alertsData] =
        await Promise.all([
          profileRepo.getCurrent(),
          accountsRepo.list(),
          categoriesRepo.list(),
          transactionsRepo.list(),
          budgetsRepo.list(),
          goalsRepo.list(),
          goalContributionsRepo.list(),
          alertsRepo.list(),
        ]);
      setProfile(profileData);
      setAccounts(accountsData);
      setCategories(categoriesData);
      setTransactions(transactionsData);
      setBudgets(budgetsData);
      setGoals(goalsData);
      setGoalContributions(contributionsData);
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus dados.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <AppDataContext.Provider
      value={{
        loading,
        error,
        profile,
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        goalContributions,
        alerts,
        refetch,
        refetchAlerts,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData deve ser usado dentro de um AppDataProvider.");
  return ctx;
}
