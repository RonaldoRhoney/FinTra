# Architecture

UI responsiva
→ Application API
→ Financial Engine
→ Data Layer
→ Integration Layer

## Financial Engine
Transaction Engine
Categorization Engine
Cash Flow Engine
Behavior Engine
Savings Engine
Goals Engine
Forecast Engine
Insight Engine
Report Engine

## Agent Orchestrator
Agentes recebem apenas contexto estruturado e mínimo necessário. Não fornecer acesso irrestrito ao banco financeiro.

## Data flow
Open Finance/CSV/manual
→ validation
→ minimization
→ normalization
→ secure storage
→ financial engine
→ insights
→ agents
→ channels

## Resilience
Se IA estiver indisponível, cálculos, métricas, relatórios e alertas determinísticos continuam funcionando.
