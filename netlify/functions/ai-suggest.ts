import type { Handler } from "@netlify/functions";
import { getGiftIdeasFromGemini } from "../../lib/ai/gemini";
import { insertGiftSuggestion } from "../../lib/db-queries";
import { searchAmazonProducts } from "../../lib/amazon-search";
import { getGeminiApiKey } from "../../lib/env-validation";
import { validateQuery, validateConversationContext } from "../../lib/validation";
import { CORS_HEADERS, LIMITS } from "../../lib/constants";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const apiKey = getGeminiApiKey();

    let body: any = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid JSON in request body" }),
        };
      }
    }

    const query =
      body.query ??
      event.queryStringParameters?.q ??
      `${body.occasion ?? ""} ${body.recipient ?? ""} ${body.interests ?? ""}`.trim();

    const queryValidation = validateQuery(query);
    if (!queryValidation.isValid) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: queryValidation.error }),
      };
    }

    const contextValidation = validateConversationContext({
      recipient: body.recipient,
      occasion: body.occasion,
      budget: body.budget,
      interests: body.interests,
    });

    if (!contextValidation.isValid) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: contextValidation.error }),
      };
    }

    const context = contextValidation.data!;
    const sessionId = body.sessionId || event.headers["x-session-id"] || null;

    console.log("Calling Gemini API with query:", query);
    console.log("Context:", context);
    const ideas = await getGiftIdeasFromGemini(apiKey, query, context);
    console.log("Gemini returned", ideas.length, "ideas");

    const enriched = await Promise.all(
      ideas.slice(0, LIMITS.MAX_SUGGESTIONS).map(async (s) => {
        const searchKeywords = s.keywords?.length ? s.keywords : [s.title];
        const products = await searchAmazonProducts(
          searchKeywords,
          LIMITS.MAX_PRODUCTS_PER_SUGGESTION,
          context.interests
        );
        return { ...s, products };
      })
    );

    const dbResult = await insertGiftSuggestion(query, enriched, sessionId);

    if (!dbResult.success) {
      console.error("Database insert error:", dbResult.error);
    } else {
      console.log("Saved suggestion with ID:", dbResult.id);
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        suggestions: enriched,
        suggestionId: dbResult.id,
        saved: dbResult.success
      }),
    };
  } catch (e: any) {
    console.error("ai-suggest failed:", e);
    console.error("Stack trace:", e.stack);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to generate gift suggestions",
        message: e.message ?? "An unexpected error occurred",
        details: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }),
    };
  }
};
