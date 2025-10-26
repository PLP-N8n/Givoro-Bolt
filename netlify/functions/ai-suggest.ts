import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SITE_URL = process.env.URL || "";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    let body: any = {};
    if (event.body) {
      try { body = JSON.parse(event.body); } catch { body = {}; }
    }

    const query =
      body.query ??
      event.queryStringParameters?.q ??
      `${body.occasion ?? ""} ${body.recipient ?? ""} ${body.interests ?? ""}`.trim();

    if (!query) {
      return {
        statusCode: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing query. Provide { query } or ?q=..." }),
      };
    }

    const prompt = `Return 6 short gift ideas as a pure JSON array.
Each item: { "title": string, "reason": string, "keywords": string[] }.
No prose, no code fences. Query: "${query}"`;

    const gemRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const gemData = await gemRes.json();
    const text =
      gemData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      gemData?.promptFeedback?.blockReason ??
      "[]";

    let suggestions: Array<{title:string;reason:string;keywords:string[]}> = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) suggestions = parsed;
    } catch { /* fallback to [] */ }

    const enriched = await Promise.all(
      suggestions.slice(0, 10).map(async (s) => {
        const q = encodeURIComponent((s.keywords?.length ? s.keywords : [s.title]).join(" "));
        try {
          const r = await fetch(`${SITE_URL}/.netlify/functions/amazon-search?q=${q}`);
          const j = await r.json().catch(() => ({ items: [] }));
          return { ...s, products: (j.items ?? []).slice(0, 1) };
        } catch {
          return { ...s, products: [] };
        }
      })
    );

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    await supabase.from("gift_suggestions").insert([{ query, ai_response: enriched }]);

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ query, suggestions: enriched, saved: true }),
    };
  } catch (e: any) {
    console.error("ai-suggest failed:", e);
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "ai-suggest failed", message: e.message ?? "unknown" }),
    };
  }
};
