-- FinTra V0.7 — Alerts
-- Persiste os insights gerados pelo Financial Engine (V0.2) pra o usuário
-- ver/marcar como lido/descartar, em vez de recalcular do zero (e repetir
-- o mesmo aviso trivialmente) toda vez que o dashboard abre.
-- docs/foundation/02_PRD.md: "Somente alertas relevantes, contextualizados
-- e acionáveis" — dedupe por dedupe_key evita spam do mesmo aviso.

create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('category_spike', 'anomaly', 'negative_cash_flow', 'goal_off_track')),
  dedupe_key text not null,
  payload jsonb not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists alerts_user_id_idx on public.alerts(user_id);
create index if not exists alerts_user_dedupe_idx on public.alerts(user_id, dedupe_key, created_at);

alter table public.alerts enable row level security;

create policy "alerts_all_own"
  on public.alerts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.alerts from anon;
