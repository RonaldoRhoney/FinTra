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

## DEC-003 — Auditoria da V0.1 e melhorias de fonte, usabilidade e fluidez (2026-08-16)

Pedido do usuário: "melhore a fonte e usabilidade, assim também como tornar o app mais fluido e dinâmico, faça uma auditoria dessa primeira versão antes de seguirmos".

**Auditoria — achados**:
1. Todos os 6 formulários (Contas, Transações, Categorias, Orçamentos, Metas, login) usavam só `placeholder`, sem `<label>` — falha de acessibilidade (leitor de tela não identifica o campo) e de usabilidade (a dica some ao digitar).
2. Nenhum botão "Remover" pedia confirmação — clique errado apagava dado real na hora.
3. `GoalsPage` usava `window.prompt()` nativo do navegador pra contribuir com meta — quebrava a identidade visual no meio do fluxo.
4. Estado de carregamento era só texto "Carregando…", sem esqueleto — sensação de app travado.
5. Erros apareciam como texto vermelho estático, sem se auto-dispensar nem hierarquia visual.
6. Fonte do sistema genérica, sem identidade tipográfica.
7. Zero transição/microinteração — troca de tema, navegação e hover eram abruptos.
8. Sem foco visível customizado (dependia do outline default do navegador).

**Corrigido**:
- Fonte **Inter Variable** self-hosted via `@fontsource-variable/inter` (pacote npm, zero requisição externa em runtime — mantém ZERO-COST-FIRST e privacy-by-design, nada de Google Fonts via CDN).
- `Field`/`TextInput`/`Select` (`src/components/Field.tsx`): todo formulário agora tem `<label>` de verdade associado ao input.
- `ConfirmDialog` (`src/components/ConfirmDialog.tsx`): modal de confirmação reutilizável (`useConfirm()`) aplicado em todas as exclusões (contas, transações, categorias, orçamentos, metas).
- `Toast` (`src/components/Toast.tsx`): notificação transiente (`useToast()`) substituindo o texto de erro estático nos formulários.
- `GoalsPage`: `window.prompt()` trocado por um modal próprio (`ContributeModal`) consistente com o resto do app.
- `Skeleton`/`DashboardSkeleton` (`src/components/Skeleton.tsx`): esqueleto de carregamento no lugar do texto "Carregando…" na tela inicial.
- Transições: `:focus-visible` customizado (outline verde da marca), transição de cor/borda global (150ms), fade-in suave ao entrar em cada tela (`fintra-fade-in`), barras de progresso (categoria/orçamento/meta) animam a largura (500ms) em vez de pular direto pro valor final, hover com leve elevação (`shadow-md`) nos cards e `active:scale-[0.98]` nos botões principais.

Build, 13/13 testes e lint continuam limpos. Deploy de produção atualizado.

## DEC-004 — V0.2: Financial Engine completo e seção de Insights (2026-08-16)

Pedido do usuário: "vamos seguir para o próximo passo" — plano apresentado e aprovado ("Aprovado, pode implementar tudo") antes de codificar, como manda `CLAUDE.md` §2.

**Implementado em `financialEngine.ts`** (continua 100% determinístico, sem IA — `docs/foundation/01_ZERO_COST_FIRST.md`):
- `aggregateMonthlyHistory`: histórico mês a mês (entradas/saídas/líquido), não só o mês corrente.
- `analyzeCategoryTrends`: compara o mês de referência com a média dos últimos N meses por categoria — exige pelo menos 2 meses de histórico prévio antes de calcular variação (`hasEnoughHistory`), pra não gerar insight enganoso com dado insuficiente.
- `detectAnomalies`: sinaliza transação isolada muito acima da média histórica da própria categoria — exige `minSamples` transações anteriores (padrão 3) antes de sinalizar qualquer coisa.
- `estimateSavingsCapacity` / `projectCashFlow`: capacidade média de economia e projeção linear de saldo futuro, ambos retornando `hasEnoughHistory=false` (em vez de projetar com base em 0 ou 1 mês de dado) quando não há histórico suficiente.
- `projectGoalCompletion`: aporte mensal necessário pra bater o prazo da meta (`targetDate`) e projeção de conclusão baseada no ritmo histórico real de contribuição daquela meta especificamente — nunca confunde fato com estimativa (`docs/foundation/05_AGENTS.md`): sem pelo menos 2 meses distintos de contribuição, `projectedCompletionMonths` fica `null`.
- `generateInsights`: junta tudo isso em uma lista priorizada. Retorna dados estruturados (`Insight`), não texto pronto — a tela monta a mensagem via i18n (`tf()`, nova função de interpolação `{placeholder}` no `I18nProvider`), pra não hardcodar string em português dentro do motor. "Meta fora do ritmo" só dispara quando o aporte necessário excede a capacidade de economia **real e conhecida** do usuário — nunca com capacidade desconhecida (`savingsCapacity.hasEnoughHistory=false`), pra não gerar alarme falso.

**Dashboard**: nova seção "Insights prioritários" (já prevista em `docs/foundation/08_DASHBOARD_SPEC.md`), acima de "Gastos por categoria".

**Testado**: 29/29 testes (16 novos), cobrindo os casos de "histórico insuficiente" de cada função — é a parte mais importante de testar aqui, porque é onde a Foundation pede mais cuidado ("regra de qualidade de insight": relevância, impacto, confiança, urgência, contexto).

Build, lint e deploy de produção atualizados.

## DEC-005 — V0.3: projeção de meta na própria tela de Metas (2026-08-16)

Pedido do usuário: "siga o fluxo natural, v0.3" — escopo já descrito e implicitamente aprovado na conclusão do DEC-004 (goals já existiam desde o V0.1; o que faltava era só cruzar a projeção do motor com a tela).

**Implementado**: `GoalsPage` trocou `calculateGoalProgress` por `projectGoalCompletion` (superset, mesma forma). Cada card de meta agora mostra, quando aplicável:
- Prazo definido (`target_date`), se a meta tiver um.
- Aporte mensal necessário pra bater o prazo (`requiredMonthlyContribution`) — só aparece quando há prazo e a meta não está completa.
- Projeção "nesse ritmo, você bate a meta em X meses" (`projectedCompletionMonths`) — só aparece quando há pelo menos 2 meses distintos de contribuição registrados; sem isso, fica em silêncio em vez de arriscar um número (mesmo cuidado do DEC-004).

Nenhuma mudança de schema — é só o motor do V0.2 (já testado) alimentando uma tela que já existia.

Build, 29/29 testes e lint continuam limpos. Deploy de produção atualizado.

## DEC-006 — V0.4: primeiro agente de IA (Financial Analyst), via Groq (2026-08-16)

Pedido do usuário: "siga para v0.4". Diferente das versões anteriores, essa envolve a primeira dependência de LLM do produto — apliquei a mesma disciplina do VoaRadar (DATA_SOURCES-style): pesquisei de verdade antes de decidir, não assumi.

**Investigação real (WebSearch + WebFetch, 2026-08-16)**: comparei Gemini API free tier x Groq free tier como candidatos zero-cost. Achado decisivo: o Gemini free tier declara publicamente que os prompts podem ser usados pra treinar produtos do Google; o Groq, no tier gratuito e no pago, não retém nem treina com input/output por padrão, e permite Zero Data Retention. Pra um app financeiro, isso pesa mais que limite de requisição — `docs/foundation/security/AI_DATA_POLICY.md` já pede minimizar o que chega ao modelo, mas a política de retenção do provedor é uma camada de risco separada da minimização. **Decisão do usuário, com essa informação em mãos: Groq.**

Modelo verificado ao vivo na doc oficial (`console.groq.com/docs/models`, não assumido de memória): `llama-3.3-70b-versatile`, ativo em produção no momento da implementação.

**Escopo**: só o Financial Analyst (dos 6 agentes do PRD) — "Build small. Validate. Improve." (`CLAUDE.md`), decisão explícita do usuário de não implementar os 6 de uma vez.

**Arquitetura**:
- `api/financial-analyst.ts`: Vercel Edge Function. `GROQ_API_KEY` só existe aqui, nunca no frontend (`CLAUDE.md` §13). Valida a sessão do usuário chamando `GET /auth/v1/user` do próprio Supabase antes de gastar uma chamada de IA — sem isso, qualquer um poderia bater no endpoint.
- Contexto enviado ao modelo é só dado agregado do Financial Engine (saldo, histórico mensal, tendência por categoria) — nunca a lista de transações cruas, nunca nome/e-mail do usuário (`docs/foundation/security/AI_DATA_POLICY.md`: "Evitar: banco completo → LLM").
- Prompt de sistema (`docs/foundation/05_AGENTS.md`): nunca inventar dado fora do contexto, separar fato de estimativa, no máximo 3 observações curtas e acionáveis, nunca prometer retorno de investimento.
- Resiliência (`docs/foundation/03_ARCHITECTURE.md`): se a Groq falhar, a UI mostra "agente indisponível" sem quebrar o resto do dashboard — cálculo/insight determinístico do V0.2 continua funcionando exatamente igual.
- Frontend: `FinancialAnalystCard` no dashboard (posição do "Seu Agente Financeiro" do mockup original), sob demanda (botão), não automático a cada carregamento — evita gastar chamada de IA sem necessidade.

**Testado ao vivo em produção**: endpoint rejeita requisição sem token (401) e com token inválido (401); com um usuário de teste real (criado e removido depois do teste), a chamada completa retornou uma análise de verdade em português, coerente com o dado agregado enviado, citando o aumento real na categoria simulada.

Build, 29/29 testes e lint continuam limpos.

## DEC-007 — V0.4: segundo agente (Savings Coach) + base compartilhada de agentes (2026-08-16)

Pedido do usuário: "siga o fluxo natural" — continuação direta do V0.4 em andamento (DEC-006), próximo agente do PRD.

**Refatoração pra evitar duplicação** (2 agentes já formam um padrão real, não é abstração prematura): lógica compartilhada de auth+chamada à Groq+resiliência movida pra `api/_shared/agent.ts` (`runAgent`), cada endpoint (`api/financial-analyst.ts`, `api/savings-coach.ts`) só define seu próprio prompt de sistema por idioma. No frontend, `AgentCard` genérico substitui o `FinancialAnalystCard` específico; `src/lib/agents.ts` virou um `callAgent(endpoint, payload)` único.

**Savings Coach** (`docs/foundation/05_AGENTS.md`): encontra oportunidades de economia e quantifica o impacto. Contexto = tendência por categoria + progresso de orçamento do mês (`calculateBudgetProgress`), ambos já calculados no dashboard — nenhuma chamada nova ao banco. Prompt de sistema exige que toda sugestão venha com valor estimado de economia (ex: "R$ 120/mês"), mesma regra do PRD ("Savings Coach... quantifica impacto").

Dashboard agora tem os dois agentes lado a lado (grid 2 colunas), cada um independente — falha de um não afeta o outro.

**Testado ao vivo em produção**: 401 sem token; com usuário de teste real, resposta coerente com valores de economia calculados a partir do dado simulado (categoria acima do orçamento identificada corretamente, com valor estimado de corte).

Build, 29/29 testes e lint continuam limpos.

## DEC-008 — V0.4: terceiro agente (Behavior Agent) (2026-08-16)

Pedido do usuário: "siga o fluxo natural" — terceira continuação direta do V0.4.

**Behavior Agent** (`docs/foundation/05_AGENTS.md`): detecta padrões, mudanças e gastos fora do comportamento histórico. Contexto = anomalias já detectadas (`detectAnomalies`) + tendência por categoria + histórico mensal — tudo reaproveitado do que o dashboard já calcula, nenhuma chamada nova ao banco. Prompt de sistema inclui uma regra específica desse agente: se não houver anomalia nem variação relevante no contexto, dizer isso claramente em vez de inventar um padrão (mesmo cuidado de "não confundir fato com estimativa" do `05_AGENTS.md`, aplicado ao caso de "nada de anormal aconteceu").

Reaproveitou 100% o `runAgent()` compartilhado (DEC-007) — só o prompt de sistema é novo. Dashboard passa a ter 3 agentes lado a lado (`lg:grid-cols-3`).

**Testado em produção**: endpoint rejeita requisição sem token (401), confirmando o deploy e o roteamento corretos. **Não repeti o teste de ponta a ponta com usuário autenticado real desta vez** — o Supabase atingiu rate limit de envio de e-mail de confirmação depois dos testes anteriores (DEC-006/DEC-007) na mesma sessão. Como o `behavior-agent.ts` reaproveita exatamente a mesma função `runAgent()` já validada duas vezes (auth, chamada à Groq, formato de resposta) e só troca o conteúdo do prompt, o risco residual é baixo — mas fica registrado que essa chamada específica não foi confirmada ao vivo com uma resposta real da IA, diferente das duas anteriores.

Build, 29/29 testes e lint continuam limpos.
