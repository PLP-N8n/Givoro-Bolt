import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error("Supabase admin credentials not configured");
  }

  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function insertGiftSuggestion(
  query: string,
  aiResponse: any
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("gift_suggestions")
      .insert([
        {
          query,
          ai_response: aiResponse,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("insertGiftSuggestion error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("insertGiftSuggestion exception:", err);
    return { success: false, error: err.message };
  }
}

export async function insertAffiliateClick(
  productName: string | null,
  productUrl: string,
  affiliateTag: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("affiliate_clicks")
      .insert([
        {
          product_name: productName,
          product_url: productUrl,
          affiliate_tag: affiliateTag,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("insertAffiliateClick error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("insertAffiliateClick exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getRecentSuggestions(
  limit: number = 10
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("gift_suggestions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getRecentSuggestions error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error("getRecentSuggestions exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getClickStats(): Promise<{
  success: boolean;
  stats?: {
    totalClicks: number;
    clicksByTag: Record<string, number>;
    recentClicks: any[];
  };
  error?: string;
}> {
  try {
    const supabase = getAdminClient();

    const { data: allClicks, error: allError } = await supabase
      .from("affiliate_clicks")
      .select("*");

    if (allError) {
      console.error("getClickStats error:", allError);
      return { success: false, error: allError.message };
    }

    const { data: recentClicks, error: recentError } = await supabase
      .from("affiliate_clicks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentError) {
      console.error("getClickStats recent error:", recentError);
      return { success: false, error: recentError.message };
    }

    const clicksByTag: Record<string, number> = {};
    allClicks?.forEach((click: any) => {
      const tag = click.affiliate_tag || "unknown";
      clicksByTag[tag] = (clicksByTag[tag] || 0) + 1;
    });

    return {
      success: true,
      stats: {
        totalClicks: allClicks?.length || 0,
        clicksByTag,
        recentClicks: recentClicks || [],
      },
    };
  } catch (err: any) {
    console.error("getClickStats exception:", err);
    return { success: false, error: err.message };
  }
}
