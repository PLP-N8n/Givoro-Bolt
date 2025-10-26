type ConversationContext = {
  recipient?: string;
  occasion?: string;
  budget?: string;
  interests?: string[];
};

export async function postIdeas(query: string, context?: ConversationContext) {
  const res = await fetch("/api/ai-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, ...context }),
  });

  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { error: "Bad JSON", raw: text }; }

  if (!res.ok) {
    throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
  }
  return json;
}
