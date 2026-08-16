import { useState } from "react";
import {
  aggregateByCategory,
  aggregateMonthlyHistory,
  calculateVariation,
  previousPeriodRange,
  summarizePeriod,
  type DateRange,
} from "../engine/financialEngine";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { currentMonth, formatCurrency, formatPercentage } from "../lib/format";

type PeriodPreset = "7d" | "30d" | "current_month" | "last_month";
type MonthsBack = 3 | 6 | 12;

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveRange(preset: PeriodPreset): DateRange {
  switch (preset) {
    case "7d":
      return { from: isoDaysAgo(6), to: todayISO() };
    case "30d":
      return { from: isoDaysAgo(29), to: todayISO() };
    case "current_month":
      return { from: `${currentMonth()}-01`, to: `${currentMonth()}-31` };
    case "last_month": {
      const [year, month] = currentMonth().split("-").map(Number);
      const lastMonthDate = new Date(Date.UTC(year, month - 2, 1));
      const lastMonth = `${lastMonthDate.getUTCFullYear()}-${String(lastMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
      return { from: `${lastMonth}-01`, to: `${lastMonth}-31` };
    }
  }
}

export function ReportsPage() {
  const { transactions, categories } = useAppData();
  const { t } = useI18n();
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const [monthsBack, setMonthsBack] = useState<MonthsBack>(6);

  const range = resolveRange(preset);
  const summary = summarizePeriod(transactions, range);
  const previousSummary = summarizePeriod(transactions, previousPeriodRange(range));
  const incomeVariation = calculateVariation(summary.income, previousSummary.income);
  const expensesVariation = calculateVariation(summary.expenses, previousSummary.expenses);

  const monthlyHistory = aggregateMonthlyHistory(transactions, monthsBack, currentMonth());
  const maxMonthlyValue = Math.max(1, ...monthlyHistory.flatMap((m) => [m.income, m.expenses]));

  const byCategory = aggregateByCategory(transactions, categories, "expense", range);

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("reports_title")}</h1>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value as PeriodPreset)}
          className="rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-ink-900 dark:text-slate-100 outline-none focus:border-fintra-500"
        >
          <option value="7d">{t("reports_period_7d")}</option>
          <option value="30d">{t("reports_period_30d")}</option>
          <option value="current_month">{t("reports_period_current_month")}</option>
          <option value="last_month">{t("reports_period_last_month")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportSummaryCard label={t("reports_income")} value={summary.income} variation={incomeVariation} tone="positive" vsPreviousLabel={t("reports_vs_previous")} />
        <ReportSummaryCard label={t("reports_expenses")} value={summary.expenses} variation={expensesVariation} tone="negative" vsPreviousLabel={t("reports_vs_previous")} />
        <ReportSummaryCard label={t("reports_net")} value={summary.net} variation={null} vsPreviousLabel={t("reports_vs_previous")} />
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-ink-900/70 dark:text-slate-300">{t("reports_evolution_title")}</h2>
          <select
            value={monthsBack}
            onChange={(e) => setMonthsBack(Number(e.target.value) as MonthsBack)}
            className="rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-xs text-ink-900/70 dark:text-slate-300"
          >
            <option value={3}>{t("reports_evolution_months_3")}</option>
            <option value={6}>{t("reports_evolution_months_6")}</option>
            <option value={12}>{t("reports_evolution_months_12")}</option>
          </select>
        </div>

        <div className="flex h-40 items-end gap-3 overflow-x-auto">
          {monthlyHistory.map((m) => (
            <div key={m.month} className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1">
              <div className="flex h-32 items-end gap-0.5">
                <div
                  title={`${t("reports_income")}: ${formatCurrency(m.income)}`}
                  className="w-3 rounded-t bg-fintra-500 transition-all duration-500"
                  style={{ height: `${(m.income / maxMonthlyValue) * 100}%` }}
                />
                <div
                  title={`${t("reports_expenses")}: ${formatCurrency(m.expenses)}`}
                  className="w-3 rounded-t bg-red-500 transition-all duration-500"
                  style={{ height: `${(m.expenses / maxMonthlyValue) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-ink-900/50 dark:text-slate-500">{m.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
        <h2 className="mb-4 text-sm font-medium text-ink-900/70 dark:text-slate-300">{t("reports_by_category_title")}</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("reports_no_data")}</p>
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

function ReportSummaryCard({
  label,
  value,
  variation,
  tone,
  vsPreviousLabel,
}: {
  label: string;
  value: number;
  variation: number | null;
  tone?: "positive" | "negative";
  vsPreviousLabel: string;
}) {
  const toneClass = tone === "positive" ? "text-fintra-500" : tone === "negative" ? "text-red-600" : "text-ink-900 dark:text-slate-100";
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
      <p className="text-xs text-ink-900/50 dark:text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{formatCurrency(value)}</p>
      {variation !== null && (
        <p className={`mt-1 text-xs ${variation >= 0 ? "text-fintra-500" : "text-red-600"}`}>
          {variation >= 0 ? "+" : ""}
          {formatPercentage(variation)} {vsPreviousLabel}
        </p>
      )}
    </div>
  );
}
