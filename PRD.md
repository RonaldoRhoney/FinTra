# PRD — FinTra

> Síntese de `docs/foundation/02_PRD.md`, `00_PRODUCT_VISION.md` e `05_AGENTS.md`. Em caso de dúvida sobre um detalhe não coberto aqui, ver a Foundation original.

## Problema

Usuários têm contas em várias instituições e dificuldade para entender a vida financeira consolidada, identificar desperdícios, economizar e planejar objetivos.

## Proposta

Consolidar dados financeiros autorizados e transformar dado em ação: visão financeira, categorização, análise de comportamento, capacidade de economia, metas, projeções, relatórios, alertas — o produto não deve só mostrar o passado, deve ajudar a decidir o que fazer com o próximo dinheiro que entrar.

## Princípios de produto

Privacy-by-Design, Security-by-Design, Consent-by-Design, Open-Finance-by-Design, **ZERO-COST-FIRST**, mobile-first, IA complementar (nunca requisito do núcleo), transparência/explicabilidade, nenhuma recomendação regulada de investimento sem validação jurídica.

## Funcionalidades (visão completa do produto, não escopo de uma versão)

**Dados**: contas, cartões, saldos, transações, receitas, despesas, importação CSV/Excel, futura integração Open Finance (bloqueada até decisão jurídica, ver `CLAUDE.md` §3.4).

**Inteligência**: categorização, recorrência, média histórica, variação, anomalias, fluxo de caixa, capacidade de economia, projeções.

**Metas**: viagem, carro, moto, casa/reforma, reserva, educação, investimentos, meta personalizada.

**Agentes dedicados** (`docs/foundation/05_AGENTS.md`) — camada opcional sobre o Financial Engine, nunca substituindo os cálculos determinísticos:
- **Financial Analyst** — saúde financeira, fluxo, patrimônio, tendências.
- **Savings Coach** — oportunidades de economia com impacto quantificado.
- **Behavior Agent** — padrões e gastos fora do comportamento histórico.
- **Goal Agent** — prazo, progresso e risco de atraso de metas.
- **Planning Agent** — simulação de cenários e distribuição de capacidade financeira entre objetivos.
- **Investment Education Agent** — explica conceitos e capacidade de aporte; nunca executa recomendação regulada sem validação jurídica.

Regras dos agentes: nunca inventar dado, diferenciar fato de estimativa, citar período/base da análise, minimizar dado exposto, produzir recomendação acionável, respeitar preferência/frequência de alerta do usuário.

**Alertas**: só relevantes, contextualizados e acionáveis — um insight precisa considerar relevância, impacto financeiro, confiança, urgência e contexto; evento trivial não gera notificação.

## Fora de escopo até decisão explícita

- Qualquer integração Open Finance real (BLOCKER jurídico/operacional, `docs/foundation/open-finance/PARTICIPATION_MODEL.md`).
- Recomendação regulada de investimento.
- Posicionamento de marketing entre FinTra e FinWise (em aberto, 2026-08-16).
