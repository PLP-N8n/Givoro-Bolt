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

  if (process.env.NODE_ENV === "production") {
    return {
      statusCode: 403,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Debug endpoint disabled in production" }),
    };
  }

  const envStatus = {
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE,
    AMAZON_PA_ACCESS_KEY: !!process.env.AMAZON_PA_ACCESS_KEY,
    AMAZON_PA_SECRET_KEY: !!process.env.AMAZON_PA_SECRET_KEY,
    AMAZON_PARTNER_TAG: !!process.env.AMAZON_PARTNER_TAG,
    AMAZON_PA_REGION: !!process.env.AMAZON_PA_REGION,
    AMAZON_PA_HOST: !!process.env.AMAZON_PA_HOST,
  };

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envStatus),
  };
};
