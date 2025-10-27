import { getOrCreateSessionId } from "./utils/session";

type ConversationContext = {
  recipient?: string;
  occasion?: string;
  budget?: string;
  interests?: string[];
};

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }

      const delay = BASE_DELAY * Math.pow(2, attempt);
      console.log(`Fetch failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error("Max retries exceeded");
}

export async function postIdeas(query: string, context?: ConversationContext) {
  const sessionId = getOrCreateSessionId();

  try {
    const res = await fetchWithRetry(
      "/api/ai-suggest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": sessionId,
        },
        body: JSON.stringify({ query, sessionId, ...context }),
      },
      MAX_RETRIES
    );

    const text = await res.text();
    let json: any = {};

    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { error: "Invalid response format", raw: text };
    }

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          "API endpoint not found. Please deploy to Netlify or run 'netlify dev' for local testing."
        );
      }

      if (res.status === 400) {
        throw new Error(json?.error || "Invalid request. Please check your input.");
      }

      if (res.status === 500) {
        throw new Error(json?.error || "Server error. Please try again in a moment.");
      }

      throw new Error(json?.error || json?.message || `Request failed (HTTP ${res.status})`);
    }

    return json;
  } catch (error: any) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Network error. Please check your internet connection and try again."
      );
    }

    throw error;
  }
}
