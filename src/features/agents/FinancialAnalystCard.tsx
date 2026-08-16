import { useState } from "react";
import type { CategoryTrend, MonthlyPoint } from "../../engine/financialEngine";
import { financialAnalystRepo } from "../../lib/agents";
import { useI18n } from "../i18n/I18nProvider";

export function FinancialAnalystCard({
  balance,
  monthlyHistory,
  categoryTrends,
  savingsRate,
}: {
  balance: number;
  monthlyHistory: MonthlyPoint[];
  categoryTrends: CategoryTrend[];
  savingsRate: number | null;
}) {
  const { t, locale } = useI18n();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setError(false);
    try {
      const result = await financialAnalystRepo.analyze({ locale, balance, monthlyHistory, categoryTrends, savingsRate });
      setAnalysis(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
      <h2 className="mb-3 text-sm font-medium text-ink-900/70 dark:text-slate-300">{t("agent_financial_analyst_title")}</h2>

      {analysis && <p className="fintra-fade-in whitespace-pre-line text-sm text-ink-900 dark:text-slate-100">{analysis}</p>}

      {error && <p className="fintra-fade-in text-sm text-red-600">{t("agent_financial_analyst_unavailable")}</p>}

      {!analysis && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading}
          className="rounded-lg bg-fintra-500/10 px-3 py-2 text-sm font-medium text-fintra-500 transition hover:bg-fintra-500/20 disabled:opacity-70"
        >
          {loading ? t("agent_financial_analyst_loading") : t("agent_financial_analyst_cta")}
        </button>
      )}
    </div>
  );
}
