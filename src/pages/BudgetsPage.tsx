import { useState, type FormEvent } from "react";
import { calculateBudgetProgress } from "../engine/financialEngine";
import { budgetsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { currentMonth, formatCurrency, formatPercentage } from "../lib/format";

export function BudgetsPage() {
  const { categories, budgets, transactions, refetch } = useAppData();
  const expenseCategories = categories.filter((c) => c.categoryType === "expense");
  const [categoryId, setCategoryId] = useState("");
  const [referenceMonth, setReferenceMonth] = useState(currentMonth());
  const [limitAmount, setLimitAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      setError("Escolha uma categoria de despesa.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await budgetsRepo.create({ categoryId, referenceMonth, limitAmount: Number(limitAmount.replace(",", ".")) || 0 });
      setLimitAmount("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o orçamento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    await budgetsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">Orçamentos</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-black/5 bg-white p-5 sm:grid-cols-4">
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="">Categoria…</option>
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="month"
          required
          value={referenceMonth}
          onChange={(e) => setReferenceMonth(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          type="number"
          step="0.01"
          required
          placeholder="Limite (R$)"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Definir orçamento
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {budgets.length === 0 ? (
          <p className="text-sm text-ink-900/50">Nenhum orçamento definido ainda.</p>
        ) : (
          budgets.map((b) => {
            const category = categories.find((c) => c.id === b.categoryId);
            const progress = calculateBudgetProgress(b, transactions);
            return (
              <div key={b.id} className="rounded-2xl border border-black/5 bg-white p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900">
                    {category?.name} · {b.referenceMonth}
                  </p>
                  <button type="button" onClick={() => handleRemove(b.id)} className="text-xs text-red-600 hover:underline">
                    Remover
                  </button>
                </div>
                <div className="h-2 rounded-full bg-black/5">
                  <div
                    className={`h-2 rounded-full ${progress.isOverBudget ? "bg-red-600" : "bg-fintra-500"}`}
                    style={{ width: `${Math.min(progress.percentage, 1) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-900/60">
                  {formatCurrency(progress.spent)} de {formatCurrency(progress.limitAmount)} ({formatPercentage(progress.percentage)})
                  {progress.isOverBudget && <span className="ml-1 font-medium text-red-600">acima do limite</span>}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
