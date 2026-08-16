# Data Model

Entidades iniciais:
users
profiles
financial_institutions
accounts
cards
transactions
transaction_categories
income
expenses
budgets
goals
goal_contributions
financial_snapshots
financial_insights
alerts
consents
consent_scopes
agent_events
reports
audit_logs
data_requests
deletion_requests

## Regras
- isolamento por usuário
- menor privilégio
- valores monetários em tipo decimal adequado
- auditoria de alterações relevantes
- secrets fora do banco e do frontend
- nenhum dado financeiro exposto sem autorização
- consentimentos versionados e rastreáveis
