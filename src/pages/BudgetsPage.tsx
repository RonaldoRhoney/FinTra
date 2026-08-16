import { useState, type FormEvent } from "react";
import { calculateBudgetProgress } from "../engine/financialEngine";
import { budgetsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { Field, Select, TextInput } from "../components/Field";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { currentMonth, formatCurrency, formatPercentage } from "../lib/format";

export function BudgetsPage() {
  const { categories, budgets, transactions, refetch } = useAppData();
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const expenseCategories = categories.filter((c) => c.categoryType === "expense");
  const [categoryId, setCategoryId] = useState("");
  const [referenceMonth, setReferenceMonth] = useState(currentMonth());
  const [limitAmount, setLimitAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      showToast(t("budgets_need_category"));
      return;
    }
    setSubmitting(true);
    try {
      await budgetsRepo.create({ categoryId, referenceMonth, limitAmount: Number(limitAmount.replace(",", ".")) || 0 });
      setLimitAmount("");
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error creating budget.");
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
    await budgetsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("budgets_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-4">
        <Field label={t("nav_categories")}>
          <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{t("budgets_category_placeholder")}</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("transactions_date_label")}>
          <TextInput type="month" required value={referenceMonth} onChange={(e) => setReferenceMonth(e.target.value)} />
        </Field>
        <Field label={t("budgets_limit")}>
          <TextInput type="number" step="0.01" required value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="self-end rounded-lg bg-fintra-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fintra-400 active:scale-[0.98] disabled:opacity-60"
        >
          {t("budgets_add")}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {budgets.length === 0 ? (
          <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("budgets_empty")}</p>
        ) : (
          budgets.map((b) => {
            const category = categories.find((c) => c.id === b.categoryId);
            const progress = calculateBudgetProgress(b, transactions);
            return (
              <div key={b.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900 dark:text-slate-100">
                    {category?.name} · {b.referenceMonth}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(b.id, `${category?.name} · ${b.referenceMonth}`)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {t("accounts_remove")}
                  </button>
                </div>
                <div className="h-2 rounded-full bg-black/5 dark:bg-white/10">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${progress.isOverBudget ? "bg-red-600" : "bg-fintra-500"}`}
                    style={{ width: `${Math.min(progress.percentage, 1) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-900/60 dark:text-slate-400">
                  {formatCurrency(progress.spent)} de {formatCurrency(progress.limitAmount)} ({formatPercentage(progress.percentage)})
                  {progress.isOverBudget && <span className="ml-1 font-medium text-red-600">{t("budgets_over")}</span>}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
