import { aggregateByCategory, calculateBalance, calculateSavingsRate, summarizePeriod } from "../engine/financialEngine";
import { useAppData } from "../features/data/AppDataProvider";
import { currentMonth, formatCurrency, formatPercentage } from "../lib/format";

export function DashboardPage() {
  const { loading, error, accounts, categories, transactions } = useAppData();

  if (loading) return <p className="text-sm text-ink-900/60">Carregando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const month = currentMonth();
  const range = { from: `${month}-01`, to: `${month}-31` };
  const balance = calculateBalance(accounts, transactions);
  const { income, expenses } = summarizePeriod(transactions, range);
  const savingsRate = calculateSavingsRate(income, expenses);
  const byCategory = aggregateByCategory(transactions, categories, "expense", range);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">Visão Geral</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Patrimônio" value={formatCurrency(balance)} />
        <SummaryCard label="Entradas (mês)" value={formatCurrency(income)} tone="positive" />
        <SummaryCard label="Saídas (mês)" value={formatCurrency(expenses)} tone="negative" />
        <SummaryCard
          label="Taxa de economia"
          value={savingsRate === null ? "—" : formatPercentage(savingsRate)}
        />
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-ink-900/70">Gastos por categoria (este mês)</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-ink-900/50">Nenhuma despesa categorizada este mês ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {byCategory.map((c) => (
              <li key={c.categoryId} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="w-32 shrink-0 truncate text-sm text-ink-900">{c.name}</span>
                <div className="h-2 flex-1 rounded-full bg-black/5">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${c.percentage * 100}%`, background: c.color }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm text-ink-900/70">{formatCurrency(c.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-fintra-500" : tone === "negative" ? "text-red-600" : "text-ink-900";
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <p className="text-xs text-ink-900/50">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
