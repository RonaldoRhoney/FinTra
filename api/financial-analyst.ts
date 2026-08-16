/**
 * Agente "Financial Analyst" (docs/foundation/05_AGENTS.md). Roda como Vercel
 * Serverless Function pra manter GROQ_API_KEY fora do frontend
 * (CLAUDE.md §13: nunca expor credencial no frontend).
 *
 * Recebe só dado agregado (saldo, histórico mensal, tendência por categoria —
 * nunca a lista crua de transações), já minimizado pelo Financial Engine no
 * cliente antes de chegar aqui (docs/foundation/security/AI_DATA_POLICY.md).
 */

interface AnalystRequestBody {
  locale: "pt" | "en" | "es";
  balance: number;
  monthlyHistory: { month: string; income: number; expenses: number; net: number }[];
  categoryTrends: { name: string; currentTotal: number; averageTotal: number; hasEnoughHistory: boolean }[];
  savingsRate: number | null;
}

const SYSTEM_PROMPT: Record<AnalystRequestBody["locale"], string> = {
  pt: `Você é o Financial Analyst do FinTra: analisa saúde financeira, fluxo e tendências (docs/foundation/05_AGENTS.md).
Regras: nunca invente dado que não veio no contexto; diferencie fato (o que já aconteceu) de estimativa (o que você está projetando); cite o período da análise; não exponha dado desnecessário; produza no máximo 3 observações acionáveis, curtas, em português, sem jargão técnico de finanças. Nunca prometa retorno de investimento nem dê recomendação regulada.`,
  en: `You are FinTra's Financial Analyst: you analyze financial health, cash flow and trends (docs/foundation/05_AGENTS.md).
Rules: never invent data not present in the context; clearly separate fact from estimate; cite the analysis period; avoid unnecessary detail; produce at most 3 short, actionable observations in English, no financial jargon. Never promise investment returns or give regulated advice.`,
  es: `Eres el Financial Analyst de FinTra: analizas salud financiera, flujo de caja y tendencias (docs/foundation/05_AGENTS.md).
Reglas: nunca inventes datos que no estén en el contexto; separa claramente hecho de estimación; cita el período del análisis; evita detalles innecesarios; produce como máximo 3 observaciones breves y accionables en español, sin jerga financiera. Nunca prometas retorno de inversión ni des recomendación regulada.`,
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing access token" }), { status: 401 });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !groqApiKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  }

  const userCheck = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseAnonKey },
  });
  if (!userCheck.ok) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  let body: AnalystRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }

  const context = {
    saldo_atual: body.balance,
    taxa_de_economia: body.savingsRate,
    historico_mensal: body.monthlyHistory,
    tendencia_por_categoria: body.categoryTrends.filter((c) => c.hasEnoughHistory),
  };

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT[body.locale] ?? SYSTEM_PROMPT.pt },
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
  });

  if (!groqResponse.ok) {
    // Resiliência (docs/foundation/03_ARCHITECTURE.md): a UI trata isso como
    // "IA indisponível agora", nunca como erro fatal do produto.
    return new Response(JSON.stringify({ error: "AI provider unavailable" }), { status: 502 });
  }

  const data = await groqResponse.json();
  const analysis: string = data.choices?.[0]?.message?.content ?? "";

  return new Response(JSON.stringify({ analysis }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { runtime: "edge" };
