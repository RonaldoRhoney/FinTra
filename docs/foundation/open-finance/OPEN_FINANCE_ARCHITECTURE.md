# Open Finance Architecture

Open Finance será uma camada de integração, não o núcleo do produto.

Fluxo:
Usuário
→ solicitação de conexão
→ jornada oficial de consentimento/autenticação
→ instituição participante
→ dados autorizados
→ ingestion layer
→ validação/minimização
→ normalização
→ Financial Engine

## Proibição
Não implementar login direto com senha de banco.
Não armazenar credenciais bancárias.
Não inventar endpoints.
Não tratar uma API de terceiro como participante do Open Finance sem validar seu papel.

## Blocker de produção
Antes da integração real, definir juridicamente/operacionalmente qual papel a RhoneyInc terá no ecossistema e qual participante/provedor será utilizado.
