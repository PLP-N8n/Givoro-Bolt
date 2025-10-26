import type { Handler } from "@netlify/functions";
const KEYS = ["GEMINI_API_KEY","SUPABASE_URL","SUPABASE_SERVICE_ROLE","AMAZON_PA_ACCESS_KEY","AMAZON_PA_SECRET_KEY","AMAZON_PARTNER_TAG","AMAZON_PA_REGION","AMAZON_PA_HOST"];
export const handler: Handler = async () => {
  const present = Object.fromEntries(KEYS.map(k => [k, Boolean(process.env[k])]));
  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(present) };
};
