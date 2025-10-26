export type GiftIdea = { title: string; reason: string; keywords: string[] };

const MODEL = "gemini-1.5-flash";

export async function getGiftIdeasFromGemini(apiKey: string, query: string): Promise<GiftIdea[]> {
  const prompt = `You are a helpful gift recommendation assistant. Generate 6 thoughtful gift ideas based on this query: "${query}"

Return ONLY a JSON array with this exact structure (no markdown, no code fences, no explanations):
[
  {"title": "Gift Name", "reason": "Why this is a great gift", "keywords": ["keyword1", "keyword2"]},
  ...
]

Make sure each gift is relevant to the query and includes practical keywords for searching.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();

    // Check for blocked content
    if (data?.promptFeedback?.blockReason) {
      console.error("Content blocked:", data.promptFeedback.blockReason);
      return [];
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("No text in Gemini response:", JSON.stringify(data));
      return [];
    }

    // Remove markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to extract JSON if wrapped in text
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      console.error("Gemini response not an array:", text);
      return [];
    }

    // Validate structure
    const validated = parsed.filter(item =>
      item &&
      typeof item.title === 'string' &&
      typeof item.reason === 'string' &&
      Array.isArray(item.keywords)
    );

    return validated.slice(0, 6);

  } catch (error) {
    console.error("getGiftIdeasFromGemini error:", error);
    return [];
  }
}
