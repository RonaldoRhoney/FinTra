import { useState, type FormEvent } from "react";
import { projectGoalCompletion } from "../engine/financialEngine";
import { goalContributionsRepo, goalsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { Field, TextInput } from "../components/Field";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { formatCurrency, formatPercentage } from "../lib/format";

export function GoalsPage() {
  const { goals, goalContributions, refetch } = useAppData();
  const { t, tf } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
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
      showToast(err instanceof Error ? err.message : "Error creating goal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string, label: string) {
    const ok = await confirm({
      title: t("dialog_confirm_delete_title"),
      description: label,
      confirmLabel: t("dialog_confirm"),
      cancelLabel: t("dialog_cancel"),
    });
    if (!ok) return;
    await goalsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("goals_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-4">
        <Field label={t("goals_name")}>
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("goals_target_amount")}>
          <TextInput type="number" step="0.01" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
        </Field>
        <Field label={t("transactions_date_label")}>
          <TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="self-end rounded-lg bg-fintra-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fintra-400 active:scale-[0.98] disabled:opacity-60"
        >
          {t("goals_add")}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.length === 0 ? (
          <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("goals_empty")}</p>
        ) : (
          goals.map((g) => {
            const progress = projectGoalCompletion(g, goalContributions);
            return (
              <div key={g.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900 dark:text-slate-100">{g.name}</p>
                  <button type="button" onClick={() => handleRemove(g.id, g.name)} className="text-xs text-red-600 hover:underline">
                    {t("accounts_remove")}
                  </button>
                </div>
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-fintra-500 transition-all duration-500" style={{ width: `${progress.percentage * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink-900/60 dark:text-slate-400">
                  {formatCurrency(progress.currentAmount)} de {formatCurrency(progress.targetAmount)} (
                  {formatPercentage(progress.percentage)})
                </p>
                {g.targetDate && (
                  <p className="mt-1 text-xs text-ink-900/50 dark:text-slate-500">
                    {tf("goals_target_date", { date: new Date(g.targetDate + "T00:00:00").toLocaleDateString() })}
                  </p>
                )}
                {!progress.isComplete && progress.requiredMonthlyContribution !== null && (
                  <p className="mt-1 text-xs font-medium text-fintra-500">
                    {tf("goals_required_monthly", { amount: formatCurrency(progress.requiredMonthlyContribution) })}
                  </p>
                )}
                {!progress.isComplete && progress.projectedCompletionMonths !== null && (
                  <p className="mt-1 text-xs text-ink-900/60 dark:text-slate-400">
                    {tf("goals_projected_months", { months: String(progress.projectedCompletionMonths) })}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setContributingGoalId(g.id)}
                  disabled={progress.isComplete}
                  className="mt-3 rounded-lg bg-fintra-500/10 px-3 py-1.5 text-xs font-medium text-fintra-500 transition hover:bg-fintra-500/20 disabled:opacity-70"
                >
                  {progress.isComplete ? t("goals_complete") : t("goals_contribute")}
                </button>
              </div>
            );
          })
        )}
      </div>

      {contributingGoalId && (
        <ContributeModal
          goalName={goals.find((g) => g.id === contributingGoalId)?.name ?? ""}
          onClose={() => setContributingGoalId(null)}
          onConfirm={async (amount) => {
            await goalContributionsRepo.create({
              goalId: contributingGoalId,
              amount,
              contributedAt: new Date().toISOString().slice(0, 10),
            });
            setContributingGoalId(null);
            await refetch();
          }}
        />
      )}
    </div>
  );
}

function ContributeModal({
  goalName,
  onClose,
  onConfirm,
}: {
  goalName: string;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void>;
}) {
  const { t } = useI18n();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(amount.replace(",", "."));
    if (!parsed || parsed <= 0) return;
    setSubmitting(true);
    await onConfirm(parsed);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 fintra-fade-in" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold text-ink-900 dark:text-slate-100">{t("goals_contribute_title")}</h2>
        <p className="mt-1 text-sm text-ink-900/60 dark:text-slate-400">{goalName}</p>
        <Field label={t("goals_contribute_amount")} className="mt-4">
          <TextInput
            type="number"
            step="0.01"
            autoFocus
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-900/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t("dialog_cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white hover:bg-fintra-400 disabled:opacity-60"
          >
            {t("goals_contribute_submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
