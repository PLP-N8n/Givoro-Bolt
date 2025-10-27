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

export async function searchAmazonProducts(
  keywords: string,
  itemCount: number = LIMITS.AMAZON_ITEMS_TO_FETCH
): Promise<AmazonProduct[]> {
  try {
    getAmazonCredentials();

    const payload = buildSearchItemsPayload({
      keywords,
      itemCount,
    });

    const { url, options } = signPaapiRequest({ payloadObj: payload });
    const res = await fetch(url, options);
    const data = await res.json();

    if (data.Errors) {
      console.error("Amazon PA-API error:", data.Errors);
      return [];
    }

    const items = data?.SearchResult?.Items?.map((i: any) => ({
      asin: i.ASIN,
      title: i.ItemInfo?.Title?.DisplayValue,
      image: i.Images?.Primary?.Medium?.URL,
      price: i.Offers?.Listings?.[0]?.Price?.DisplayAmount,
      url: i.DetailPageURL,
    })) ?? [];

    return items;
  } catch (error) {
    console.error("searchAmazonProducts error:", error);
    return [];
  }
}
