import { useState, type FormEvent } from "react";
import { categoriesRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import type { TransactionType } from "../types/finance";

export function CategoriesPage() {
  const { categories, refetch } = useAppData();
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
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
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
      <h1 className="text-xl font-semibold text-ink-900">Categorias</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5">
        <input
          required
          placeholder="Nome da categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <select
          value={categoryType}
          onChange={(e) => setCategoryType(e.target.value as TransactionType)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        >
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-12 rounded-lg border border-black/10"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Adicionar
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CategoryList title="Receitas" items={income} onRemove={handleRemove} />
        <CategoryList title="Despesas" items={expense} onRemove={handleRemove} />
      </div>
    </div>
  );
}

function CategoryList({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: { id: string; name: string; color: string }[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <h2 className="mb-3 text-sm font-medium text-ink-900/70">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-900/50">Nenhuma categoria ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-ink-900">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <button type="button" onClick={() => onRemove(c.id)} className="text-xs text-red-600 hover:underline">
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
