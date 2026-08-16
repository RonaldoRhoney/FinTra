import { useState, type FormEvent } from "react";
import { categoriesRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import type { TransactionType } from "../types/finance";

export function CategoriesPage() {
  const { categories, refetch } = useAppData();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");
  const [color, setColor] = useState("#16a34a");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await categoriesRepo.create({ name, categoryType, color });
      setName("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating category.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    await categoriesRepo.remove(id);
    await refetch();
  }

  const income = categories.filter((c) => c.categoryType === "income");
  const expense = categories.filter((c) => c.categoryType === "expense");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("categories_title")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
        <input
          required
          placeholder={t("categories_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <select
          value={categoryType}
          onChange={(e) => setCategoryType(e.target.value as TransactionType)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="expense">{t("categories_expense")}</option>
          <option value="income">{t("categories_income")}</option>
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 rounded-lg border border-black/10 dark:border-white/10"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {t("categories_add")}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryList title={t("categories_income_title")} emptyLabel={t("categories_empty")} removeLabel={t("accounts_remove")} items={income} onRemove={handleRemove} />
        <CategoryList title={t("categories_expense_title")} emptyLabel={t("categories_empty")} removeLabel={t("accounts_remove")} items={expense} onRemove={handleRemove} />
      </div>
    </div>
  );
}

function CategoryList({
  title,
  emptyLabel,
  removeLabel,
  items,
  onRemove,
}: {
  title: string;
  emptyLabel: string;
  removeLabel: string;
  items: { id: string; name: string; color: string }[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
      <h2 className="mb-3 text-sm font-medium text-ink-900/70 dark:text-slate-300">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-900/50 dark:text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-ink-900 dark:text-slate-100">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <button type="button" onClick={() => onRemove(c.id)} className="text-xs text-red-600 hover:underline">
                {removeLabel}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
