import type { Insight } from "../../engine/financialEngine";
import type { TranslationKey } from "../i18n/translations";
import { formatCurrency, formatPercentage } from "../../lib/format";

export function formatInsight(insight: Insight, tf: (key: TranslationKey, params: Record<string, string>) => string): string {
  switch (insight.kind) {
    case "category_spike":
      return tf("insight_category_spike", {
        category: insight.categoryName ?? "",
        percent: formatPercentage(insight.variation ?? 0),
        amount: formatCurrency(insight.amount ?? 0),
      });
    case "anomaly":
      return tf("insight_anomaly", {
        amount: formatCurrency(insight.amount ?? 0),
        category: insight.categoryName ?? "",
        average: formatCurrency(insight.averageAmount ?? 0),
      });
    case "negative_cash_flow":
      return tf("insight_negative_cash_flow", {
        months: String(insight.monthsAhead ?? 0),
        amount: formatCurrency(insight.projectedBalance ?? 0),
      });
    case "goal_off_track":
      return tf("insight_goal_off_track", {
        goal: insight.goalName ?? "",
        required: formatCurrency(insight.requiredMonthlyContribution ?? 0),
        available: formatCurrency(insight.availableCapacity ?? 0),
      });
  }
}
