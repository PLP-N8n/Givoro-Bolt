import type { Handler } from "@netlify/functions";
export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, body: "" };
  const text = event.body || "";
  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: text || "{}" };
};
