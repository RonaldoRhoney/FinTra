# Decisões — FinTra

## DEC-001 — V0.1 implementado, deploy de produção e login com Google (2026-08-16)

Pedido do usuário: aprovar e implementar o V0.1 (ver `PROJECT_CONTEXT.md`), depois "faça o deploy desde da primeira versão, crie url, login com google" — querendo vivenciar a evolução do produto passo a passo.

**Implementado**:
- Schema `supabase/migrations/0001_v01_schema.sql` aplicado no Supabase real (projeto `effbaiizowiwcglsrxcn`) — `profiles`, `accounts`, `transaction_categories`, `transactions`, `budgets`, `goals`, `goal_contributions`, todas com RLS. Trigger `handle_new_fintra_user` cria profile + 8 categorias padrão no cadastro.
- **RLS validada ao vivo**: 2 usuários simulados via `SET LOCAL ROLE authenticated` + `request.jwt.claims` (não só teoria) — usuário 2 não enxergou nenhuma linha criada pelo usuário 1 em `accounts`. Usuário de teste real (cadastro via API) confirmou o trigger populando profile/categorias corretamente; removido depois do teste.
- Financial Engine, auth (e-mail/senha) e CRUD completo (Contas, Transações, Categorias, Orçamentos, Metas) — ver commit `4cae80e`.
- **Login com Google**: novo OAuth Client "FinTra Supabase" criado pelo usuário no projeto Google Cloud `meupet-501512` (mesmo projeto usado por MeuPet/KnowRa, mas cada produto tem seu próprio Client ID dentro dele — não existe um Client único compartilhado entre produtos, diferente do que a memória inicial sugeria). Callback `https://effbaiizowiwcglsrxcn.supabase.co/auth/v1/callback` autorizado no Google Cloud. Auth do Supabase (Site URL, redirect URLs, provider Google) configurado via Management API usando um Personal Access Token gerado pelo usuário — nenhum clique manual no dashboard do Supabase foi necessário além da geração do token.
- **Deploy de produção**: Vercel, domínio `fintra.rhoneyinc.com` (mesmo padrão de domínio dos demais produtos — `vercel domains add`, sem mexer em DNS externo pois `rhoneyinc.com` já é registrado no próprio Vercel). `ssoProtection` desativado via API (mesmo gotcha documentado no VoaRadar DEC-118 — todo projeto novo da Vercel nasce com isso ligado).
- **Hub RhoneyInc**: FinTra registrado na tabela `softwares` com `status='em_desenvolvimento'` (mesmo critério do VoaRadar — "no ar" ainda não é "pronto pro público": só CRUD manual, nenhuma integração real, sem Open Finance). Ícone `fintra-icon.svg` criado, link adicionado no rodapé estático do hub.

**Gotcha de segurança encontrado e corrigido**: durante a configuração do Google Cloud Console, um arquivo `client_secret_*.json` (baixado automaticamente pelo navegador do usuário) apareceu dentro da pasta do repositório, com o Client Secret em texto puro. Removido do disco antes de qualquer commit e adicionado ao `.gitignore` (`client_secret_*.json`) para prevenir recorrência — nunca foi commitado.

**Pendências que continuam de pé**: `docs/foundation/open-finance/PARTICIPATION_MODEL.md` continua BLOCKER (nenhuma integração Open Finance); `LEGAL_BASIS_MATRIX.md` sem validação jurídica; sem `privacidade.html`/`termos.html`/`contato.html` publicados ainda (mesma lacuna já registrada no VoaRadar DEC-119); sem agentes de IA (V0.4 do roadmap).

## DEC-002 — Admin padrão, painel de métricas, tema claro/escuro e i18n (2026-08-16)

Pedido do usuário: "considere rhoneyinc@gmail.com o ADM como padrão e crie o painel adm já com as métricas, crie também o botão para o usuário deixar no modo claro ou escuro, idiomas em português (padrão), inglês, espanhol por enquanto".

**Admin padrão** (skill `admin-padrao`): `profiles.role` (`user`/`admin`) + trigger que promove `rhoneyinc@gmail.com` automaticamente no cadastro, qualquer método de login. A conta já existia no projeto (login Google feito durante os testes anteriores) e foi promovida retroativamente pela própria migration.

**Painel admin — decisão de privacidade**: em vez de dar à conta admin acesso RLS irrestrito a todas as transações de todos os usuários (o que contradiria `docs/foundation/privacy/PRIVACY_BY_DESIGN.md` — minimização), o painel usa uma função Postgres `SECURITY DEFINER` (`admin_platform_metrics()`) que devolve só agregados: total de usuários/contas/transações, volume de entradas/saídas, novos usuários e transações nos últimos 7 dias. A função verifica `role='admin'` internamente e rejeita qualquer outro usuário — testado com sucesso (usuário comum simulado recebeu `ERROR: Acesso restrito a administradores.`). Nenhuma transação individual de nenhum usuário é exposta ao admin por este painel.

**Tema claro/escuro**: `ThemeProvider` com classe `.dark` manual no `<html>` (Tailwind v4 `@custom-variant`), persistido em `localStorage`, respeita `prefers-color-scheme` como padrão inicial. Toggle na barra lateral.

**i18n PT/EN/ES**: dicionário de traduções próprio (`src/features/i18n/`), sem biblioteca externa — decisão ZERO-COST-FIRST e "não criar estruturas complexas antes de necessárias" (`CLAUDE.md` do ecossistema), já que 3 idiomas fixos não justificam um motor de i18n completo. Português é o padrão; preferência salva em `localStorage`. Aplicado em todas as telas do V0.1 (login, dashboard, contas, transações, categorias, orçamentos, metas, admin).

Build, 13/13 testes e lint continuam limpos. Deploy de produção atualizado.
