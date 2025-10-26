import type { Product, Suggestion } from "./types";

const API_BASE = "/api";

export async function searchAmazon(query: string): Promise<{ query: string; count: number; items: Product[] }> {
  const response = await fetch(`${API_BASE}/amazon-search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Amazon search failed");
  }

  return response.json();
}

export async function getSuggestions(input: {
  query?: string;
  occasion?: string;
  recipient?: string;
  budget?: string;
  interests?: string[];
}): Promise<{ suggestions: Suggestion[]; saved: boolean }> {
  const response = await fetch(`${API_BASE}/ai/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get suggestions");
  }

  return response.json();
}

export function getAffiliateLink(url: string, name?: string): string {
  const params = new URLSearchParams({ url });
  if (name) {
    params.set("name", name);
  }
  return `${API_BASE}/aff/redirect?${params.toString()}`;
}
