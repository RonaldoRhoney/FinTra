import { supabase } from "./supabaseClient";
import type { MonthlyPoint, CategoryTrend } from "../engine/financialEngine";
import type { Locale } from "../features/i18n/translations";

export const financialAnalystRepo = {
  async analyze(params: {
    locale: Locale;
    balance: number;
    monthlyHistory: MonthlyPoint[];
    categoryTrends: CategoryTrend[];
    savingsRate: number | null;
  }): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("No active session.");

    const response = await fetch("/api/financial-analyst", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error("AI_UNAVAILABLE");
    }

    const body = await response.json();
    return body.analysis as string;
  },
};
