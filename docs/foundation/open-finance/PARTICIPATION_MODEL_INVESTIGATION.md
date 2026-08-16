# Investigação real do Participation Model (2026-08-16)

> Complementa `PARTICIPATION_MODEL.md` (que continua sendo o BLOCKER formal — este documento só registra o que foi investigado de verdade, pra não repetir a pesquisa do zero numa sessão futura).

## O que foi verificado (WebSearch + WebFetch, não suposição)

Integradores/agregadores de Open Finance certificados no Brasil e seus custos reais:

- **Pluggy** (Pluggy Brasil Instituição de Pagamento LTDA, autorizada pelo Banco Central como ITP): planos pagos a partir de ~R$2.500/mês (achado de discussão pública, não tabela oficial — sujeito a confirmação direta com a Pluggy antes de qualquer decisão final).
- **Belvo**: ~R$6.000/mês.
- **"Meu Pluggy"** (oferta gratuita da Pluggy, `pluggy.ai/meu-pluggy`, verificado direto na página oficial): genuinamente grátis por tempo indeterminado, mas **explicitamente restrito a uso pessoal, uma pessoa conectando as próprias contas**. Citação direta: *"Este fluxo é para uso pessoal. Para atender clientes, conectar contas de múltiplos CPFs ou transformar em um produto comercial, veja os planos."* e *"Posso usar essa API para fins comerciais? Não. Uso comercial exige o plano pago da Pluggy."*

## Conclusão

**Não existe caminho zero-custo real pra Open Finance no Brasil aplicável ao FinTra**, porque o FinTra é um produto multiusuário (cada usuário conectaria sua própria conta, ou seja, múltiplos CPFs) — exatamente o cenário que o "Meu Pluggy" gratuito exclui por definição, independente do FinTra gerar receita ou não.

Os únicos caminhos reais são:
1. Contratar um plano pago de integrador (Pluggy/Belvo/outro) — decisão de orçamento do usuário.
2. RhoneyInc virar participante direto do Open Finance — exige autorização do Banco Central, processo regulatório de meses, fora do escopo de uma decisão de produto isolada.

## Status

V0.6 continua **BLOQUEADO** (`PARTICIPATION_MODEL.md`). Nenhuma das 8 perguntas do documento original foi respondida — essa investigação só eliminou a hipótese de um caminho gratuito viável, não substitui a decisão jurídica/operacional que o próprio documento exige.
