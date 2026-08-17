import type { AlertKind } from "../../types/finance";

/**
 * Contrato conceitual do V0.8 (Omnichannel/WhatsApp) — ver
 * docs/NOTIFICATION_PROVIDER.md pro contexto completo e os pré-requisitos
 * (CNPJ verificado no Meta Business Manager, ainda não existente).
 *
 * NENHUMA implementação real existe ainda. Não instanciar nem simular esta
 * interface como se fosse produção (docs/foundation/open-finance/
 * OPEN_FINANCE_ARCHITECTURE.md, mesma regra aplicada por analogia: nunca
 * tratar um contrato de papel como integração real).
 */
export interface NotificationProvider {
  sendAlert(input: {
    userId: string;
    channel: "whatsapp";
    templateKind: AlertKind;
    payload: Record<string, unknown>;
  }): Promise<{ status: "sent" | "failed"; providerMessageId?: string }>;
}
