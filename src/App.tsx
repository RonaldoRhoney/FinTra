import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { AppDataProvider, useAppData } from "./features/data/AppDataProvider";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";
import { I18nProvider, useI18n } from "./features/i18n/I18nProvider";
import { ThemeProvider } from "./features/theme/ThemeProvider";
import { AccountsPage } from "./pages/AccountsPage";
import { AdminPage } from "./pages/AdminPage";
import { AlertsPage } from "./pages/AlertsPage";
import { AuthPage } from "./pages/AuthPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalsPage } from "./pages/GoalsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f5f7fb] dark:bg-[#0b1220]">
        <p className="text-sm text-ink-900/50 dark:text-slate-500">{t("loading")}</p>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <AppDataProvider>{children}</AppDataProvider>;
}

function AdminRoute() {
  const { profile } = useAppData();
  if (profile?.role !== "admin") return <Navigate to="/" replace />;
  return <AdminPage />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <AuthGate>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="contas" element={<AccountsPage />} />
                      <Route path="transacoes" element={<TransactionsPage />} />
                      <Route path="categorias" element={<CategoriesPage />} />
                      <Route path="orcamentos" element={<BudgetsPage />} />
                      <Route path="metas" element={<GoalsPage />} />
                      <Route path="relatorios" element={<ReportsPage />} />
                      <Route path="alertas" element={<AlertsPage />} />
                      <Route path="admin" element={<AdminRoute />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </AuthGate>
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
