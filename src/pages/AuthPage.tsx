import { useState, type FormEvent } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { useI18n } from "../features/i18n/I18nProvider";

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { t } = useI18n();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleGoogleClick() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSignupDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f5f7fb] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink-900 dark:text-slate-100">{t("auth_title")}</h1>
        <p className="mt-1 text-sm text-ink-900/60 dark:text-slate-400">
          {mode === "login" ? t("auth_login_subtitle") : t("auth_signup_subtitle")}
        </p>

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={googleLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm font-medium text-ink-900 dark:text-slate-100 hover:bg-black/5 dark:bg-white/10 disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? t("auth_google_redirecting") : t("auth_google")}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-ink-900/40 dark:text-slate-500">
          <span className="h-px flex-1 bg-black/10" />
          {t("auth_or")}
          <span className="h-px flex-1 bg-black/10" />
        </div>

        {signupDone ? (
          <p className="mt-6 rounded-lg bg-fintra-500/10 p-3 text-sm text-fintra-500">{t("auth_signup_done")}</p>
        ) : (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder={t("auth_email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder={t("auth_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm outline-fintra-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? t("auth_wait") : mode === "login" ? t("auth_login") : t("auth_signup")}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setSignupDone(false);
            setError(null);
          }}
          className="mt-4 text-sm text-fintra-500 hover:underline"
        >
          {mode === "login" ? t("auth_switch_to_signup") : t("auth_switch_to_login")}
        </button>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.5-5.5c-2 1.5-4.7 2.6-7.7 2.6-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.4l6.5 5.5C40.5 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
