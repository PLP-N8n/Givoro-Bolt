// netlify/functions/amazon-search.ts
import type { Handler } from "@netlify/functions";
import { signPaapiRequest, buildSearchItemsPayload } from "../../lib/amazonSign";

export const handler: Handler = async (event) => {
  try {
    const query =
      event.queryStringParameters?.q ||
      (event.body ? JSON.parse(event.body).query : null);

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing ?q= or { query }" }),
      };
    }

    // Build the PA-API payload
    const payload = buildSearchItemsPayload({
      keywords: query,
      itemCount: 6, // adjust results count
    });

    // Sign and call Amazon
    const { url, options } = signPaapiRequest({ payloadObj: payload });
    const res = await fetch(url, options);
    const data = await res.json();

    // Simplify output (optional)
    const items = data?.SearchResult?.Items?.map((i: any) => ({
      asin: i.ASIN,
      title: i.ItemInfo?.Title?.DisplayValue,
      image: i.Images?.Primary?.Medium?.URL,
      price: i.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      url: i.DetailPageURL,
    })) ?? [];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, count: items.length, items }),
    };
  } catch (err: any) {
    console.error("amazon-search error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Amazon search failed",
        message: err.message,
      }),
    };
  }
};
