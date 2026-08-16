import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { useAppData } from "../features/data/AppDataProvider";
import { useI18n } from "../features/i18n/I18nProvider";
import { LOCALE_LABELS, type Locale } from "../features/i18n/translations";
import { useTheme } from "../features/theme/ThemeProvider";
import type { TranslationKey } from "../features/i18n/translations";

const links: { to: string; end?: boolean; labelKey: TranslationKey }[] = [
  { to: "/", end: true, labelKey: "nav_overview" },
  { to: "/contas", labelKey: "nav_accounts" },
  { to: "/transacoes", labelKey: "nav_transactions" },
  { to: "/categorias", labelKey: "nav_categories" },
  { to: "/orcamentos", labelKey: "nav_budgets" },
  { to: "/metas", labelKey: "nav_goals" },
  { to: "/relatorios", labelKey: "nav_reports" },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const { profile } = useAppData();
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-svh bg-[#f5f7fb] dark:bg-[#0b1220]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-4">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-ink-900 dark:text-slate-100">
          <span className="text-fintra-500">◆</span>FinTra
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-fintra-500/10 font-medium text-fintra-500"
                    : "text-ink-900/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
                }`
              }
            >
              {t(link.labelKey)}
            </NavLink>
          ))}
          {profile?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-fintra-500/10 font-medium text-fintra-500"
                    : "text-ink-900/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
                }`
              }
            >
              {t("nav_admin")}
            </NavLink>
          )}
        </nav>

        <div className="flex flex-col gap-2 border-t border-black/5 dark:border-white/10 pt-4">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-1.5 text-xs text-ink-900/70 dark:text-slate-300"
          >
            {Object.entries(LOCALE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-black/10 dark:border-white/10 px-2 py-1.5 text-left text-xs text-ink-900/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {theme === "light" ? "🌙" : "☀️"} {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
        </div>

        <div className="mt-4 border-t border-black/5 dark:border-white/10 pt-4">
          <p className="truncate px-2 text-xs text-ink-900/50 dark:text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-ink-900/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t("sign_out")}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
