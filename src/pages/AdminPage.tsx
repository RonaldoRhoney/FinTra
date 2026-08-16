import { useEffect, useState } from "react";
import { adminRepo, type AdminMetrics } from "../lib/repositories";
import { useI18n } from "../features/i18n/I18nProvider";
import { formatCurrency } from "../lib/format";

export function AdminPage() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminRepo
      .getPlatformMetrics()
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : t("admin_denied")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) return <p className="text-sm text-ink-900/60 dark:text-slate-400">{t("loading")}</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!metrics) return null;

  const cards: { label: string; value: string }[] = [
    { label: t("admin_total_users"), value: String(metrics.totalUsers) },
    { label: t("admin_total_accounts"), value: String(metrics.totalAccounts) },
    { label: t("admin_total_transactions"), value: String(metrics.totalTransactions) },
    { label: t("admin_total_income"), value: formatCurrency(metrics.totalIncome) },
    { label: t("admin_total_expenses"), value: formatCurrency(metrics.totalExpenses) },
    { label: t("admin_new_users_7d"), value: String(metrics.newUsers7d) },
    { label: t("admin_new_transactions_7d"), value: String(metrics.newTransactions7d) },
  ];

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("admin_title")}</h1>
        <p className="mt-1 text-sm text-ink-900/60 dark:text-slate-400">{t("admin_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
            <p className="text-xs text-ink-900/50 dark:text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-slate-100">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
