export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
} as const;

export const TIMING = {
  BOT_TYPING_DELAY: 800,
  LOADING_DISPLAY_DELAY: 1500,
  GEMINI_MAX_RETRIES: 3,
  GEMINI_BASE_DELAY: 1000,
  AMAZON_REQUEST_TIMEOUT: 5000,
} as const;

export const LIMITS = {
  MAX_SUGGESTIONS: 6,
  MAX_PRODUCTS_PER_SUGGESTION: 1,
  AMAZON_ITEMS_TO_FETCH: 6,
} as const;
