import type { Handler } from "@netlify/functions";
import { signPaapiRequest, buildSearchItemsPayload } from "../../lib/amazonSign";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    const requiredVars = {
      AMAZON_PA_ACCESS_KEY: process.env.AMAZON_PA_ACCESS_KEY,
      AMAZON_PA_SECRET_KEY: process.env.AMAZON_PA_SECRET_KEY,
      AMAZON_PARTNER_TAG: process.env.AMAZON_PARTNER_TAG,
    };

    const missingVars = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Amazon PA-API credentials not configured",
          missing: missingVars,
          message: "Please set the required environment variables in StackBlitz or Netlify",
        }),
      };
    }

    const query =
      event.queryStringParameters?.q ||
      (event.body ? JSON.parse(event.body).query : null);

    if (!query) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Missing ?q= or { query }" }),
      };
    }

    const payload = buildSearchItemsPayload({
      keywords: query,
      itemCount: 6,
    });

    const { url, options } = signPaapiRequest({ payloadObj: payload });
    const res = await fetch(url, options);
    const data = await res.json();

    if (data.Errors) {
      console.error("Amazon PA-API error:", data.Errors);
      return {
        statusCode: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Amazon PA-API returned an error",
          details: data.Errors,
        }),
      };
    }

    const items = data?.SearchResult?.Items?.map((i: any) => ({
      asin: i.ASIN,
      title: i.ItemInfo?.Title?.DisplayValue,
      image: i.Images?.Primary?.Medium?.URL,
      price: i.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      url: i.DetailPageURL,
    })) ?? [];

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, count: items.length, items }),
    };
  } catch (err: any) {
    console.error("amazon-search error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Amazon search failed", message: err.message ?? "unknown" }),
    };
  }
};
