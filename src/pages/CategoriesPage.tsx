import { useState, type FormEvent } from "react";
import { categoriesRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { Field, Select, TextInput } from "../components/Field";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import type { TransactionType } from "../types/finance";

export function CategoriesPage() {
  const { categories, refetch } = useAppData();
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [categoryType, setCategoryType] = useState<TransactionType>("expense");
  const [color, setColor] = useState("#16a34a");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await categoriesRepo.create({ name, categoryType, color });
      setName("");
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error creating category.");
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
    await categoriesRepo.remove(id);
    await refetch();
  }

  const income = categories.filter((c) => c.categoryType === "income");
  const expense = categories.filter((c) => c.categoryType === "expense");

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("categories_title")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
        <Field label={t("categories_name")}>
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("categories_type_label")}>
          <Select value={categoryType} onChange={(e) => setCategoryType(e.target.value as TransactionType)}>
            <option value="expense">{t("categories_expense")}</option>
            <option value="income">{t("categories_income")}</option>
          </Select>
        </Field>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 rounded-lg border border-black/10 dark:border-white/10"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fintra-400 active:scale-[0.98] disabled:opacity-60"
        >
          {t("categories_add")}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryList
          title={t("categories_income_title")}
          emptyLabel={t("categories_empty")}
          removeLabel={t("accounts_remove")}
          items={income}
          onRemove={handleRemove}
        />
        <CategoryList
          title={t("categories_expense_title")}
          emptyLabel={t("categories_empty")}
          removeLabel={t("accounts_remove")}
          items={expense}
          onRemove={handleRemove}
        />
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
  onRemove: (id: string, label: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5">
      <h2 className="mb-3 text-sm font-medium text-ink-900/70 dark:text-slate-300">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-900/50 dark:text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-lg px-1 py-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              <span className="flex items-center gap-2 text-sm text-ink-900 dark:text-slate-100">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <button type="button" onClick={() => onRemove(c.id, c.name)} className="text-xs text-red-600 hover:underline">
                {removeLabel}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
