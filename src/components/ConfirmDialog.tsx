import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  function handle(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 fintra-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-800 p-6 shadow-xl">
            <h2 className="text-base font-semibold text-ink-900 dark:text-slate-100">{state.options.title}</h2>
            {state.options.description && (
              <p className="mt-2 text-sm text-ink-900/60 dark:text-slate-400">{state.options.description}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handle(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-900/70 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {state.options.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => handle(true)}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {state.options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de um ConfirmProvider.");
  return ctx.confirm;
}
