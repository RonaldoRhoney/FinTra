import { useState, type FormEvent } from "react";
import { accountsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import type { TranslationKey } from "../features/i18n/translations";
import { formatCurrency } from "../lib/format";
import type { AccountType } from "../types/finance";

const ACCOUNT_TYPES: { value: AccountType; labelKey: TranslationKey }[] = [
  { value: "corrente", labelKey: "accounts_type_corrente" },
  { value: "poupanca", labelKey: "accounts_type_poupanca" },
  { value: "carteira", labelKey: "accounts_type_carteira" },
  { value: "investimento", labelKey: "accounts_type_investimento" },
  { value: "outro", labelKey: "accounts_type_outro" },
];

export function AccountsPage() {
  const { accounts, refetch } = useAppData();
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : "Error creating account.");
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
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("accounts_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-4">
        <input
          required
          placeholder={t("accounts_name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <input
          placeholder={t("accounts_institution")}
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as AccountType)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        >
          {ACCOUNT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {t(type.labelKey)}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder={t("accounts_initial_balance")}
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-4 sm:w-fit"
        >
          {t("accounts_add")}
        </button>
        {error && <p className="text-sm text-red-600 sm:col-span-4">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800">
        {accounts.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50 dark:text-slate-500">{t("accounts_empty")}</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-slate-100">{a.name}</p>
                  <p className="text-xs text-ink-900/50 dark:text-slate-500">
                    {a.institutionName ? `${a.institutionName} · ` : ""}
                    {t(ACCOUNT_TYPES.find((type) => type.value === a.accountType)?.labelKey ?? "accounts_type_outro")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-900/70 dark:text-slate-300">{formatCurrency(a.initialBalance)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(a.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {t("accounts_remove")}
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
