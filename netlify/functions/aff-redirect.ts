import type { Handler } from "@netlify/functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    const url = event.queryStringParameters?.url;
    const name = event.queryStringParameters?.name;

    if (!url) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Missing url parameter" }),
      };
    }

    const parsedUrl = new URL(url);
    const amazonTag = process.env.AMAZON_PARTNER_TAG || "purelivingp08-21";

    if (!parsedUrl.searchParams.has("tag")) {
      parsedUrl.searchParams.set("tag", amazonTag);
    }

    const existingParams = Array.from(parsedUrl.searchParams.keys());
    existingParams.forEach((key) => {
      if (key.startsWith("utm_")) {
        const value = parsedUrl.searchParams.get(key);
        if (value) {
          parsedUrl.searchParams.set(key, value);
        }
      }
    });

    const finalUrl = parsedUrl.toString();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (supabaseUrl && supabaseServiceRole) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/affiliate_clicks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceRole,
            Authorization: `Bearer ${supabaseServiceRole}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            product_name: name || null,
            product_url: finalUrl,
            affiliate_tag: amazonTag,
          }),
        });
      } catch (err) {
        console.error("Failed to log affiliate click:", err);
      }
    }

    return {
      statusCode: 302,
      headers: {
        ...corsHeaders,
        Location: finalUrl,
      },
      body: "",
    };
  } catch (err: any) {
    console.error("aff-redirect error:", err);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Redirect failed",
        message: err.message,
      }),
    };
  }
};
