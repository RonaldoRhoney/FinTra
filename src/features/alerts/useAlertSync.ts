import { useEffect, useRef } from "react";
import { insightDedupeKey, type Insight } from "../../engine/financialEngine";
import { alertsRepo } from "../../lib/repositories";
import { useAppData } from "../data/AppDataProvider";

const DEDUPE_WINDOW_DAYS = 7;

/** Transforma os insights recalculados a cada carregamento do dashboard em
 * alertas persistidos (V0.7) — só cria um novo registro pra combinação
 * tipo+alvo que não teve alerta nos últimos 7 dias, pra não repetir o
 * mesmo aviso trivialmente (docs/foundation/02_PRD.md). */
export function useAlertSync(insights: Insight[]) {
  const { refetchAlerts } = useAppData();
  const syncedKey = useRef<string | null>(null);

  useEffect(() => {
    const currentKey = insights.map(insightDedupeKey).sort().join("|");
    if (currentKey === syncedKey.current) return;
    syncedKey.current = currentKey;

    if (insights.length === 0) return;

    (async () => {
      const recentKeys = await alertsRepo.recentDedupeKeys(DEDUPE_WINDOW_DAYS);
      const newOnes = insights.filter((insight) => !recentKeys.has(insightDedupeKey(insight)));
      if (newOnes.length === 0) return;

      await Promise.all(
        newOnes.map((insight) =>
          alertsRepo.create({ kind: insight.kind, dedupeKey: insightDedupeKey(insight), payload: insight as unknown as Record<string, unknown> }),
        ),
      );
      await refetchAlerts();
    })();
  }, [insights, refetchAlerts]);
}
