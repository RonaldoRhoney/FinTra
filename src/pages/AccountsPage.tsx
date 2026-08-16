import { useState, type FormEvent } from "react";
import { accountsRepo } from "../lib/repositories";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import type { TranslationKey } from "../features/i18n/translations";
import { formatCurrency } from "../lib/format";
import { Field, Select, TextInput } from "../components/Field";
import { useConfirm } from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
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
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("corrente");
  const [initialBalance, setInitialBalance] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
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
      showToast(err instanceof Error ? err.message : "Error creating account.");
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
    await accountsRepo.remove(id);
    await refetch();
  }

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("accounts_title")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 sm:grid-cols-4">
        <Field label={t("accounts_name")}>
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("accounts_institution")}>
          <TextInput value={institution} onChange={(e) => setInstitution(e.target.value)} />
        </Field>
        <Field label={t("accounts_type_label")}>
          <Select value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.labelKey)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("accounts_initial_balance")}>
          <TextInput type="number" step="0.01" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-fintra-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fintra-400 active:scale-[0.98] disabled:opacity-60 sm:col-span-4 sm:w-fit"
        >
          {t("accounts_add")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800">
        {accounts.length === 0 ? (
          <p className="p-5 text-sm text-ink-900/50 dark:text-slate-500">{t("accounts_empty")}</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
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
                    onClick={() => handleRemove(a.id, a.name)}
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
