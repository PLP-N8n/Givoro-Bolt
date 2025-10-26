import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

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

  const health: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: {
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasSupabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE),
      hasAmazonAccess: Boolean(process.env.AMAZON_PA_ACCESS_KEY),
      hasAmazonSecret: Boolean(process.env.AMAZON_PA_SECRET_KEY),
      hasAmazonTag: Boolean(process.env.AMAZON_PARTNER_TAG),
    },
    database: {
      connected: false,
      tablesAccessible: false,
    },
  };

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    if (supabaseUrl && supabaseServiceRole) {
      const supabase = createClient(supabaseUrl, supabaseServiceRole);

      const { count: suggestionsCount, error: suggestionsError } = await supabase
        .from("gift_suggestions")
        .select("*", { count: "exact", head: true });

      const { count: clicksCount, error: clicksError } = await supabase
        .from("affiliate_clicks")
        .select("*", { count: "exact", head: true });

      if (!suggestionsError && !clicksError) {
        health.database.connected = true;
        health.database.tablesAccessible = true;
        health.database.giftSuggestionsCount = suggestionsCount;
        health.database.affiliateClicksCount = clicksCount;
      } else {
        health.database.error =
          suggestionsError?.message || clicksError?.message || "Unknown error";
        health.status = "degraded";
      }
    } else {
      health.database.error = "Supabase credentials not configured";
      health.status = "degraded";
    }
  } catch (err: any) {
    health.database.error = err.message;
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;

  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(health, null, 2),
  };
};
