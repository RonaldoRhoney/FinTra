import { useState, type FormEvent } from "react";
import { accountsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { formatCurrency } from "../lib/format";
import type { AccountType } from "../types/finance";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "corrente", label: "Conta corrente" },
  { value: "poupanca", label: "Poupança" },
  { value: "carteira", label: "Carteira" },
  { value: "investimento", label: "Investimento" },
  { value: "outro", label: "Outro" },
];

export function AccountsPage() {
  const { accounts, refetch } = useAppData();
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("corrente");
  const [initialBalance, setInitialBalance] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await accountsRepo.create({
        name,
        institutionName: institution || null,
        accountType,
        initialBalance: Number(initialBalance.replace(",", ".")) || 0,
      });
      setName("");
      setInstitution("");
      setInitialBalance("0");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    await accountsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">Contas</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-black/5 bg-white p-5 sm:grid-cols-4">
        <input
          required
          placeholder="Nome da conta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          placeholder="Instituição (opcional)"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as AccountType)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Saldo inicial"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-4 sm:w-fit"
        >
          Adicionar conta
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        {accounts.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50">Nenhuma conta cadastrada ainda.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{a.name}</p>
                  <p className="text-xs text-ink-900/50">
                    {a.institutionName ? `${a.institutionName} · ` : ""}
                    {ACCOUNT_TYPES.find((t) => t.value === a.accountType)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-900/70">{formatCurrency(a.initialBalance)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(a.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
