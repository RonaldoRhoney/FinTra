import { useState, type FormEvent } from "react";
import { transactionsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { Field, Select, TextInput } from "../components/Field";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { formatCurrency } from "../lib/format";
import type { TransactionType } from "../types/finance";

export function TransactionsPage() {
  const { accounts, categories, transactions, refetch } = useAppData();
  const { t } = useI18n();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const availableCategories = categories.filter((c) => c.categoryType === transactionType);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId) {
      showToast(t("transactions_need_account"));
      return;
    }
    setSubmitting(true);
    try {
      await transactionsRepo.create({
        accountId,
        categoryId: categoryId || null,
        transactionType,
        amount: Number(amount.replace(",", ".")) || 0,
        description: description || null,
        occurredAt,
      });
      setAmount("");
      setDescription("");
      await refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error creating transaction.");
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
    await transactionsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("transactions_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-3 lg:grid-cols-6">
        <Field label={t("categories_type_label")}>
          <Select
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value as TransactionType);
              setCategoryId("");
            }}
          >
            <option value="expense">{t("categories_expense")}</option>
            <option value="income">{t("categories_income")}</option>
          </Select>
        </Field>
        <Field label={t("nav_accounts")}>
          <Select required value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">{t("transactions_account_placeholder")}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("nav_categories")}>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{t("transactions_no_category")}</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("transactions_amount")}>
          <TextInput type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label={t("transactions_date_label")}>
          <TextInput type="date" required value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </Field>
        <Field label={t("transactions_description")}>
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fintra-400 active:scale-[0.98] disabled:opacity-60 sm:col-span-3 lg:col-span-6 lg:w-fit"
        >
          {t("transactions_add")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800">
        {transactions.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50 dark:text-slate-500">{t("transactions_empty")}</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {transactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              const account = accounts.find((a) => a.id === tx.accountId);
              return (
                <li key={tx.id} className="flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <div>
                    <p className="text-sm text-ink-900 dark:text-slate-100">{tx.description || category?.name || t("transactions_no_description")}</p>
                    <p className="text-xs text-ink-900/50 dark:text-slate-500">
                      {new Date(tx.occurredAt + "T00:00:00").toLocaleDateString("pt-BR")} · {account?.name}
                      {category ? ` · ${category.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${tx.transactionType === "income" ? "text-fintra-500" : "text-red-600"}`}>
                      {tx.transactionType === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(tx.id, tx.description || category?.name || "")}
                      className="text-xs text-red-600 hover:underline"
                    >
                      {t("accounts_remove")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
