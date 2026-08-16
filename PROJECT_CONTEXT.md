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

## Análise V0.1 apresentada (aguardando aprovação para implementar)

Ver conversa de 2026-08-16: proposta de V0.1 cobre só entidades sem Open Finance (`users`, `accounts`, `transactions`, `transaction_categories`, `budgets`, `goals`, `goal_contributions`), entrada manual (CSV pode ficar pra V0.2), Financial Engine determinístico básico (saldo, entradas/saídas, taxa de economia, categorização por regra), RLS desde o início, dashboard só com os blocos que o V0.1 sustenta de verdade (sem "Agente Financeiro" nem "Contas Conectadas" reais do mockup, que são V0.4+/V0.6). Critérios de aceite: RLS testada com 2 usuários reais, CRUD completo das entidades do V0.1, dashboard com dado real (nunca mock apresentado como real), testes das regras financeiras, nenhuma tela prometendo Open Finance/IA antes da hora.

## Próximo passo

Implementar o V0.1 conforme a análise acima, mediante aprovação explícita do usuário — nenhum código de produto (schema, auth, telas reais) deve ser escrito antes disso.
