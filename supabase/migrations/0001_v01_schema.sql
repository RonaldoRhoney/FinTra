-- FinTra V0.1 — Foundation
-- Entidades sem Open Finance (docs/foundation/open-finance/PARTICIPATION_MODEL.md é
-- BLOCKER até decisão jurídica): tudo aqui é entrada manual do usuário.

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- 2. ACCOUNTS
-- ============================================================
create table if not exists public.accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution_name text,
  account_type text not null default 'corrente'
    check (account_type in ('corrente', 'poupanca', 'carteira', 'investimento', 'outro')),
  initial_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);

alter table public.accounts enable row level security;

create policy "accounts_all_own"
  on public.accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 3. TRANSACTION CATEGORIES
-- ============================================================
create table if not exists public.transaction_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category_type text not null check (category_type in ('income', 'expense')),
  color text not null default '#16a34a',
  created_at timestamptz not null default now(),
  unique (user_id, name, category_type)
);

create index if not exists transaction_categories_user_id_idx on public.transaction_categories(user_id);

alter table public.transaction_categories enable row level security;

create policy "transaction_categories_all_own"
  on public.transaction_categories for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  category_id uuid references public.transaction_categories(id) on delete set null,
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_account_id_idx on public.transactions(account_id);
create index if not exists transactions_occurred_at_idx on public.transactions(occurred_at);

alter table public.transactions enable row level security;

create policy "transactions_all_own"
  on public.transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 5. BUDGETS (orçamento mensal por categoria)
-- ============================================================
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.transaction_categories(id) on delete cascade,
  reference_month text not null check (reference_month ~ '^\d{4}-\d{2}$'),
  limit_amount numeric(12,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, reference_month)
);

create index if not exists budgets_user_id_idx on public.budgets(user_id);

alter table public.budgets enable row level security;

create policy "budgets_all_own"
  on public.budgets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 6. GOALS
-- ============================================================
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  target_date date,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);

alter table public.goals enable row level security;

create policy "goals_all_own"
  on public.goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 7. GOAL CONTRIBUTIONS
-- ============================================================
create table if not exists public.goal_contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  contributed_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists goal_contributions_goal_id_idx on public.goal_contributions(goal_id);

alter table public.goal_contributions enable row level security;

create policy "goal_contributions_all_own"
  on public.goal_contributions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 8. NOVO USUÁRIO: profile + categorias padrão
-- Cobre cadastro via email/senha e via login social (qualquer um cria a
-- linha em auth.users sem passar pelo backend) — mesmo motivo do trigger
-- handle_new_user já usado no VoaRadar (DEC-116).
-- ============================================================
create or replace function public.handle_new_fintra_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.transaction_categories (user_id, name, category_type, color) values
    (new.id, 'Salário', 'income', '#16a34a'),
    (new.id, 'Outras entradas', 'income', '#0ea5e9'),
    (new.id, 'Moradia', 'expense', '#f97316'),
    (new.id, 'Alimentação', 'expense', '#eab308'),
    (new.id, 'Transporte', 'expense', '#3b82f6'),
    (new.id, 'Lazer', 'expense', '#a855f7'),
    (new.id, 'Saúde', 'expense', '#ef4444'),
    (new.id, 'Outros', 'expense', '#6b7280');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_fintra on auth.users;
create trigger on_auth_user_created_fintra
  after insert on auth.users
  for each row execute function public.handle_new_fintra_user();

-- ============================================================
-- 9. Isolamento: revoga acesso direto de anon (só via authenticated + RLS)
-- ============================================================
revoke all on public.profiles, public.accounts, public.transaction_categories,
  public.transactions, public.budgets, public.goals, public.goal_contributions
  from anon;
