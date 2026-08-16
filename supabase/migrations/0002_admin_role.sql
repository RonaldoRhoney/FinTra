-- FinTra — Admin padrão RhoneyInc (skill admin-padrao)
-- rhoneyinc@gmail.com é sempre promovida a admin automaticamente, não
-- importa o método de login (mesmo padrão do VoaRadar DEC-116).

alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- Atualiza o trigger de novo usuário pra decidir o role na criação
create or replace function public.handle_new_fintra_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.email = 'rhoneyinc@gmail.com' then 'admin' else 'user' end
  );

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

-- Fallback documentado (skill admin-padrao §2): se rhoneyinc@gmail.com já
-- tiver se cadastrado antes desta migration, promove retroativamente.
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id and u.email = 'rhoneyinc@gmail.com' and p.role <> 'admin';

-- ============================================================
-- Métricas agregadas de plataforma — só admin, nunca dado bruto de
-- transação por usuário (Foundation privacy-by-design: minimização,
-- docs/foundation/privacy/PRIVACY_BY_DESIGN.md). RLS não é suficiente
-- aqui porque "admin vê todas as transações de todo mundo" seria o
-- oposto de minimização — em vez disso, uma function SECURITY DEFINER
-- devolve só contagens e somas, nunca a linha crua.
-- ============================================================
create or replace function public.admin_platform_metrics()
returns table (
  total_users bigint,
  total_accounts bigint,
  total_transactions bigint,
  total_income numeric,
  total_expenses numeric,
  new_users_7d bigint,
  new_transactions_7d bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.accounts),
    (select count(*) from public.transactions),
    (select coalesce(sum(amount), 0) from public.transactions where transaction_type = 'income'),
    (select coalesce(sum(amount), 0) from public.transactions where transaction_type = 'expense'),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    (select count(*) from public.transactions where created_at >= now() - interval '7 days');
end;
$$;

revoke all on function public.admin_platform_metrics() from public;
grant execute on function public.admin_platform_metrics() to authenticated;
