import type { Handler } from "@netlify/functions";
import { insertAffiliateClick } from "../../lib/db-queries";
import { validateAmazonUrl } from "../../lib/validation";
import { getAmazonCredentials } from "../../lib/env-validation";
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
    const url = event.queryStringParameters?.url;
    const name = event.queryStringParameters?.name;
    const suggestionId = event.queryStringParameters?.suggestionId;

    if (!url) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing url parameter" }),
      };
    }

    const urlValidation = validateAmazonUrl(url);
    if (!urlValidation.isValid) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: urlValidation.error }),
      };
    }

    const { partnerTag } = getAmazonCredentials();
    const parsedUrl = new URL(url);

    parsedUrl.searchParams.set("tag", partnerTag);

    const finalUrl = parsedUrl.toString();

    try {
      const clickResult = await insertAffiliateClick(
        name || null,
        finalUrl,
        partnerTag,
        suggestionId || null
      );
      if (!clickResult.success) {
        console.error("Failed to log affiliate click:", clickResult.error);
      } else {
        console.log("Logged affiliate click with ID:", clickResult.id);
      }
    } catch (err) {
      console.error("Failed to log affiliate click:", err);
    }

    return {
      statusCode: 302,
      headers: {
        ...CORS_HEADERS,
        Location: finalUrl,
      },
      body: "",
    };
  } catch (err: any) {
    console.error("aff-redirect error:", err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Redirect failed",
        message: err.message ?? "An unexpected error occurred",
      }),
    };
  }
};
