import type { Account, Budget, Goal, GoalContribution, Transaction, TransactionCategory } from "../types/finance";

export interface DateRange {
  from: string; // ISO date, inclusive
  to: string; // ISO date, inclusive
}

function isWithinRange(date: string, range?: DateRange): boolean {
  if (!range) return true;
  return date >= range.from && date <= range.to;
}

/** Período imediatamente anterior, com a mesma duração — usado pra comparar
 * "esse período vs. o anterior" nos relatórios (V0.5). */
export function previousPeriodRange(range: DateRange): DateRange {
  const from = new Date(`${range.from}T00:00:00Z`);
  const to = new Date(`${range.to}T00:00:00Z`);
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) };
}

/** Variação percentual entre dois valores — null quando o anterior é 0 (evita
 * divisão por zero e um "+Infinity%" sem sentido pro usuário). */
export function calculateVariation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
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

// ============================================================
// V0.2 — Financial Engine completo (docs/foundation/06_ROADMAP.md).
// Continua 100% determinístico — nenhuma função aqui depende de IA
// (docs/foundation/01_ZERO_COST_FIRST.md: "o núcleo financeiro deve
// funcionar sem IA generativa").
// ============================================================

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string): DateRange {
  return { from: `${month}-01`, to: `${month}-31` };
}

export interface MonthlyPoint extends PeriodSummary {
  month: string; // "YYYY-MM"
}

/** Últimos `monthsBack` meses (mais antigo primeiro), terminando em `referenceMonth`. */
export function aggregateMonthlyHistory(
  transactions: Transaction[],
  monthsBack: number,
  referenceMonth: string,
): MonthlyPoint[] {
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    months.push(shiftMonth(referenceMonth, -i));
  }
  return months.map((month) => ({ month, ...summarizePeriod(transactions, monthRange(month)) }));
}

export interface CategoryTrend {
  categoryId: string;
  name: string;
  color: string;
  currentTotal: number;
  averageTotal: number;
  variation: number | null; // null = sem histórico suficiente pra comparar
  hasEnoughHistory: boolean;
}

/** Compara o gasto/receita do mês de referência com a média dos `lookbackMonths` anteriores, por categoria. */
export function analyzeCategoryTrends(
  transactions: Transaction[],
  categories: TransactionCategory[],
  type: "income" | "expense",
  referenceMonth: string,
  lookbackMonths = 3,
): CategoryTrend[] {
  const current = aggregateByCategory(transactions, categories, type, monthRange(referenceMonth));

  const priorMonths = Array.from({ length: lookbackMonths }, (_, i) => shiftMonth(referenceMonth, -(i + 1)));
  const priorTotalsByCategory = new Map<string, number[]>();
  for (const month of priorMonths) {
    const monthTotals = aggregateByCategory(transactions, categories, type, monthRange(month));
    for (const entry of monthTotals) {
      const list = priorTotalsByCategory.get(entry.categoryId) ?? [];
      list.push(entry.total);
      priorTotalsByCategory.set(entry.categoryId, list);
    }
  }

  return current.map((entry) => {
    const priorValues = priorTotalsByCategory.get(entry.categoryId) ?? [];
    const hasEnoughHistory = priorValues.length >= 2;
    const averageTotal = priorValues.length > 0 ? priorValues.reduce((s, v) => s + v, 0) / priorValues.length : 0;
    const variation = hasEnoughHistory && averageTotal > 0 ? (entry.total - averageTotal) / averageTotal : null;
    return {
      categoryId: entry.categoryId,
      name: entry.name,
      color: entry.color,
      currentTotal: entry.total,
      averageTotal,
      variation,
      hasEnoughHistory,
    };
  });
}

export interface Anomaly {
  transactionId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  averageAmount: number;
  multiplier: number;
}

/** Transações isoladas muito acima do histórico da própria categoria — exige `minSamples`
 * transações anteriores na categoria pra evitar falso positivo com pouco dado. */
export function detectAnomalies(
  transactions: Transaction[],
  categories: TransactionCategory[],
  options: { minSamples?: number; thresholdMultiplier?: number } = {},
): Anomaly[] {
  const minSamples = options.minSamples ?? 3;
  const thresholdMultiplier = options.thresholdMultiplier ?? 2;
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const byCategory = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.transactionType !== "expense" || !t.categoryId) continue;
    const list = byCategory.get(t.categoryId) ?? [];
    list.push(t);
    byCategory.set(t.categoryId, list);
  }

  const anomalies: Anomaly[] = [];
  for (const [categoryId, categoryTransactions] of byCategory) {
    if (categoryTransactions.length < minSamples + 1) continue;
    for (const t of categoryTransactions) {
      const others = categoryTransactions.filter((o) => o.id !== t.id);
      const averageAmount = others.reduce((s, o) => s + o.amount, 0) / others.length;
      if (averageAmount > 0 && t.amount > averageAmount * thresholdMultiplier) {
        anomalies.push({
          transactionId: t.id,
          categoryId,
          categoryName: categoryById.get(categoryId)?.name ?? "",
          amount: t.amount,
          averageAmount,
          multiplier: t.amount / averageAmount,
        });
      }
    }
  }

  return anomalies.sort((a, b) => b.multiplier - a.multiplier);
}

export interface SavingsCapacity {
  averageMonthlyNet: number;
  hasEnoughHistory: boolean;
}

/** Média do saldo líquido mensal — "quanto sobra por mês, em média". Exige pelo menos
 * `minMonths` meses com movimentação real pra não virar estimativa vazia. */
export function estimateSavingsCapacity(monthlyHistory: MonthlyPoint[], minMonths = 2): SavingsCapacity {
  const monthsWithActivity = monthlyHistory.filter((m) => m.income > 0 || m.expenses > 0);
  if (monthsWithActivity.length < minMonths) {
    return { averageMonthlyNet: 0, hasEnoughHistory: false };
  }
  const averageMonthlyNet = monthsWithActivity.reduce((s, m) => s + m.net, 0) / monthsWithActivity.length;
  return { averageMonthlyNet, hasEnoughHistory: true };
}

export interface CashFlowProjection {
  monthsAhead: number;
  projectedBalances: number[]; // um valor por mês futuro, começando no próximo mês
  averageMonthlyNet: number;
  hasEnoughHistory: boolean;
}

/** Projeta o saldo dos próximos `monthsAhead` meses linearmente, a partir da média
 * histórica recente. Nunca promete exatidão — é só extrapolação do padrão observado. */
export function projectCashFlow(
  currentBalance: number,
  monthlyHistory: MonthlyPoint[],
  monthsAhead = 3,
  minMonths = 2,
): CashFlowProjection {
  const capacity = estimateSavingsCapacity(monthlyHistory, minMonths);
  if (!capacity.hasEnoughHistory) {
    return { monthsAhead, projectedBalances: [], averageMonthlyNet: 0, hasEnoughHistory: false };
  }
  const projectedBalances = Array.from(
    { length: monthsAhead },
    (_, i) => currentBalance + capacity.averageMonthlyNet * (i + 1),
  );
  return { monthsAhead, projectedBalances, averageMonthlyNet: capacity.averageMonthlyNet, hasEnoughHistory: true };
}

export interface GoalProjection extends GoalProgress {
  requiredMonthlyContribution: number | null; // pra bater o prazo definido (targetDate)
  projectedCompletionMonths: number | null; // no ritmo histórico de contribuição da própria meta
}

function monthsBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/** Nunca confunde fato com estimativa (docs/foundation/05_AGENTS.md): sem histórico de
 * contribuição suficiente, `projectedCompletionMonths` fica `null` em vez de arriscar
 * um número. */
export function projectGoalCompletion(
  goal: Goal,
  contributions: GoalContribution[],
  today: string = new Date().toISOString().slice(0, 10),
): GoalProjection {
  const progress = calculateGoalProgress(goal, contributions);

  let requiredMonthlyContribution: number | null = null;
  if (goal.targetDate && progress.remaining > 0) {
    const monthsLeft = monthsBetween(today, goal.targetDate);
    if (monthsLeft > 0) requiredMonthlyContribution = progress.remaining / monthsLeft;
  }

  const goalContributions = contributions.filter((c) => c.goalId === goal.id);
  const distinctMonths = new Set(goalContributions.map((c) => c.contributedAt.slice(0, 7)));
  let projectedCompletionMonths: number | null = null;
  if (distinctMonths.size >= 2 && progress.remaining > 0) {
    const averageMonthly = progress.currentAmount / distinctMonths.size;
    if (averageMonthly > 0) projectedCompletionMonths = Math.ceil(progress.remaining / averageMonthly);
  }

  return { ...progress, requiredMonthlyContribution, projectedCompletionMonths };
}

export type InsightKind = "category_spike" | "anomaly" | "negative_cash_flow" | "goal_off_track";

export interface Insight {
  kind: InsightKind;
  categoryName?: string;
  variation?: number;
  amount?: number;
  averageAmount?: number;
  monthsAhead?: number;
  projectedBalance?: number;
  goalName?: string;
  requiredMonthlyContribution?: number;
  availableCapacity?: number;
}

/** Junta as análises acima em uma lista de insights priorizados (docs/foundation/02_PRD.md
 * "regra de qualidade de insight": relevância, impacto, confiança, urgência, contexto —
 * por isso cada gatilho aqui exige histórico mínimo antes de disparar). Retorna dados
 * estruturados, não texto pronto — a tela monta a mensagem via i18n. */
export function generateInsights(params: {
  categoryTrends: CategoryTrend[];
  anomalies: Anomaly[];
  cashFlow: CashFlowProjection;
  goalProjections: (GoalProjection & { goalName: string })[];
  savingsCapacity: SavingsCapacity;
  spikeThreshold?: number;
}): Insight[] {
  const spikeThreshold = params.spikeThreshold ?? 0.25;
  const insights: Insight[] = [];

  for (const trend of params.categoryTrends) {
    if (trend.hasEnoughHistory && trend.variation !== null && trend.variation >= spikeThreshold) {
      insights.push({ kind: "category_spike", categoryName: trend.name, variation: trend.variation, amount: trend.currentTotal });
    }
  }

  for (const anomaly of params.anomalies) {
    insights.push({ kind: "anomaly", categoryName: anomaly.categoryName, amount: anomaly.amount, averageAmount: anomaly.averageAmount });
  }

  if (params.cashFlow.hasEnoughHistory) {
    const lastProjected = params.cashFlow.projectedBalances.at(-1);
    if (lastProjected !== undefined && lastProjected < 0) {
      insights.push({ kind: "negative_cash_flow", monthsAhead: params.cashFlow.monthsAhead, projectedBalance: lastProjected });
    }
  }

  if (params.savingsCapacity.hasEnoughHistory) {
    for (const goal of params.goalProjections) {
      if (
        goal.requiredMonthlyContribution !== null &&
        goal.requiredMonthlyContribution > params.savingsCapacity.averageMonthlyNet
      ) {
        insights.push({
          kind: "goal_off_track",
          goalName: goal.goalName,
          requiredMonthlyContribution: goal.requiredMonthlyContribution,
          availableCapacity: params.savingsCapacity.averageMonthlyNet,
        });
      }
    }
  }

  return insights;
}
