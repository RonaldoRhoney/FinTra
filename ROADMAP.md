# ROADMAP — FinTra

> Baseado em `docs/foundation/06_ROADMAP.md`. Regra da Foundation: não antecipar integrações reguladas ou funcionalidades de versões futuras sem decisão explícita.

## V0.1 — Foundation

**STATUS: CONCLUÍDA e em produção** (`fintra.rhoneyinc.com`, 2026-08-16). Schema com RLS, Financial Engine determinístico básico (saldo, resumo de período, taxa de economia, agregação por categoria, progresso de orçamento/meta), CRUD completo (contas/transações/categorias/orçamentos/metas), auth e-mail/senha + Google, admin padrão com painel de métricas agregadas, tema claro/escuro, i18n PT/EN/ES, auditoria de usabilidade/acessibilidade/fluidez aplicada. Ver `PROJECT_CONTEXT.md` e `docs/DECISIONS.md` (DEC-001 a DEC-003).

## Versões seguintes (visão da Foundation, não comprometidas em detalhe)

- **V0.2** — Financial Engine completo. **STATUS: CONCLUÍDA** (2026-08-16, DEC-004). Histórico mensal, média/variação por categoria, detecção de gasto fora do padrão, fluxo de caixa projetado, capacidade de economia, projeção de meta, seção "Insights prioritários" no dashboard. Recorrência de transação (ex: "assinatura mensal") ainda não implementada — não fazia parte do plano aprovado, fica pra quando for pedida explicitamente.
- **V0.3** — Goals. *(Já coberto em parte pelo V0.1 — metas com contribuição manual já existem; o que falta aqui é o que o V0.2 adicionar de projeção puder aplicar a elas, ex: "nesse ritmo, você bate a meta em X meses".)*
- **V0.4** — Intelligence/Agents.
- **V0.5** — Reports.
- **V0.6** — Open Finance. **Bloqueada até resposta às 8 perguntas de `docs/foundation/open-finance/PARTICIPATION_MODEL.md`** (participante direto vs. integrador, responsabilidade por agente de tratamento, quem armazena/processa dado, DPA, custos) — decisão que não cabe ao Claude Code tomar sozinho.
- **V0.7** — Alerts.
- **V0.8** — Omnichannel/WhatsApp.
- **V0.9** — CFO IA.
- **V1.0** — Personal Financial Intelligence.

## Pendências que bloqueiam etapas futuras (não bloqueiam o V0.1)

- Participation Model do Open Finance (V0.6).
- Legal Basis Matrix validada por jurídico/DPO (`docs/foundation/privacy/LEGAL_BASIS_MATRIX.md`) — necessária antes de produção com dado real de terceiros.
- Posicionamento de marketing FinTra x FinWise.
