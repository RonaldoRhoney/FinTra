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

## DEC-009 — V0.4: Goal Agent, Planning Agent e Investment Education Agent — os 3 últimos agentes do PRD (2026-08-16)

Pedido do usuário: "siga com: Goal Agent, Planning Agent e Investment Education Agent" — os três de uma vez, fechando os 6 agentes do `docs/foundation/05_AGENTS.md`.

**Goal Agent**: avalia metas, prazo, progresso e risco de atraso. Contexto = `goalProjections` (já calculado pelo V0.2/V0.3) + `savingsCapacity`. Só sinaliza meta como "em risco" quando o aporte necessário excede a capacidade de economia real — se nada estiver em risco, o prompt instrui o modelo a dizer isso em vez de inventar preocupação.

**Planning Agent**: simula cenários e distribui a capacidade de economia entre as metas existentes. Contexto = `savingsCapacity` + `goalProjections` + `cashFlow`. Se `savingsCapacity.hasEnoughHistory=false`, o prompt instrui a admitir que ainda não há dado suficiente pra simular, em vez de inventar um número — mesmo padrão de honestidade dos agentes anteriores.

**Investment Education Agent — o mais delicado dos 6** (`docs/foundation/00_PRODUCT_VISION.md`: "Nenhuma recomendação regulada de investimento sem validação jurídica/regulatória"). Prompt de sistema com restrições absolutas e explícitas: nunca recomendar comprar/vender/alocar em ativo, produto, corretora ou instituição específica; nunca garantir retorno/rentabilidade; nunca calcular ou sugerir um valor "ideal" de investimento (só explica a capacidade de aporte que já está no contexto, sem indicar destino); sempre deixar claro que é conteúdo educativo geral, não consultoria personalizada. A UI reforça isso com um disclaimer visível abaixo de toda resposta desse agente (`AgentCard` ganhou um `disclaimerKey` opcional). Como não existe integração de corretora nem ação "comprar" em nenhum lugar do produto, mesmo que o modelo cite algo indevido o resultado continua sendo só texto exibido, nunca uma ação executável.

Dashboard agora tem os 6 agentes do PRD completos, todos reaproveitando o `runAgent()` compartilhado (DEC-007).

**Testado em produção**: os 4 endpoints da sessão (behavior-agent incluso) responderam 401 sem token, confirmando deploy e roteamento corretos. **Teste de ponta a ponta com resposta real da IA não foi possível repetir**: o rate limit de e-mail do Supabase seguiu ativo, e uma tentativa de contornar criando usuário direto via SQL (`insert into auth.users` com senha via `pgcrypto`) quebrou o schema esperado pelo GoTrue (erro 500 "Database error querying schema" no login) — o usuário corrompido foi removido imediatamente, sem deixar resíduo. Fica registrado com transparência: a validação desses 4 endpoints se apoia no `runAgent()` já comprovado 2 vezes com sucesso (DEC-006/007), não em uma chamada real nova.

Build, 29/29 testes e lint continuam limpos. Deploy de produção atualizado.

## DEC-010 — V0.5: página de Relatórios (2026-08-16)

Pedido do usuário: "vamos implementar v0.5". A Foundation é enxuta sobre o escopo de "Reports" (só cita a palavra em `02_PRD.md`/`03_ARCHITECTURE.md`/`04_DATA_MODEL.md`, sem detalhar) — apresentei um plano concreto antes de codificar (`CLAUDE.md` §2) e perguntei especificamente sobre visualização (gráfico CSS vs. biblioteca nova). **Decisão do usuário: gráfico simples em CSS, sem dependência nova.**

**Escopo decidido**: relatório calculado sob demanda a partir do que já existe — sem criar as tabelas `reports`/`financial_snapshots` do modelo de dado da Foundation (isso fica pra quando houver pedido real de relatório salvo/exportado, ex: PDF ou agendamento — escopo maior, não pedido agora).

**Implementado**:
- `previousPeriodRange` e `calculateVariation`, novas funções puras no Financial Engine (com testes) — período anterior de mesma duração e variação percentual segura contra divisão por zero.
- `ReportsPage`: seletor de período (7 dias / 30 dias / este mês / mês passado), resumo com comparação "vs. período anterior", evolução mensal (3/6/12 meses) em gráfico de barras feito só com `div`+Tailwind (sem lib nova), gastos por categoria do período — tudo reaproveitando funções do Financial Engine já testadas (V0.2).
- Novo item de navegação "Relatórios".

Build, 34/34 testes (5 novos) e lint continuam limpos. Deploy de produção atualizado.

## DEC-011 — V0.6: Open Finance investigado e confirmado inviável sem custo (2026-08-16)

Pedido do usuário: "siga para v0.6". `PARTICIPATION_MODEL.md` já marca Open Finance como BLOCKER explícito ("Claude Code NÃO deve decidir isso sozinho") — nenhuma implementação foi feita.

**Investigação real** (WebSearch + WebFetch, documento completo em `docs/foundation/open-finance/PARTICIPATION_MODEL_INVESTIGATION.md`): integradores certificados no Brasil não são zero-custo — Pluggy a partir de ~R$2.500/mês, Belvo ~R$6.000/mês. A oferta gratuita "Meu Pluggy" foi verificada direto na página oficial da Pluggy: é genuinamente grátis, mas **explicitamente restrita a uso pessoal, uma pessoa conectando as próprias contas (um CPF)** — citação direta encontrada: *"Para atender clientes, conectar contas de múltiplos CPFs ou transformar em um produto comercial, veja os planos [pagos]."* Como o FinTra é multiusuário por natureza, esse caminho gratuito não se aplica, independente de o produto gerar receita.

**Conclusão**: não existe caminho zero-custo real pra Open Finance no Brasil aplicável ao FinTra. Os únicos caminhos são pagar um integrador ou a RhoneyInc virar participante direto do Open Finance (autorização do Banco Central, fora do escopo de uma decisão de produto isolada). Nenhuma das 8 perguntas originais do `PARTICIPATION_MODEL.md` foi respondida — essa investigação só eliminou a hipótese "existe uma opção grátis que resolve isso".

**V0.6 continua BLOQUEADO.** O usuário pediu pra pausar a sessão logo depois dessa investigação ("pare por enquanto") — sem decisão tomada sobre pagar um integrador ou seguir pro V0.7 ainda.

## DEC-012 — V0.6: segunda rodada de investigação (mais profunda) confirma o mesmo bloqueio (2026-08-16)

Pedido do usuário: "recomece v0.6" — esclarecido via pergunta: refazer a investigação do zero, com mais profundidade, antes de aceitar a conclusão do DEC-011.

**Segunda rodada** (WebFetch direto nas páginas oficiais, não busca genérica): confirmado o preço exato da Pluggy pro plano "Dados" (R$ 2.500/mês, `pluggy.ai/precos`) e uma frase ainda mais explícita restringindo o "Conector 200" (sucessor do "Meu Pluggy") a uso pessoal, "não recomendado para produtos comerciais reais". Checados mais dois provedores (Celcoin, Klavi) — nenhum divulga preço público, ambos exigem contato comercial direto, sem indício de caminho gratuito. Detalhe completo em `docs/foundation/open-finance/PARTICIPATION_MODEL_INVESTIGATION.md`.

**Conclusão confirmada com duas fontes independentes**: não existe caminho zero-custo sustentável pra Open Finance de leitura de dados no Brasil pra um produto multiusuário, hoje.

**Decisão final do usuário**: pausar V0.6 (sem contratar integrador pago) e seguir o roadmap a partir do V0.7 (Alerts).

## DEC-013 — V0.7: Alertas persistidos (2026-08-16)

Pedido do usuário: "siga para v0.7". Plano apresentado e aprovado antes de codificar: alertas persistidos (não só recalculados a cada carregamento como os "Insights prioritários" do V0.2), deduplicados por 7 dias, página própria + contador na sidebar.

**Implementado**:
- Migration `0003_alerts.sql`: tabela `alerts` (`kind`, `dedupe_key`, `payload` jsonb, `status` unread/read/dismissed), RLS por `user_id`, sem grant pra `anon`. **RLS validada ao vivo** com usuário real e usuário simulado — outro usuário não enxerga nada.
- `Insight` (motor V0.2) ganhou `categoryId`/`goalId` — necessários pra montar uma `dedupe_key` estável (`insightDedupeKey`, testada), já que antes só existia `categoryName`/`goalName` (texto, não identificador confiável).
- `useAlertSync`: hook que roda no dashboard, compara os insights recalculados contra os `dedupe_key` já usados nos últimos 7 dias, e só persiste os que são genuinamente novos — evita reabrir o mesmo alerta toda vez que a página carrega (`docs/foundation/02_PRD.md`: "só alertas relevantes... evento trivial não gera notificação").
- `formatInsight` extraído do `DashboardPage` pra um módulo compartilhado (`features/alerts/formatInsight.ts`), reaproveitado pela nova `AlertsPage` — mesma formatação i18n nos dois lugares, sem duplicar.
- `AlertsPage`: lista alertas, marcar como lido, descartar. Contador de não lidos na sidebar, ao lado do item "Alertas".

Build, 38/38 testes (4 novos) e lint continuam limpos. Deploy de produção atualizado.

## DEC-014 — V0.8: WhatsApp investigado, bloqueado por falta de CNPJ; só arquitetura preparada (2026-08-16)

Pedido do usuário: "seguimos para v0.8". Mesma disciplina do V0.4/V0.6: investiguei o custo/viabilidade real antes de propor implementação.

**Investigação real (WebSearch)**: diferente do Open Finance, o WhatsApp (Meta Cloud API) **tem** um caminho quase-zero-custo — acesso técnico à API é grátis, 1.000 conversas de serviço grátis/mês, mensagens iniciadas pelo usuário dentro de 24h são ilimitadas. Conversas de alerta (categoria "Utilidade") custam R$0,06–0,09 só acima da cota grátis. Mudança já anunciada pra 1º/out/2026: mensagem de serviço passa a custar R$0,035 mesmo dentro da janela de 24h hoje grátis — vale monitorar antes de dimensionar custo esperado.

**Mas exige pré-requisito de negócio, não técnico**: CNPJ verificado no Meta Business Manager, número de telefone dedicado, processo de verificação de 3–7 dias úteis. **Usuário confirmou: RhoneyInc/FinTra não tem CNPJ verificado ainda.** Sem isso, nenhuma implementação real é possível nesta sessão.

**Decisão do usuário**: preparar só a arquitetura, sem conectar nada real. Criado `docs/NOTIFICATION_PROVIDER.md` (mesmo espírito de `docs/foundation/open-finance/PROVIDER_ABSTRACTION.md`: contrato antes de implementação, nenhum endpoint inventado) e a interface `NotificationProvider` (`src/features/notifications/notificationProvider.ts`) — reaproveita 100% o que o V0.7 já persiste (`alerts.kind`/`alerts.payload`), sem implementação concreta, sem chave real. `AlertKind` extraído como tipo nomeado em `types/finance.ts` pra dar suporte a essa interface.

**V0.8 continua BLOQUEADO** até o CNPJ ser verificado no Meta Business Manager — quando isso acontecer, retomar por `docs/NOTIFICATION_PROVIDER.md`.

Build, 38/38 testes e lint continuam limpos. Deploy de produção atualizado (arquivo novo, sem uso ainda).

## DEC-015 — V0.9: CFO IA — briefing unificado sintetizando os 6 agentes (2026-08-16)

Pedido do usuário: "siga para v0.9". A Foundation não tem nenhuma linha de contexto sobre "CFO IA" além do nome no roadmap (`06_ROADMAP.md`) — apresentei uma interpretação e pedi confirmação antes de codificar (`CLAUDE.md` §2), já que era pura inferência, não requisito documentado.

**Interpretação aprovada pelo usuário**: em vez dos 6 agentes do V0.4 continuarem como cards isolados que a pessoa aciona um por um, o CFO IA sintetiza a mesma responsabilidade de todos eles numa única chamada, devolvendo um briefing priorizado (até 5 observações, mais importante primeiro) — não uma interface de chat livre (opção descartada, escopo bem maior).

**Implementado**:
- `api/cfo-agent.ts`: reaproveita `runAgent()` (DEC-007). Prompt de sistema herda **todas** as restrições dos 6 agentes individuais, incluindo as mais rígidas (Investment Education Agent) — nunca recomenda ativo/produto específico, nunca garante retorno, nunca calcula valor "ideal" de investimento, mesmo estando numa síntese mais ampla. Termina sempre deixando claro que é análise automatizada, não consultoria personalizada.
- Recebe numa única chamada todo o contexto que os 6 agentes recebem separados (saldo, histórico mensal, tendência por categoria, orçamento, anomalias, projeção de metas, capacidade de economia, fluxo de caixa) — uma chamada de IA em vez de até 6, mais barato e mais rápido.
- `AgentCard` ganhou `subtitleKey` e `highlight` (visual destacado — gradiente sutil da cor da marca, botão preenchido em vez de outline) pra diferenciar o CFO dos agentes individuais sem duplicar componente.
- Dashboard: CFO IA no topo, acima da grade dos 6 agentes — headline da tela, não mais um card igual aos outros.

**Testado ao vivo em produção**: com usuário de teste real (criado e removido), o CFO sintetizou corretamente 5 pontos priorizados a partir de dado simulado — orçamento estourado, capacidade de economia, meta em risco de atraso e projeção de saldo, terminando com o disclaimer de análise automatizada, exatamente como o prompt exige.

Build, 38/38 testes e lint continuam limpos. Deploy de produção atualizado.

## DEC-016 — V1.0: revisão geral, auditoria de segurança e fechamento (2026-08-16)

Pedido do usuário: "pode segui para v1.0". Como acordado ao final do V0.9, V1.0 é mais uma marca de "produto completo" do que uma etapa técnica nova (todo o roadmap V0.1–V0.9 já implementado, exceto os 2 bloqueios de negócio). Antes de fechar, fiz uma revisão geral:

- Build, 38/38 testes e lint confirmados limpos mais uma vez.
- **Auditoria de RLS em produção**: as 8 tabelas do schema (`profiles`, `accounts`, `transaction_categories`, `transactions`, `budgets`, `goals`, `goal_contributions`, `alerts`) confirmadas com RLS habilitada e sem grant pra `anon`.
- **Achado real de segurança, corrigido na hora**: a função `admin_platform_metrics()` (DEC-002) tinha `EXECUTE` concedido a `PUBLIC`/`anon`, apesar da migration original (`0002_admin_role.sql`) já ter um `revoke all ... from public` — o revoke não tinha efeito completo (causa exata não investigada a fundo, mas confirmado via `information_schema.role_routine_grants` que `anon` e `PUBLIC` ainda apareciam com `EXECUTE`). **Não era explorável de fato**: a função valida `role='admin'` internamente via `auth.uid()`, e uma chamada sem sessão sempre cai no `raise exception`. Corrigido por defesa em profundidade — `revoke execute ... from public/anon` explícito, `grant` mantido só pra `authenticated`. Re-testado ao vivo: admin continua funcionando (`total_users` retornado corretamente), o revoke não quebrou nada.
- `PROJECT_CONTEXT.md` reescrito — estava parado no V0.1 (não tinha sido atualizado desde a criação do projeto), agora reflete o estado real de V1.0.

**Não fechado, por decisão consciente**: Open Finance (V0.6) e WhatsApp (V0.8) continuam bloqueados por decisão de negócio (custo/CNPJ), não técnica — não fazem parte do "V1.0 completo" porque a própria Foundation nunca definiu esses dois como obrigatórios pra essa marca, e o usuário já confirmou explicitamente pausar os dois.

Build, 38/38 testes e lint continuam limpos. Nenhum código de produto quebrado pela correção de segurança.
