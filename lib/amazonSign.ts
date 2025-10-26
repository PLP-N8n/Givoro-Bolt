// lib/amazonSign.ts
// Signs Amazon Product Advertising API v5 requests (AWS SigV4)
// Works on Netlify Functions (Node 18+). No deps besides Node's crypto.

import crypto from "crypto";

type Headers = Record<string, string>;

// Environment variables (server-side only; DO NOT expose in Vite)
const ACCESS_KEY = process.env.AMAZON_PA_ACCESS_KEY!;
const SECRET_KEY = process.env.AMAZON_PA_SECRET_KEY!;
const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG!;
const REGION = process.env.AMAZON_PA_REGION || "eu-west-1";
const HOST = process.env.AMAZON_PA_HOST || "webservices.amazon.co.uk";

// PA-API service identifiers
const SERVICE = "ProductAdvertisingAPI";

// Helpers
function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string, encoding: crypto.BinaryToTextEncoding = "hex") {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest(encoding);
}

function getAmzDates(date?: Date) {
  const now = date ?? new Date();
  // ISO8601 basic format required by AWS: YYYYMMDD'T'HHMMSS'Z'
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // 2025-10-26T15:20:35.000Z -> 20251026T152035Z
  const datestamp = amzDate.slice(0, 8); // YYYYMMDD
  return { amzDate, datestamp };
}

function canonicalHeaders(headers: Headers) {
  const lower = Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v.trim()]);
  lower.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const canonical = lower.map(([k, v]) => `${k}:${v}\n`).join("");
  const signed = lower.map(([k]) => k).join(";");
  return { canonical, signed };
}

function buildCanonicalRequest(method: string, path: string, query: string, headers: Headers, payload: string) {
  const { canonical, signed } = canonicalHeaders(headers);
  const payloadHash = sha256Hex(payload);
  return [
    method.toUpperCase(),
    path,
    query, // must be pre-encoded if present
    canonical,
    signed,
    payloadHash,
  ].join("\n");
}

function buildStringToSign(amzDate: string, datestamp: string, region: string, canonicalRequest: string) {
  const scope = `${datestamp}/${region}/${SERVICE}/aws4_request`;
  return [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
}

function getSigningKey(secretKey: string, datestamp: string, region: string) {
  const kDate = crypto.createHmac("sha256", "AWS4" + secretKey).update(datestamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(SERVICE).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  return kSigning;
}

// Public: build a signed fetch config for PA-API v5 SearchItems (or other endpoints)
export function signPaapiRequest(
  {
    method = "POST",
    path = "/paapi5/searchitems", // default endpoint path (don’t include https://host)
    queryString = "",             // e.g. "PartnerTag=...&PartnerType=Associates"
    payloadObj,
  }: {
    method?: "POST" | "GET";
    path?: string;
    queryString?: string;
    payloadObj: Record<string, any>;
  }
) {
  if (!ACCESS_KEY || !SECRET_KEY || !PARTNER_TAG) {
    throw new Error("Missing Amazon PA credentials. Check environment variables.");
  }

  // Ensure required partner fields are present in payload
  const payload = JSON.stringify({
    PartnerTag: PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: "www.amazon.co.uk",
    ...payloadObj,
  });

  const { amzDate, datestamp } = getAmzDates();
  const host = HOST;
  const headersBase: Headers = {
    "content-encoding": "amz-1.0",
    "content-type": "application/json; charset=UTF-8",
    host,
    "x-amz-date": amzDate,
  };

  // Canonical request
  const canonical = buildCanonicalRequest(method, path, queryString, headersBase, payload);

  // String to sign
  const stringToSign = buildStringToSign(amzDate, datestamp, REGION, canonical);

  // Signature
  const signingKey = getSigningKey(SECRET_KEY, datestamp, REGION);
  const signature = hmac(signingKey, stringToSign);

  const signedHeaders = canonicalHeaders(headersBase).signed;
  const credentialScope = `${datestamp}/${REGION}/${SERVICE}/aws4_request`;

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Final headers for fetch
  const headers: Headers = {
    ...headersBase,
    Authorization: authorization,
  };

  // Build URL
  const url = `https://${host}${path}${queryString ? `?${queryString}` : ""}`;

  return {
    url,
    options: {
      method,
      headers,
      body: payload,
    } as RequestInit,
  };
}

// Convenience builder for common SearchItems call
export function buildSearchItemsPayload({
  keywords,
  itemCount = 10,
  resources = [
    "Images.Primary.Medium",
    "ItemInfo.Title",
    "Offers.Listings.Price",
  ],
  searchIndex = "All",
}: {
  keywords: string;
  itemCount?: number;
  resources?: string[];
  searchIndex?: string;
}) {
  return {
    Keywords: keywords,
    ItemCount: itemCount,
    Resources: resources,
    SearchIndex: searchIndex,
  };
}
