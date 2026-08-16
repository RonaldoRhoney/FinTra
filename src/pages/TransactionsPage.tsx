import { useState, type FormEvent } from "react";
import { transactionsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { formatCurrency } from "../lib/format";
import type { TransactionType } from "../types/finance";

export function TransactionsPage() {
  const { accounts, categories, transactions, refetch } = useAppData();
  const { t } = useI18n();
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableCategories = categories.filter((c) => c.categoryType === transactionType);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId) {
      setError(t("transactions_need_account"));
      return;
    }
    setSubmitting(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Error creating transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    await transactionsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("transactions_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-3 lg:grid-cols-6">
        <select
          value={transactionType}
          onChange={(e) => {
            setTransactionType(e.target.value as TransactionType);
            setCategoryId("");
          }}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="expense">{t("categories_expense")}</option>
          <option value="income">{t("categories_income")}</option>
        </select>
        <select
          required
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="">{t("transactions_account_placeholder")}</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="">{t("transactions_no_category")}</option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          required
          placeholder={t("transactions_amount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          type="date"
          required
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          placeholder={t("transactions_description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-3 lg:col-span-6 lg:w-fit"
        >
          {t("transactions_add")}
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-3 lg:col-span-6">{error}</p>}
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
                <li key={tx.id} className="flex items-center justify-between p-4">
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
                    <button type="button" onClick={() => handleRemove(tx.id)} className="text-xs text-red-600 hover:underline">
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
