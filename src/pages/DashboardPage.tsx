import {
  aggregateByCategory,
  aggregateMonthlyHistory,
  analyzeCategoryTrends,
  calculateBalance,
  calculateBudgetProgress,
  calculateSavingsRate,
  detectAnomalies,
  estimateSavingsCapacity,
  generateInsights,
  projectCashFlow,
  projectGoalCompletion,
  summarizePeriod,
} from "../engine/financialEngine";
import { DashboardSkeleton } from "../components/Skeleton";
import { AgentCard } from "../features/agents/AgentCard";
import { formatInsight } from "../features/alerts/formatInsight";
import { useAlertSync } from "../features/alerts/useAlertSync";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import {
  behaviorAgentRepo,
  cfoAgentRepo,
  financialAnalystRepo,
  goalAgentRepo,
  investmentEducationAgentRepo,
  planningAgentRepo,
  savingsCoachRepo,
} from "../lib/agents";
import { currentMonth, formatCurrency, formatPercentage } from "../lib/format";

export function DashboardPage() {
  const { loading, error, accounts, categories, transactions, goals, goalContributions, budgets } = useAppData();
  const { t, tf, locale } = useI18n();

  const month = currentMonth();
  const range = { from: `${month}-01`, to: `${month}-31` };
  const balance = calculateBalance(accounts, transactions);
  const { income, expenses } = summarizePeriod(transactions, range);
  const savingsRate = calculateSavingsRate(income, expenses);
  const byCategory = aggregateByCategory(transactions, categories, "expense", range);

  const monthlyHistory = aggregateMonthlyHistory(transactions, 6, month);
  const categoryTrends = analyzeCategoryTrends(transactions, categories, "expense", month, 3);
  const anomalies = detectAnomalies(transactions, categories);
  const cashFlow = projectCashFlow(balance, monthlyHistory, 3);
  const savingsCapacity = estimateSavingsCapacity(monthlyHistory);
  const goalProjections = goals.map((g) => ({ ...projectGoalCompletion(g, goalContributions), goalName: g.name }));
  const insights = generateInsights({ categoryTrends, anomalies, cashFlow, goalProjections, savingsCapacity });
  const budgetsProgress = budgets
    .filter((b) => b.referenceMonth === month)
    .map((b) => calculateBudgetProgress(b, transactions));

  useAlertSync(loading ? [] : insights);

  if (loading) return <DashboardSkeleton />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("dashboard_title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t("dashboard_balance")} value={formatCurrency(balance)} />
        <SummaryCard label={t("dashboard_income_month")} value={formatCurrency(income)} tone="positive" />
        <SummaryCard label={t("dashboard_expenses_month")} value={formatCurrency(expenses)} tone="negative" />
        <SummaryCard
          label={t("dashboard_savings_rate")}
          value={savingsRate === null ? "—" : formatPercentage(savingsRate)}
        />
      </div>

      <AgentCard
        highlight
        titleKey="agent_cfo_title"
        subtitleKey="agent_cfo_subtitle"
        ctaKey="agent_cfo_cta"
        loadingKey="agent_cfo_loading"
        unavailableKey="agent_cfo_unavailable"
        run={() =>
          cfoAgentRepo.brief({
            locale,
            balance,
            monthlyHistory,
            categoryTrends,
            savingsRate,
            budgetsProgress,
            anomalies,
            goalProjections,
            savingsCapacity,
            cashFlow,
          })
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AgentCard
          titleKey="agent_financial_analyst_title"
          ctaKey="agent_financial_analyst_cta"
          loadingKey="agent_financial_analyst_loading"
          unavailableKey="agent_financial_analyst_unavailable"
          run={() => financialAnalystRepo.analyze({ locale, balance, monthlyHistory, categoryTrends, savingsRate })}
        />
        <AgentCard
          titleKey="agent_savings_coach_title"
          ctaKey="agent_savings_coach_cta"
          loadingKey="agent_savings_coach_loading"
          unavailableKey="agent_savings_coach_unavailable"
          run={() => savingsCoachRepo.suggest({ locale, categoryTrends, budgetsProgress })}
        />
        <AgentCard
          titleKey="agent_behavior_title"
          ctaKey="agent_behavior_cta"
          loadingKey="agent_behavior_loading"
          unavailableKey="agent_behavior_unavailable"
          run={() => behaviorAgentRepo.detect({ locale, anomalies, categoryTrends, monthlyHistory })}
        />
        <AgentCard
          titleKey="agent_goal_title"
          ctaKey="agent_goal_cta"
          loadingKey="agent_goal_loading"
          unavailableKey="agent_goal_unavailable"
          run={() => goalAgentRepo.evaluate({ locale, goalProjections, savingsCapacity })}
        />
        <AgentCard
          titleKey="agent_planning_title"
          ctaKey="agent_planning_cta"
          loadingKey="agent_planning_loading"
          unavailableKey="agent_planning_unavailable"
          run={() => planningAgentRepo.simulate({ locale, savingsCapacity, goalProjections, cashFlow })}
        />
        <AgentCard
          titleKey="agent_investment_education_title"
          ctaKey="agent_investment_education_cta"
          loadingKey="agent_investment_education_loading"
          unavailableKey="agent_investment_education_unavailable"
          disclaimerKey="agent_investment_education_disclaimer"
          run={() => investmentEducationAgentRepo.explain({ locale, savingsCapacity })}
        />
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
        <h2 className="mb-4 text-sm font-medium text-ink-900/70 dark:text-slate-300">{t("dashboard_insights_title")}</h2>
        {insights.length === 0 ? (
          <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("dashboard_insights_empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {insights.map((insight, i) => (
              <li
                key={i}
                className="fintra-fade-in rounded-lg border-l-4 border-fintra-500 bg-fintra-500/5 px-3 py-2 text-sm text-ink-900 dark:text-slate-100"
              >
                {formatInsight(insight, tf)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
        <h2 className="mb-4 text-sm font-medium text-ink-900/70 dark:text-slate-300">{t("dashboard_by_category")}</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("dashboard_no_expenses")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {byCategory.map((c) => (
              <li key={c.categoryId} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="w-32 shrink-0 truncate text-sm text-ink-900 dark:text-slate-100">{c.name}</span>
                <div className="h-2 flex-1 rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${c.percentage * 100}%`, background: c.color }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-ink-900/70 dark:text-slate-300">{formatCurrency(c.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-fintra-500" : tone === "negative" ? "text-red-600" : "text-ink-900 dark:text-slate-100";
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
      <p className="text-xs text-ink-900/50 dark:text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
