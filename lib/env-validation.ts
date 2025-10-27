export interface RequiredEnvVars {
  [key: string]: string | undefined;
}

export function validateEnvVars(vars: RequiredEnvVars): void {
  const missing = Object.entries(vars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
      `Please configure these in Netlify environment settings.`
    );
  }
}

export function getAmazonCredentials() {
  const credentials = {
    AMAZON_PA_ACCESS_KEY: process.env.AMAZON_PA_ACCESS_KEY,
    AMAZON_PA_SECRET_KEY: process.env.AMAZON_PA_SECRET_KEY,
    AMAZON_PARTNER_TAG: process.env.AMAZON_PARTNER_TAG,
  };

  validateEnvVars(credentials);

  return {
    accessKey: credentials.AMAZON_PA_ACCESS_KEY!,
    secretKey: credentials.AMAZON_PA_SECRET_KEY!,
    partnerTag: credentials.AMAZON_PARTNER_TAG!,
  };
}

export function getSupabaseCredentials() {
  const credentials = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
  };

  validateEnvVars(credentials);

  return {
    url: credentials.SUPABASE_URL!,
    serviceRole: credentials.SUPABASE_SERVICE_ROLE!,
  };
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required. " +
      "Please configure it in Netlify environment settings."
    );
  }

  return key;
}
