import type { Handler } from "@netlify/functions";
import { searchAmazonProducts } from "../../lib/amazon-search";
import { validateQuery } from "../../lib/validation";
import { CORS_HEADERS } from "../../lib/constants";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  try {
    let query: string | null = null;

    if (event.queryStringParameters?.q) {
      query = event.queryStringParameters.q;
    } else if (event.body) {
      try {
        const body = JSON.parse(event.body);
        query = body.query;
      } catch {
        return {
          statusCode: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid JSON in request body" }),
        };
      }
    }

    const queryValidation = validateQuery(query);
    if (!queryValidation.isValid) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: queryValidation.error }),
      };
    }

    const items = await searchAmazonProducts(query as string);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ query, count: items.length, items }),
    };
  } catch (err: any) {
    console.error("amazon-search error:", err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Amazon search failed",
        message: err.message ?? "An unexpected error occurred"
      }),
    };
  }
};
