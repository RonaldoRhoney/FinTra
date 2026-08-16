import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import type { TranslationKey } from "../i18n/translations";

export function AgentCard({
  titleKey,
  ctaKey,
  loadingKey,
  unavailableKey,
  run,
}: {
  titleKey: TranslationKey;
  ctaKey: TranslationKey;
  loadingKey: TranslationKey;
  unavailableKey: TranslationKey;
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
    <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-5 transition hover:shadow-md">
      <h2 className="mb-3 text-sm font-medium text-ink-900/70 dark:text-slate-300">{t(titleKey)}</h2>

      {result && <p className="fintra-fade-in whitespace-pre-line text-sm text-ink-900 dark:text-slate-100">{result}</p>}

      {error && <p className="fintra-fade-in text-sm text-red-600">{t(unavailableKey)}</p>}

      {!result && (
        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="rounded-lg bg-fintra-500/10 px-3 py-2 text-sm font-medium text-fintra-500 transition hover:bg-fintra-500/20 disabled:opacity-70"
        >
          {loading ? t(loadingKey) : t(ctaKey)}
        </button>
      )}
    </div>
  );
}
