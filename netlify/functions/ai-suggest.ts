import type { Handler } from "@netlify/functions";
import { getGiftIdeasFromGemini } from "../../lib/ai/gemini";
import { insertGiftSuggestion } from "../../lib/db-queries";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const SITE_URL = process.env.URL || process.env.DEPLOY_URL || process.env.DEPLOY_PRIME_URL || "";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  try {
    let body: any = {};
    if (event.body) { try { body = JSON.parse(event.body); } catch { body = {}; } }

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

    console.log("Calling Gemini API with query:", query);
    const ideas = await getGiftIdeasFromGemini(GEMINI_API_KEY, query);
    console.log("Gemini returned", ideas.length, "ideas");

    const enriched = await Promise.all(
      ideas.slice(0, 10).map(async (s) => {
        const searchQ = encodeURIComponent((s.keywords?.length ? s.keywords : [s.title]).join(" "));
        try {
          const r = await fetch(`${SITE_URL}/.netlify/functions/amazon-search?q=${searchQ}`);
          const text = await r.text();
          let j: any = {};
          try { j = text ? JSON.parse(text) : {}; } catch { j = {}; }
          const items = Array.isArray(j?.items) ? j.items.slice(0, 1) : [];
          return { ...s, products: items };
        } catch (e) {
          console.error("amazon-search fetch failed", { SITE_URL, searchQ, error: (e as any)?.message });
          return { ...s, products: [] };
        }
      })
    );

    const dbResult = await insertGiftSuggestion(query, enriched);

    if (!dbResult.success) {
      console.error("Database insert error:", dbResult.error);
    }

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ query, suggestions: enriched, saved: true }),
    };
  } catch (e: any) {
    console.error("ai-suggest failed:", e);
    console.error("Stack trace:", e.stack);
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "ai-suggest failed",
        message: e.message ?? "unknown",
        details: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }),
    };
  }
};
