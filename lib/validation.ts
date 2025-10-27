export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateQuery(query: unknown): ValidationResult {
  if (typeof query !== "string") {
    return { isValid: false, error: "Query must be a string" };
  }

  if (query.trim().length === 0) {
    return { isValid: false, error: "Query cannot be empty" };
  }

  if (query.length > 500) {
    return { isValid: false, error: "Query too long (max 500 characters)" };
  }

  return { isValid: true };
}

export function validateUrl(url: unknown): ValidationResult {
  if (typeof url !== "string") {
    return { isValid: false, error: "URL must be a string" };
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid URL format" };
  }
}

export function validateAmazonUrl(url: string): ValidationResult {
  const urlResult = validateUrl(url);
  if (!urlResult.isValid) {
    return urlResult;
  }

  const parsedUrl = new URL(url);
  const isAmazon =
    parsedUrl.hostname.includes("amazon.") || parsedUrl.hostname.includes("amzn.");

  if (!isAmazon) {
    return { isValid: false, error: "URL must be an Amazon domain" };
  }

  return { isValid: true };
}

export function sanitizeString(input: string, maxLength: number = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "");
}

export interface ConversationContextInput {
  recipient?: unknown;
  occasion?: unknown;
  budget?: unknown;
  interests?: unknown;
}

export interface ConversationContext {
  recipient?: string;
  occasion?: string;
  budget?: string;
  interests?: string[];
}

export function validateConversationContext(
  input: ConversationContextInput
): ValidationResult & { data?: ConversationContext } {
  const context: ConversationContext = {};

  if (input.recipient !== undefined) {
    if (typeof input.recipient !== "string") {
      return { isValid: false, error: "Recipient must be a string" };
    }
    context.recipient = sanitizeString(input.recipient, 50);
  }

  if (input.occasion !== undefined) {
    if (typeof input.occasion !== "string") {
      return { isValid: false, error: "Occasion must be a string" };
    }
    context.occasion = sanitizeString(input.occasion, 50);
  }

  if (input.budget !== undefined) {
    if (typeof input.budget !== "string") {
      return { isValid: false, error: "Budget must be a string" };
    }
    context.budget = sanitizeString(input.budget, 50);
  }

  if (input.interests !== undefined) {
    if (!Array.isArray(input.interests)) {
      return { isValid: false, error: "Interests must be an array" };
    }

    if (input.interests.length > 20) {
      return { isValid: false, error: "Too many interests (max 20)" };
    }

    const allStrings = input.interests.every((i) => typeof i === "string");
    if (!allStrings) {
      return { isValid: false, error: "All interests must be strings" };
    }

    context.interests = input.interests.map((i) => sanitizeString(i as string, 50));
  }

  return { isValid: true, data: context };
}
