import { useState, type FormEvent } from "react";
import { transactionsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { formatCurrency } from "../lib/format";
import type { TransactionType } from "../types/finance";

export function TransactionsPage() {
  const { accounts, categories, transactions, refetch } = useAppData();
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
      setError("Cadastre uma conta antes de lançar uma transação.");
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
      setError(err instanceof Error ? err.message : "Não foi possível lançar a transação.");
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
      <h1 className="text-xl font-semibold text-ink-900">Transações</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-black/5 bg-white p-5 sm:grid-cols-3 lg:grid-cols-6">
        <select
          value={transactionType}
          onChange={(e) => {
            setTransactionType(e.target.value as TransactionType);
            setCategoryId("");
          }}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
        <select
          required
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="">Conta…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="">Sem categoria</option>
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
          placeholder="Valor"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          type="date"
          required
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          placeholder="Descrição (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-3 lg:col-span-6 lg:w-fit"
        >
          Lançar transação
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-3 lg:col-span-6">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        {transactions.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50">Nenhuma transação lançada ainda.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {transactions.map((t) => {
              const category = categories.find((c) => c.id === t.categoryId);
              const account = accounts.find((a) => a.id === t.accountId);
              return (
                <li key={t.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-ink-900">{t.description || category?.name || "Sem descrição"}</p>
                    <p className="text-xs text-ink-900/50">
                      {new Date(t.occurredAt + "T00:00:00").toLocaleDateString("pt-BR")} · {account?.name}
                      {category ? ` · ${category.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${t.transactionType === "income" ? "text-fintra-500" : "text-red-600"}`}>
                      {t.transactionType === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                    <button type="button" onClick={() => handleRemove(t.id)} className="text-xs text-red-600 hover:underline">
                      Remover
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
