import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";

export function AgentCard({
  titleKey,
  subtitleKey,
  ctaKey,
  loadingKey,
  unavailableKey,
  disclaimerKey,
  highlight,
  run,
}: {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  ctaKey: TranslationKey;
  loadingKey: TranslationKey;
  unavailableKey: TranslationKey;
  disclaimerKey?: TranslationKey;
  highlight?: boolean;
  run: () => Promise<string>;
}) {
  const { t } = useI18n();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleRun() {
    setLoading(true);
    setError(false);
    try {
      setResult(await run());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`rounded-2xl border p-5 transition hover:shadow-md ${
        highlight
          ? "border-fintra-500/30 bg-gradient-to-br from-fintra-500/10 to-transparent dark:border-fintra-500/20"
          : "border-black/5 bg-white dark:border-white/10 dark:bg-slate-800"
      }`}
    >
      <h2 className={`font-medium text-ink-900/70 dark:text-slate-300 ${highlight ? "text-base" : "mb-3 text-sm"}`}>{t(titleKey)}</h2>
      {subtitleKey && <p className="mb-3 mt-1 text-sm text-ink-900/50 dark:text-slate-500">{t(subtitleKey)}</p>}

      {result && (
        <div className="fintra-fade-in">
          <p className="whitespace-pre-line text-sm text-ink-900 dark:text-slate-100">{result}</p>
          {disclaimerKey && <p className="mt-2 text-xs italic text-ink-900/40 dark:text-slate-500">{t(disclaimerKey)}</p>}
        </div>
      )}

      {error && <p className="fintra-fade-in text-sm text-red-600">{t(unavailableKey)}</p>}

      {!result && (
        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-70 ${
            highlight ? "bg-fintra-500 text-white hover:bg-fintra-400" : "bg-fintra-500/10 text-fintra-500 hover:bg-fintra-500/20"
          }`}
        >
          {loading ? t(loadingKey) : t(ctaKey)}
        </button>
      )}
    </div>
  );
}
