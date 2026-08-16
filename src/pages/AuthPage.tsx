import { useState, type FormEvent } from "react";
import { useAuth } from "../features/auth/AuthProvider";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

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
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink-900">FinTra</h1>
        <p className="mt-1 text-sm text-ink-900/60">
          {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
        </p>

        {signupDone ? (
          <p className="mt-6 rounded-lg bg-fintra-500/10 p-3 text-sm text-fintra-500">
            Cadastro criado! Confirme seu e-mail (se exigido) e faça login.
          </p>
        ) : (
          <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-fintra-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-fintra-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Cadastrar"}
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
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
