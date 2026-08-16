# ROADMAP — FinTra

> Baseado em `docs/foundation/06_ROADMAP.md`. Regra da Foundation: não antecipar integrações reguladas ou funcionalidades de versões futuras sem decisão explícita.

## V0.1 — Foundation

**STATUS: CONCLUÍDA e em produção** (`fintra.rhoneyinc.com`, 2026-08-16). Schema com RLS, Financial Engine determinístico básico (saldo, resumo de período, taxa de economia, agregação por categoria, progresso de orçamento/meta), CRUD completo (contas/transações/categorias/orçamentos/metas), auth e-mail/senha + Google, admin padrão com painel de métricas agregadas, tema claro/escuro, i18n PT/EN/ES, auditoria de usabilidade/acessibilidade/fluidez aplicada. Ver `PROJECT_CONTEXT.md` e `docs/DECISIONS.md` (DEC-001 a DEC-003).

## Versões seguintes (visão da Foundation, não comprometidas em detalhe)

- **V0.2** — Financial Engine completo. **STATUS: CONCLUÍDA** (2026-08-16, DEC-004). Histórico mensal, média/variação por categoria, detecção de gasto fora do padrão, fluxo de caixa projetado, capacidade de economia, projeção de meta, seção "Insights prioritários" no dashboard. Recorrência de transação (ex: "assinatura mensal") ainda não implementada — não fazia parte do plano aprovado, fica pra quando for pedida explicitamente.
- **V0.3** — Goals. **STATUS: CONCLUÍDA** (2026-08-16, DEC-005). Tela de Metas agora mostra prazo, aporte mensal necessário e projeção "nesse ritmo, bate a meta em X meses" — usando o motor do V0.2.
- **V0.4** — Intelligence/Agents. **STATUS: CONCLUÍDA** (2026-08-16, DEC-006 a DEC-009). Os 6 agentes do PRD implementados e em produção, via Groq (llama-3.3-70b-versatile), sem custo: Financial Analyst, Savings Coach, Behavior Agent, Goal Agent, Planning Agent, Investment Education Agent (com restrições reforçadas contra recomendação regulada de investimento).
- **V0.5** — Reports. **STATUS: CONCLUÍDA** (2026-08-16, DEC-010). Página "Relatórios": período (7d/30d/mês atual/mês passado) com comparação vs. período anterior, evolução mensal em gráfico de barras CSS, gastos por categoria do período. Calculado sob demanda, sem persistir relatório salvo/exportável (fora de escopo por enquanto).
- **V0.6** — Open Finance. **PAUSADA por decisão do usuário** (2026-08-16, DEC-011/DEC-012). Duas rodadas de investigação real confirmaram que não há caminho zero-custo aplicável ao FinTra: Pluggy R$2.500/mês (plano "Dados", confirmado na página oficial de preços), Belvo ~R$6.000/mês, "Conector 200"/"Meu Pluggy" gratuito explicitamente restrito a uso pessoal (não produto comercial multiusuário). Nenhuma das 8 perguntas de `docs/foundation/open-finance/PARTICIPATION_MODEL.md` foi respondida. Usuário decidiu não contratar integrador pago por enquanto — segue pro V0.7.
- **V0.7** — Alerts. **STATUS: CONCLUÍDA** (2026-08-16, DEC-013). Alertas persistidos (tabela `alerts`, RLS validada), deduplicados por 7 dias a partir dos insights do V0.2, página "Alertas" (marcar como lido/descartar) + contador de não lidos na sidebar.
- **V0.8** — Omnichannel/WhatsApp.
- **V0.9** — CFO IA.
- **V1.0** — Personal Financial Intelligence.

## Pendências que bloqueiam etapas futuras (não bloqueiam o V0.1)

- Participation Model do Open Finance (V0.6).
- Legal Basis Matrix validada por jurídico/DPO (`docs/foundation/privacy/LEGAL_BASIS_MATRIX.md`) — necessária antes de produção com dado real de terceiros.
- Posicionamento de marketing FinTra x FinWise.
