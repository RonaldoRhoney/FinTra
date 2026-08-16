import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

const links = [
  { to: "/", label: "Visão Geral", end: true },
  { to: "/contas", label: "Contas" },
  { to: "/transacoes", label: "Transações" },
  { to: "/categorias", label: "Categorias" },
  { to: "/orcamentos", label: "Orçamentos" },
  { to: "/metas", label: "Metas" },
];

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-svh bg-[#f5f7fb]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-black/5 bg-white p-4">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-ink-900">
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
                  isActive ? "bg-fintra-500/10 font-medium text-fintra-500" : "text-ink-900/70 hover:bg-black/5"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-black/5 pt-4">
          <p className="truncate px-2 text-xs text-ink-900/50">{user?.email}</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-ink-900/70 hover:bg-black/5"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
