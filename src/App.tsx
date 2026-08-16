import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppDataProvider } from "./features/data/AppDataProvider";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";
import { AccountsPage } from "./pages/AccountsPage";
import { AuthPage } from "./pages/AuthPage";
import { BudgetsPage } from "./pages/BudgetsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalsPage } from "./pages/GoalsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-ink-900/50">Carregando…</p>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return <AppDataProvider>{children}</AppDataProvider>;
}

function App() {
  return (
    <BrowserRouter>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
