# PROJECT_CONTEXT — FinTra

## Estado atual (2026-08-16)

Projeto recém-criado. Recebida a Foundation completa do usuário (`docs/foundation/`, 26 arquivos: visão, PRD, arquitetura, modelo de dado, agentes, roadmap, regras, dashboard spec, privacidade/LGPD, Open Finance, segurança) mais um mockup visual (`docs/foundation/reference_mockup.png`, marca "Rhoney") e uma demo estática de dashboard (`docs/foundation/reference_dashboard_demo/index.html`, dado fictício).

Scaffold técnico criado: React + Vite + TypeScript + Tailwind CSS (v4, via `@tailwindcss/vite`), repositório `github.com/RonaldoRhoney/FinTra`. Nenhuma tela funcional além de um placeholder "Em construção". Nenhum Supabase, autenticação, schema de dado ou deploy configurados ainda.

## Decisões já tomadas nesta fase

- **FinTra é produto irmão distinto do FinWise** (`Controle-Financeiro-Pessoal/`), não uma v2 dele e não o substitui — repositório e (quando existir) Supabase próprios. Confirmado pelo usuário em 2026-08-16.
- **Posicionamento de marketing entre FinTra e FinWise ainda não definido** — não bloqueia o técnico, mas não presuma um público-alvo específico até o usuário decidir.
- **Stack**: React/Vite/TS/Tailwind + Supabase + Vercel, alinhado aos produtos RhoneyInc mais recentes (KnowRa, VoaRadar, VagaLume) — a Foundation original não especificava framework, então essa é uma escolha de consistência de família, não um requisito do usuário. Pode ser revisitada se ele preferir outra coisa.
- **Open Finance é BLOCKER**, não item de V0.1–V0.5 — ver `CLAUDE.md` §3.4 e `docs/foundation/open-finance/PARTICIPATION_MODEL.md`.
- Documentos da Foundation preservados integralmente em `docs/foundation/` como fonte de verdade original; `CLAUDE.md`/`PRD.md`/`ROADMAP.md` na raiz são a tradução pro formato padrão da família — nunca a única fonte.

## V0.1 implementado (2026-08-16), aguardando Supabase real pra validar ponta a ponta

Aprovado pelo usuário e implementado no mesmo dia:

- **Schema** (`supabase/migrations/0001_v01_schema.sql`): `profiles`, `accounts`, `transaction_categories`, `transactions`, `budgets`, `goals`, `goal_contributions`. RLS em todas, políticas `user_id = auth.uid()`, sem grant pra `anon`. Trigger `handle_new_fintra_user` cria `profile` + 8 categorias padrão (Salário, Outras entradas, Moradia, Alimentação, Transporte, Lazer, Saúde, Outros) no cadastro — cobre login social e email/senha igual (mesmo padrão do VoaRadar DEC-116).
- **Financial Engine** (`src/engine/financialEngine.ts`): puro e determinístico, sem IA — `calculateBalance`, `summarizePeriod`, `calculateSavingsRate`, `aggregateByCategory`, `calculateBudgetProgress`, `calculateGoalProgress`. 13 testes (`financialEngine.test.ts`), cobrindo renda zero, categoria vazia, meta ultrapassada, orçamento estourado.
- **Auth**: email/senha via Supabase Auth (`AuthProvider.tsx`), sem login social ainda (V0.1 não pedia).
- **CRUD completo**: Contas, Transações, Categorias, Orçamentos, Metas (com contribuição), todas as telas em `src/pages/`, dados via `src/lib/repositories.ts`.
- **Dashboard**: patrimônio, entradas/saídas/saldo do mês, taxa de economia, gastos por categoria — tudo calculado a partir de dado real do usuário via Financial Engine, nunca mockado.
- Build, `npm test` (13/13) e `oxlint` limpos.

**Bloqueado até o usuário criar o projeto Supabase e passar `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`**: aplicar a migration num banco real, testar RLS com 2 usuários de verdade, validar o fluxo de cadastro→categorias padrão→dashboard ponta a ponta, e então fazer o primeiro deploy (Vercel, mesmo padrão dos demais produtos).

## Próximo passo

Assim que o Supabase existir: aplicar `supabase/migrations/0001_v01_schema.sql`, configurar `.env` local a partir de `.env.example`, testar o fluxo real (cadastro, RLS entre 2 usuários, CRUD, dashboard) e então deploy.
