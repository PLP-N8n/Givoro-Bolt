import { SupabaseClient } from "@supabase/supabase-js";

export interface SessionData {
  id: string;
  started_at: string;
  last_activity_at: string;
  user_agent?: string;
  ip_address?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  completed_steps: string[];
  converted: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  session_ids: string[];
  favorite_recipients: Array<{ name: string; count: number }>;
  typical_budget?: string;
  interests: string[];
  total_suggestions_viewed: number;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

export async function createSession(
  supabase: SupabaseClient,
  data: {
    user_agent?: string;
    ip_address?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }
): Promise<{ data: SessionData | null; error: any }> {
  const { data: session, error } = await supabase
    .from("sessions")
    .insert([
      {
        user_agent: data.user_agent,
        ip_address: data.ip_address,
        utm_source: data.utm_source,
        utm_medium: data.utm_medium,
        utm_campaign: data.utm_campaign,
        completed_steps: [],
        converted: false,
      },
    ])
    .select()
    .single();

  return { data: session, error };
}

export async function updateSession(
  supabase: SupabaseClient,
  sessionId: string,
  updates: {
    completed_steps?: string[];
    converted?: boolean;
    last_activity_at?: string;
  }
): Promise<{ data: SessionData | null; error: any }> {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ...updates,
      last_activity_at: updates.last_activity_at || new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single();

  return { data, error };
}

export async function markSessionConverted(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ success: boolean; error: any }> {
  const { error } = await supabase
    .from("sessions")
    .update({
      converted: true,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return { success: !error, error };
}

export async function getOrCreateUserProfile(
  supabase: SupabaseClient,
  email?: string
): Promise<{ data: UserProfile | null; error: any }> {
  if (!email) {
    return { data: null, error: new Error("Email is required") };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  if (existing) {
    return { data: existing, error: null };
  }

  const { data: newProfile, error: createError } = await supabase
    .from("user_profiles")
    .insert([
      {
        email,
        session_ids: [],
        favorite_recipients: [],
        interests: [],
        total_suggestions_viewed: 0,
        total_clicks: 0,
      },
    ])
    .select()
    .single();

  return { data: newProfile, error: createError };
}

export async function addSessionToProfile(
  supabase: SupabaseClient,
  profileId: string,
  sessionId: string
): Promise<{ success: boolean; error: any }> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("session_ids")
    .eq("id", profileId)
    .single();

  if (!profile) {
    return {
      success: false,
      error: new Error("Profile not found"),
    };
  }

  const updatedSessionIds = [...profile.session_ids, sessionId];

  const { error } = await supabase
    .from("user_profiles")
    .update({
      session_ids: updatedSessionIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  return { success: !error, error };
}

export async function incrementProfileStats(
  supabase: SupabaseClient,
  profileId: string,
  type: "suggestions" | "clicks"
): Promise<{ success: boolean; error: any }> {
  const field =
    type === "suggestions" ? "total_suggestions_viewed" : "total_clicks";

  const { data: profile } = await supabase
    .from("user_profiles")
    .select(field)
    .eq("id", profileId)
    .single();

  if (!profile) {
    return {
      success: false,
      error: new Error("Profile not found"),
    };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      [field]: profile[field] + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  return { success: !error, error };
}

export async function updateProfileInterests(
  supabase: SupabaseClient,
  profileId: string,
  newInterests: string[]
): Promise<{ success: boolean; error: any }> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("interests")
    .eq("id", profileId)
    .single();

  if (!profile) {
    return {
      success: false,
      error: new Error("Profile not found"),
    };
  }

  const uniqueInterests = Array.from(
    new Set([...profile.interests, ...newInterests])
  );

  const { error } = await supabase
    .from("user_profiles")
    .update({
      interests: uniqueInterests,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  return { success: !error, error };
}

export async function trackRecipient(
  supabase: SupabaseClient,
  profileId: string,
  recipientName: string
): Promise<{ success: boolean; error: any }> {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("favorite_recipients")
    .eq("id", profileId)
    .single();

  if (!profile) {
    return {
      success: false,
      error: new Error("Profile not found"),
    };
  }

  const recipients = profile.favorite_recipients as Array<{
    name: string;
    count: number;
  }>;
  const existingIndex = recipients.findIndex(
    (r) => r.name.toLowerCase() === recipientName.toLowerCase()
  );

  let updatedRecipients;
  if (existingIndex >= 0) {
    updatedRecipients = [...recipients];
    updatedRecipients[existingIndex].count += 1;
  } else {
    updatedRecipients = [...recipients, { name: recipientName, count: 1 }];
  }

  updatedRecipients.sort((a, b) => b.count - a.count);

  const { error } = await supabase
    .from("user_profiles")
    .update({
      favorite_recipients: updatedRecipients,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  return { success: !error, error };
}
