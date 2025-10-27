import { signPaapiRequest, buildSearchItemsPayload } from "./amazonSign";
import { getAmazonCredentials } from "./env-validation";
import { LIMITS } from "./constants";

export interface AmazonProduct {
  asin: string;
  title: string;
  image?: string;
  price?: string;
  url: string;
}

function selectBestKeywords(keywords: string | string[]): string {
  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];

  if (keywordArray.length === 0) return "";
  if (keywordArray.length === 1) return keywordArray[0];

  const scored = keywordArray.map((kw) => {
    let score = 0;
    const lower = kw.toLowerCase();

    if (lower.includes("personalized") || lower.includes("custom")) score += 3;
    if (lower.includes("premium") || lower.includes("luxury")) score += 2;
    if (lower.includes("set") || lower.includes("kit")) score += 2;
    if (lower.includes("gift")) score -= 1;

    const wordCount = kw.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 4) score += 2;
    if (wordCount > 5) score -= 1;

    return { keyword: kw, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].keyword;
}

function getCategoryHint(interests?: string[]): string {
  if (!interests || interests.length === 0) return "All";

  const categoryMap: Record<string, string> = {
    tech: "Electronics",
    sports: "Sports",
    fashion: "Fashion",
    books: "Books",
    food: "Grocery",
    travel: "Luggage",
    gaming: "VideoGames",
    music: "MusicalInstruments",
    home: "HomeAndKitchen",
    wellness: "HealthPersonalCare",
  };

  for (const interest of interests) {
    if (categoryMap[interest]) {
      return categoryMap[interest];
    }
  }

  return "All";
}

export async function searchAmazonProducts(
  keywords: string | string[],
  itemCount: number = LIMITS.AMAZON_ITEMS_TO_FETCH,
  interests?: string[]
): Promise<AmazonProduct[]> {
  try {
    getAmazonCredentials();

    const bestKeyword = selectBestKeywords(keywords);
    const searchCategory = getCategoryHint(interests);

    if (!bestKeyword) {
      console.error("No valid keywords provided");
      return [];
    }

    console.log(`Searching Amazon: "${bestKeyword}" in category: ${searchCategory}`);

    const payload = buildSearchItemsPayload({
      keywords: bestKeyword,
      itemCount,
      searchIndex: searchCategory,
    });

    const { url, options } = signPaapiRequest({ payloadObj: payload });
    const res = await fetch(url, options);
    const data = await res.json();

    if (data.Errors) {
      console.error("Amazon PA-API error:", data.Errors);
      return [];
    }

    const items = data?.SearchResult?.Items?.map((i: any) => {
      const title = i.ItemInfo?.Title?.DisplayValue || "";
      const price = i.Offers?.Listings?.[0]?.Price?.DisplayAmount || "";
      const image = i.Images?.Primary?.Medium?.URL || "";
      const url = i.DetailPageURL || "";

      return {
        asin: i.ASIN,
        title: truncateTitle(title),
        image: image || undefined,
        price: formatPrice(price),
        url,
      };
    }).filter((item: AmazonProduct) => {
      if (!item.title || !item.url) return false;
      if (isIrrelevantProduct(item.title, bestKeyword)) return false;
      return true;
    }) ?? [];

    console.log(`Amazon returned ${items.length} relevant products`);
    return items;
  } catch (error) {
    console.error("searchAmazonProducts error:", error);
    return [];
  }
}

function truncateTitle(title: string, maxLength: number = 80): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + "...";
}

function formatPrice(price: string): string | undefined {
  if (!price) return undefined;
  return price.replace(/^£/, "").trim();
}

function isIrrelevantProduct(productTitle: string, searchKeyword: string): boolean {
  const lower = productTitle.toLowerCase();
  const keywordLower = searchKeyword.toLowerCase();

  const blocklist = [
    "used",
    "renewed",
    "refurbished",
    "damaged",
    "parts only",
    "for parts",
  ];

  if (blocklist.some((term) => lower.includes(term))) {
    return true;
  }

  const keywordWords = keywordLower.split(/\s+/).filter((w) => w.length > 3);
  if (keywordWords.length > 0) {
    const hasMatchingWord = keywordWords.some((word) => lower.includes(word));
    if (!hasMatchingWord) {
      return true;
    }
  }

  return false;
}

export function generateAmazonSearchUrl(
  keywords: string | string[],
  partnerTag: string = process.env.AMAZON_PARTNER_TAG || "givoro-21"
): string {
  const bestKeyword = selectBestKeywords(keywords);
  const encoded = encodeURIComponent(bestKeyword);
  return `https://www.amazon.co.uk/s?k=${encoded}&tag=${partnerTag}`;
}
