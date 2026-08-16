# Provider Abstraction

Criar interface de provider para impedir acoplamento ao fornecedor.

Exemplo conceitual:
OpenFinanceProvider
- createConsent()
- getConsentStatus()
- listAccounts()
- listBalances()
- listTransactions()
- revokeConsent()
- refreshData()

Não implementar esses métodos com endpoints inventados. Primeiro documentar o contrato do fornecedor oficial escolhido.
