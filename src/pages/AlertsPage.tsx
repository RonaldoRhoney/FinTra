import { formatInsight } from "../features/alerts/formatInsight";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { alertsRepo } from "../lib/repositories";
import type { Insight } from "../engine/financialEngine";

export function AlertsPage() {
  const { alerts, refetchAlerts } = useAppData();
  const { t, tf } = useI18n();

  async function handleMarkRead(id: string) {
    await alertsRepo.markRead(id);
    await refetchAlerts();
  }

  async function handleDismiss(id: string) {
    await alertsRepo.dismiss(id);
    await refetchAlerts();
  }

  return (
    <div className="fintra-fade-in flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("alerts_title")}</h1>

      {alerts.length === 0 ? (
        <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("alerts_empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-2xl border p-4 transition hover:shadow-md ${
                alert.status === "unread"
                  ? "border-fintra-500/30 bg-fintra-500/5"
                  : "border-black/5 bg-white dark:border-white/10 dark:bg-slate-800"
              }`}
            >
              <p className="text-sm text-ink-900 dark:text-slate-100">{formatInsight(alert.payload as unknown as Insight, tf)}</p>
              <div className="mt-3 flex items-center gap-4">
                {alert.status === "unread" && (
                  <button type="button" onClick={() => handleMarkRead(alert.id)} className="text-xs font-medium text-fintra-500 hover:underline">
                    {t("alerts_mark_read")}
                  </button>
                )}
                <button type="button" onClick={() => handleDismiss(alert.id)} className="text-xs text-red-600 hover:underline">
                  {t("alerts_dismiss")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
