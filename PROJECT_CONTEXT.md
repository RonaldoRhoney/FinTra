# PROJECT_CONTEXT — FinTra

## Estado atual (2026-08-16) — V1.0

Todas as versões do roadmap original (`docs/foundation/06_ROADMAP.md`) foram implementadas, exceto duas bloqueadas por decisão de negócio explícita (não técnica). Produto em produção, real, com dado de teste validado ponta a ponta em cada etapa — nunca mockado.

**No ar**: [fintra.rhoneyinc.com](https://fintra.rhoneyinc.com). Repositório: `github.com/RonaldoRhoney/FinTra`. Supabase: projeto `effbaiizowiwcglsrxcn`. Deploy: Vercel (`vercel --prod` em `Fintra/`, mesmo padrão dos demais produtos RhoneyInc).

## Decisões estruturais (ver `docs/DECISIONS.md` pra detalhe completo, DEC-001 a DEC-015)

- **FinTra é produto irmão distinto do FinWise** (`Controle-Financeiro-Pessoal/`) — repositório e Supabase próprios. Posicionamento de marketing entre os dois ainda não definido.
- **Stack**: React + Vite + TS + Tailwind v4 (fonte Inter self-hosted) + Supabase (Postgres + Auth + RLS) + Vercel, alinhado aos produtos RhoneyInc mais recentes.
- **Admin padrão**: `rhoneyinc@gmail.com` promovida a admin automaticamente no cadastro (skill `admin-padrao`), com painel de métricas agregadas (`admin_platform_metrics()`, nunca expõe transação individual de usuário).
- **Tema claro/escuro** e **i18n PT (padrão)/EN/ES** em toda a interface, incluindo nomes dos 6 agentes de IA (corrigido depois de um esquecimento inicial — só o Financial Analyst tinha sido traduzido).
- **Financial Engine 100% determinístico** (`src/engine/financialEngine.ts`) — nunca depende de IA pra cálculo essencial (`docs/foundation/01_ZERO_COST_FIRST.md`). 38 testes cobrindo especialmente os casos de "histórico insuficiente" (nunca projeta/alerta com pouco dado).
- **6 agentes de IA + CFO IA** via Groq (`llama-3.3-70b-versatile`), escolhido sobre Gemini free tier após investigação real (Groq não retém/treina com dado do usuário, Gemini free tier declara que pode). Chave só no backend (Vercel Edge Functions), nunca no frontend. Contexto enviado sempre agregado, nunca transação crua nem PII.
- **Alertas persistidos** (V0.7), deduplicados por 7 dias a partir dos mesmos insights do Financial Engine.
- **Dois itens bloqueados por decisão de negócio, não técnica**:
  - **Open Finance (V0.6)**: sem caminho zero-custo real pro Brasil pra produto multiusuário (Pluggy R$2.500/mês, Belvo R$6.000/mês, oferta grátis só pra uso pessoal/1 CPF) — confirmado em duas rodadas de investigação real.
  - **WhatsApp/Omnichannel (V0.8)**: caminho quase-zero-custo existe (Meta Cloud API, 1.000 conversas grátis/mês), mas exige CNPJ verificado no Meta Business Manager, que o RhoneyInc/FinTra não tem ainda. Arquitetura preparada (`docs/NOTIFICATION_PROVIDER.md`), zero implementação real.

## Auditoria de segurança (2026-08-16, antes de fechar V1.0)

RLS habilitada e sem grant pra `anon` confirmado nas 8 tabelas (`profiles`, `accounts`, `transaction_categories`, `transactions`, `budgets`, `goals`, `goal_contributions`, `alerts`). **Achado e corrigido**: a função `admin_platform_metrics()` tinha `EXECUTE` liberado pra `PUBLIC`/`anon` apesar da migration original tentar revogar isso — não era explorável de fato (a função valida `role='admin'` internamente, `anon` sem sessão sempre cai no `raise exception`), mas corrigido por defesa em profundidade: revogado explicitamente de `anon`/`PUBLIC`, mantido só pra `authenticated`. Re-testado ao vivo: admin continua funcionando, usuário comum continua bloqueado.

## O que fica pra depois do V1.0

- Open Finance e WhatsApp, quando as respectivas decisões de negócio (integrador pago ou participante direto; CNPJ verificado) forem resolvidas.
- Recorrência de transação (assinatura mensal automática) — mencionada no roadmap como fora de escopo até pedido explícito.
- Páginas de privacidade/termos/contato dedicadas (mesma lacuna já registrada nos produtos-irmãos como VoaRadar).
- Legal Basis Matrix validada por jurídico/DPO (`docs/foundation/privacy/LEGAL_BASIS_MATRIX.md`) — necessária antes de qualquer tratamento de dado real de terceiro em escala.
