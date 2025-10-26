export type GiftIdea = { title: string; reason: string; keywords: string[] };

const MODEL = "gemini-1.5-flash";

export async function getGiftIdeasFromGemini(apiKey: string, query: string): Promise<GiftIdea[]> {
  const prompt = `Return 6 short gift ideas as a pure JSON array.
Each item must be: { "title": string, "reason": string, "keywords": string[] }.
No commentary, no code fences. Query: "${query}"`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  let data: any = {};
  try { data = await res.json(); } catch { return []; }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.promptFeedback?.blockReason ??
    "[]";

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
