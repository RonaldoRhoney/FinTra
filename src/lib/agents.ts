import { supabase } from "./supabaseClient";
import type { Locale } from "../features/i18n/translations";

async function callAgent(endpoint: string, payload: Record<string, unknown>): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new Error("No active session.");

  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("AI_UNAVAILABLE");

  const body = await response.json();
  return body.analysis as string;
}

export interface AgentQueryBase {
  locale: Locale;
}

export const financialAnalystRepo = {
  analyze: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("financial-analyst", payload),
};

export const savingsCoachRepo = {
  suggest: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("savings-coach", payload),
};

export const behaviorAgentRepo = {
  detect: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("behavior-agent", payload),
};

export const goalAgentRepo = {
  evaluate: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("goal-agent", payload),
};

export const planningAgentRepo = {
  simulate: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("planning-agent", payload),
};

export const investmentEducationAgentRepo = {
  explain: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("investment-education-agent", payload),
};

export const cfoAgentRepo = {
  brief: (payload: AgentQueryBase & Record<string, unknown>) => callAgent("cfo-agent", payload),
};
