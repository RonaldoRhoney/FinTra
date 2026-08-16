# FinTra — Instruções para Claude Code

## 1. Identidade do projeto

Você está trabalhando no **FinTra**, produto da **RhoneyInc** — plataforma de inteligência financeira pessoal (nome de trabalho anterior: "Financial Intelligence RhoneyInc"). Produto irmão distinto do **FinWise** (`Controle-Financeiro-Pessoal/`, `finwise.rhoneyinc.com`) — não é a mesma coisa, não compartilha banco, e o posicionamento entre os dois pro usuário final ainda não foi decidido (2026-08-16). Não invente essa decisão.

A fonte de verdade original do produto é a **Foundation** entregue pelo usuário em `docs/foundation/` (`README.md` lista a ordem obrigatória de leitura). Este `CLAUDE.md` e os demais docs da raiz (`PROJECT_CONTEXT.md`, `PRD.md`, `ROADMAP.md`) são a tradução dessa Foundation pro formato padrão dos demais produtos RhoneyInc — em caso de dúvida sobre a visão original do produto, `docs/foundation/` prevalece.

## 2. Regra fundamental

**NÃO CODIFIQUE IMEDIATAMENTE.** Antes de qualquer alteração:

1. Leia este arquivo, `PROJECT_CONTEXT.md`, `PRD.md`, `ROADMAP.md`.
2. Se a dúvida for sobre visão/regra de produto que estes não cobrem, leia `docs/foundation/` na ordem do `docs/foundation/README.md`.
3. Inspecione a estrutura atual do projeto e o código existente.
4. Apresente um plano (Entendimento / Estado atual / Plano / Riscos) e espere aprovação explícita antes de implementar.

## 3. Regras obrigatórias (herdadas da Foundation, `docs/foundation/07_CLAUDE_CODE_RULES.md`)

1. Não inventar requisitos, endpoints, provedores ou credenciais.
2. **ZERO-COST-FIRST**: nenhuma funcionalidade essencial depende de API/LLM/token pago. O núcleo financeiro (cálculos, categorização, relatórios, alertas) precisa funcionar sem IA generativa — IA é camada complementar, nunca requisito.
3. Nunca armazenar senha bancária. Nunca pedir credencial bancária ao usuário.
4. **Open Finance é BLOCKER até decisão jurídica/operacional explícita** — ver `docs/foundation/open-finance/PARTICIPATION_MODEL.md`. Claude Code não decide isso sozinho. Nenhuma integração real entra antes da V0.6 do roadmap, e mesmo essa depende da resposta às 8 perguntas do BLOCKER.
5. Nunca simular integração Open Finance como se fosse produção — nem no mockup, nem em tela de demo.
6. Segurança e isolamento por usuário (RLS) desde o V0.1, sem exceção.
7. Criar testes para toda regra financeira (cálculo de saldo, taxa de economia, categorização, etc.).
8. Dados financeiros minimizados antes de chegar a qualquer agente/LLM — nunca "banco completo → LLM" (ver `docs/foundation/security/AI_DATA_POLICY.md`).
9. Toda integração externa deve ser documentada antes de implementada.
10. Se houver dúvida regulatória (LGPD, Open Finance, investimento), parar e registrar BLOCKER em vez de prosseguir.

## 4. Hierarquia de decisões

1. Instruções explícitas do usuário.
2. `CLAUDE.md` (este arquivo).
3. `PRD.md` / `PROJECT_CONTEXT.md` / `ROADMAP.md`.
4. `docs/foundation/` (fonte original, quando os docs da raiz não cobrirem o caso).
5. `docs/DECISIONS.md`, quando existir.
6. Código existente.
7. Boas práticas técnicas.

Se houver conflito entre documentos, **não escolha silenciosamente** — informe o conflito e peça orientação (mesmo princípio já aplicado nos demais produtos RhoneyInc).

## 5. Arquitetura de referência

Frontend: React + Vite + TypeScript + Tailwind CSS (padrão dos produtos RhoneyInc mais recentes — KnowRa, VoaRadar, VagaLume). Backend/dados: Supabase (Postgres + Auth + RLS). Deploy: Vercel. Ver `PROJECT_CONTEXT.md` para o estado atual e `docs/foundation/03_ARCHITECTURE.md` para a arquitetura conceitual completa (Financial Engine, Agent Orchestrator).

## 6. Registro de decisões

Toda decisão arquitetural relevante (schema, provider, integração, escopo adiado) deve ser registrada em `docs/DECISIONS.md` (criar quando a primeira decisão surgir), seguindo o mesmo formato `DEC-NNN` usado nos demais produtos da família.
