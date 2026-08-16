import { useState, type FormEvent } from "react";
import { calculateGoalProgress } from "../engine/financialEngine";
import { goalContributionsRepo, goalsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { formatCurrency, formatPercentage } from "../lib/format";

export function GoalsPage() {
  const { goals, goalContributions, refetch } = useAppData();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await goalsRepo.create({
        name,
        targetAmount: Number(targetAmount.replace(",", ".")) || 0,
        targetDate: targetDate || null,
      });
      setName("");
      setTargetAmount("");
      setTargetDate("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating goal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContribute(goalId: string) {
    const raw = window.prompt(t("goals_contribute_prompt"));
    if (!raw) return;
    const amount = Number(raw.replace(",", "."));
    if (!amount || amount <= 0) return;
    await goalContributionsRepo.create({ goalId, amount, contributedAt: new Date().toISOString().slice(0, 10) });
    await refetch();
  }

  async function handleRemove(id: string) {
    await goalsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("goals_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-4">
        <input
          required
          placeholder={t("goals_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          type="number"
          step="0.01"
          required
          placeholder={t("goals_target_amount")}
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {t("goals_add")}
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.length === 0 ? (
          <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("goals_empty")}</p>
        ) : (
          goals.map((g) => {
            const progress = calculateGoalProgress(g, goalContributions);
            return (
              <div key={g.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900 dark:text-slate-100">{g.name}</p>
                  <button type="button" onClick={() => handleRemove(g.id)} className="text-xs text-red-600 hover:underline">
                    {t("accounts_remove")}
                  </button>
                </div>
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-fintra-500" style={{ width: `${progress.percentage * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink-900/60 dark:text-slate-400">
                  {formatCurrency(progress.currentAmount)} de {formatCurrency(progress.targetAmount)} (
                  {formatPercentage(progress.percentage)})
                </p>
                <button
                  type="button"
                  onClick={() => handleContribute(g.id)}
                  className="mt-3 rounded-lg bg-fintra-500/10 px-3 py-1.5 text-xs font-medium text-fintra-500"
                >
                  {progress.isComplete ? t("goals_complete") : t("goals_contribute")}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
