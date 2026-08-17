# Notification Provider — V0.8 (Omnichannel/WhatsApp)

> Mesmo espírito de `docs/foundation/open-finance/PROVIDER_ABSTRACTION.md`: define o contrato antes de qualquer implementação real, pra impedir acoplamento a um fornecedor específico. **Nenhum endpoint aqui é real** — isso é preparação de terreno, não integração.

## Por que está parado

Meta Cloud API (WhatsApp) tem um caminho técnico quase-zero-custo (1.000 conversas grátis/mês, sem taxa de plataforma da Meta), mas exige **CNPJ verificado no Meta Business Manager** — pré-requisito de negócio, não técnico. RhoneyInc/FinTra ainda não tem isso (confirmado pelo usuário, 2026-08-16). Sem isso, nenhuma implementação real é possível, então este documento só existe pra a próxima sessão não precisar rederivar a arquitetura do zero.

## Contrato conceitual

```ts
interface NotificationProvider {
  sendAlert(input: {
    userId: string;
    channel: "whatsapp"; // outros canais (email, push) entrariam aqui no futuro
    templateKind: AlertKind; // reaproveita os kinds já existentes em alerts.kind (V0.7)
    payload: Record<string, unknown>; // mesmo payload já persistido no alerta
  }): Promise<{ status: "sent" | "failed"; providerMessageId?: string }>;
}
```

- Reaproveita 100% o que o V0.7 já persiste (`alerts.kind`, `alerts.payload`) — não duplica lógica de geração de alerta, só adiciona um canal de entrega.
- Fica de fora, por decisão consciente e por exigência regulatória de mensageria: nunca enviar dado financeiro bruto (saldo exato, extrato) por mensagem — só o texto do alerta já formatado (mesmo texto que aparece na `AlertsPage`), respeitando `docs/foundation/security/AI_DATA_POLICY.md` por analogia.

## Pré-requisitos antes de qualquer código real

1. CNPJ + verificação no Meta Business Manager (processo de negócio, 3–7 dias úteis, fora do escopo de uma sessão de código).
2. Número de telefone dedicado, exclusivo pra isso (não pode ser usado no app WhatsApp comum).
3. Decisão explícita: construir direto na Cloud API da Meta (mais barato, exige montar webhook/templates do zero) ou via BSP (Twilio/360dialog/outro — mais rápido de sair do papel, mas cobra por cima da Meta).
4. Consentimento explícito do usuário pra receber alerta por WhatsApp (opt-in, não pode ser automático) — LGPD, mesmo princípio de `docs/foundation/privacy/CONSENT_UI.md`.
5. Monitorar a mudança de precificação da Meta anunciada pra 1º/out/2026 (mensagem de serviço, hoje grátis dentro da janela de 24h, passa a custar R$ 0,035) antes de dimensionar custo esperado.

## Quando retomar

Assim que o CNPJ estiver verificado no Meta Business Manager, voltar a este documento, responder o item 3 (Cloud API direta vs. BSP) e então implementar `WhatsAppNotificationProvider` como a primeira implementação real da interface acima.
