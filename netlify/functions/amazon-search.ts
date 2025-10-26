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
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Amazon search failed",
        message: err.message,
      }),
    };
  }
};
