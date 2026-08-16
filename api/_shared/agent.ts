/**
 * Base compartilhada por todo agente de IA do FinTra (docs/foundation/05_AGENTS.md).
 * Cada agente é uma Vercel Edge Function própria (api/{agente}.ts) que só
 * chama `runAgent` com seu prompt de sistema — a validação de sessão, a
 * chamada à Groq e a resiliência (IA indisponível não derruba o produto)
 * ficam centralizadas aqui, uma vez só.
 */

export async function runAgent(req: Request, systemPrompt: string): Promise<Response> {
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

  let context: unknown;
  try {
    context = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });
  }

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
  });

  if (!groqResponse.ok) {
    return new Response(JSON.stringify({ error: "AI provider unavailable" }), { status: 502 });
  }

  const data = await groqResponse.json();
  const analysis: string = data.choices?.[0]?.message?.content ?? "";

  return new Response(JSON.stringify({ analysis }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
