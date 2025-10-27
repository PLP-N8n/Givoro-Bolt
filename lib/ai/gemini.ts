import { TIMING, LIMITS } from "../constants";

export type GiftIdea = { title: string; reason: string; keywords: string[] };

type ConversationContext = {
  recipient?: string;
  occasion?: string;
  budget?: string;
  interests?: string[];
};

const MODEL = "gemini-1.5-flash";

function buildStructuredPrompt(query: string, context?: ConversationContext): string {
  const occasionGuidance = getOccasionGuidance(context?.occasion);
  const budgetGuidance = getBudgetGuidance(context?.budget);

  return `You are an expert gift recommendation assistant with deep knowledge of thoughtful, creative gift ideas.

User Request: "${query}"

${context ? buildContextSection(context) : ''}

${occasionGuidance}
${budgetGuidance}

Your task:
- Generate 6 diverse, thoughtful gift ideas
- Each gift should be specific and actionable (not generic categories)
- Reasons should be personal and explain why this matches their interests/occasion
- Keywords should be 2-4 specific product search terms (not generic words)
- Consider the recipient's interests deeply
- Mix practical gifts with more creative/unique options

Examples of GOOD suggestions:
{
  "title": "Personalized Leather Journal with Custom Embossing",
  "reason": "Perfect for someone who loves writing and reflection. The leather ages beautifully and the embossing makes it a keepsake.",
  "keywords": ["personalized leather journal", "custom embossed notebook", "handmade leather diary"]
}

{
  "title": "Premium Pour-Over Coffee Set with Local Beans",
  "reason": "Ideal for the coffee enthusiast who appreciates craft. Includes everything needed for the perfect morning ritual.",
  "keywords": ["pour over coffee set", "ceramic dripper", "specialty coffee beans"]
}

Return ONLY a JSON array with this EXACT structure (no markdown, no code fences, no explanations):
[
  {"title": "Specific Gift Name", "reason": "Personal reason why this is perfect", "keywords": ["searchable", "product", "terms"]},
  ...
]

IMPORTANT:
- Be specific ("Noise-Cancelling Headphones" not "Headphones")
- Make keywords searchable on Amazon
- Ensure variety in price points within the budget
- NO generic suggestions like "Gift Card" or "Subscription Box"`;
}

function buildContextSection(context: ConversationContext): string {
  const parts: string[] = [];

  if (context.recipient) {
    parts.push(`Recipient: ${formatRecipient(context.recipient)}`);
  }
  if (context.occasion) {
    parts.push(`Occasion: ${formatOccasion(context.occasion)}`);
  }
  if (context.budget) {
    parts.push(`Budget: ${formatBudget(context.budget)}`);
  }
  if (context.interests?.length) {
    parts.push(`Interests: ${context.interests.map(formatInterest).join(", ")}`);
  }

  return parts.length > 0 ? `Context:\n${parts.join("\n")}\n` : "";
}

function formatRecipient(recipient: string): string {
  const map: Record<string, string> = {
    partner: "Romantic Partner",
    parent: "Parent/Mother/Father",
    friend: "Close Friend",
    colleague: "Work Colleague",
    child: "Child",
    sibling: "Brother/Sister",
  };
  return map[recipient] || recipient;
}

function formatOccasion(occasion: string): string {
  const map: Record<string, string> = {
    birthday: "Birthday",
    anniversary: "Anniversary",
    christmas: "Christmas",
    valentines: "Valentine's Day",
    thank_you: "Thank You Gift",
    just_because: "Just Because / Surprise",
  };
  return map[occasion] || occasion;
}

function formatBudget(budget: string): string {
  const map: Record<string, string> = {
    under_20: "Under £20 (Budget-Friendly)",
    "20_50": "£20-50 (Mid-Range)",
    "50_100": "£50-100 (Premium)",
    "100_200": "£100-200 (Luxury)",
    "200_plus": "£200+ (High-End)",
  };
  return map[budget] || budget;
}

function formatInterest(interest: string): string {
  const map: Record<string, string> = {
    sports: "Sports & Fitness",
    tech: "Technology & Gadgets",
    fashion: "Fashion & Beauty",
    books: "Books & Reading",
    food: "Food & Cooking",
    travel: "Travel & Adventure",
    gaming: "Gaming",
    music: "Music & Arts",
    home: "Home & Garden",
    wellness: "Wellness & Self-Care",
  };
  return map[interest] || interest;
}

function getOccasionGuidance(occasion?: string): string {
  if (!occasion) return "";

  const guidance: Record<string, string> = {
    birthday: "Focus on celebratory, personal gifts that show you know them well. Consider milestone birthdays.",
    anniversary: "Emphasize romantic, sentimental gifts that celebrate the relationship. Traditional anniversary gifts are appropriate.",
    christmas: "Festive gifts that bring joy and warmth. Can be practical or indulgent. Consider family-friendly options.",
    valentines: "Romantic, thoughtful gifts that express affection. Focus on experiences and personal touches.",
    thank_you: "Gifts that show appreciation and gratitude. Should be thoughtful but not overly personal.",
    just_because: "Surprise gifts that show you're thinking of them. Can be playful, practical, or indulgent.",
  };

  return guidance[occasion] ? `Occasion Guidance: ${guidance[occasion]}\n` : "";
}

function getBudgetGuidance(budget?: string): string {
  if (!budget) return "";

  const guidance: Record<string, string> = {
    under_20: "Focus on thoughtful, creative gifts with personality. Quality over quantity.",
    "20_50": "Balance quality and variety. Can suggest complete sets or starter kits.",
    "50_100": "Premium quality gifts that feel special. Can suggest brand names and high-quality items.",
    "100_200": "Luxury items that make a statement. Focus on exceptional quality and uniqueness.",
    "200_plus": "High-end, investment pieces. Designer brands, experiences, and premium products are appropriate.",
  };

  return guidance[budget] ? `Budget Guidance: ${guidance[budget]}\n` : "";
}

function repairJSON(text: string): string {
  let repaired = text.trim();

  repaired = repaired.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  const jsonMatch = repaired.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonMatch) {
    repaired = jsonMatch[0];
  }

  repaired = repaired.replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}");

  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  return repaired;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFallbackSuggestions(query: string): GiftIdea[] {
  return [
    {
      title: "Personalized Gift Set",
      reason: "A thoughtful collection tailored to their interests",
      keywords: ["personalized gift", "custom gift set"],
    },
    {
      title: "Premium Quality Item in Their Hobby",
      reason: "Something they'll use and appreciate based on what they love",
      keywords: ["premium", "quality", "gift"],
    },
    {
      title: "Experience or Activity Gift",
      reason: "Create memories together with a shared experience",
      keywords: ["experience gift", "activity voucher"],
    },
    {
      title: "Artisan or Handcrafted Item",
      reason: "Unique, one-of-a-kind piece with character",
      keywords: ["artisan", "handcrafted", "handmade"],
    },
    {
      title: "Luxury Everyday Essential",
      reason: "Upgrade something they use daily to premium quality",
      keywords: ["luxury", "premium", "essential"],
    },
    {
      title: "Subscription Service",
      reason: "A gift that keeps giving throughout the year",
      keywords: ["subscription box", "monthly delivery"],
    },
  ];
}

export async function getGiftIdeasFromGemini(
  apiKey: string,
  query: string,
  context?: ConversationContext
): Promise<GiftIdea[]> {
  const prompt = buildStructuredPrompt(query, context);

  for (let attempt = 0; attempt < TIMING.GEMINI_MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Gemini API error (attempt ${attempt + 1}):`, res.status, errorText);

        if (res.status === 429 && attempt < TIMING.GEMINI_MAX_RETRIES - 1) {
          const delay = TIMING.GEMINI_BASE_DELAY * Math.pow(2, attempt);
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        if (attempt === TIMING.GEMINI_MAX_RETRIES - 1) {
          console.log("Max retries reached, returning fallback suggestions");
          return getFallbackSuggestions(query);
        }
        continue;
      }

      const data = await res.json();

      if (data?.promptFeedback?.blockReason) {
        console.error("Content blocked:", data.promptFeedback.blockReason);
        return getFallbackSuggestions(query);
      }

      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.error("No text in Gemini response:", JSON.stringify(data));
        if (attempt < TIMING.GEMINI_MAX_RETRIES - 1) {
          await sleep(TIMING.GEMINI_BASE_DELAY);
          continue;
        }
        return getFallbackSuggestions(query);
      }

      text = repairJSON(text);

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        console.error(`JSON parse error (attempt ${attempt + 1}):`, parseError);
        console.error("Failed text:", text.substring(0, 200));

        if (attempt < TIMING.GEMINI_MAX_RETRIES - 1) {
          await sleep(TIMING.GEMINI_BASE_DELAY);
          continue;
        }
        return getFallbackSuggestions(query);
      }

      if (!Array.isArray(parsed)) {
        console.error("Gemini response not an array:", text.substring(0, 200));
        if (attempt < TIMING.GEMINI_MAX_RETRIES - 1) {
          await sleep(TIMING.GEMINI_BASE_DELAY);
          continue;
        }
        return getFallbackSuggestions(query);
      }

      const validated = parsed.filter(
        (item) =>
          item &&
          typeof item.title === "string" &&
          item.title.trim().length > 0 &&
          typeof item.reason === "string" &&
          item.reason.trim().length > 0 &&
          Array.isArray(item.keywords) &&
          item.keywords.length > 0 &&
          item.keywords.every((kw: any) => typeof kw === "string")
      );

      if (validated.length === 0) {
        console.error("No valid suggestions after validation");
        if (attempt < TIMING.GEMINI_MAX_RETRIES - 1) {
          await sleep(TIMING.GEMINI_BASE_DELAY);
          continue;
        }
        return getFallbackSuggestions(query);
      }

      return validated.slice(0, LIMITS.MAX_SUGGESTIONS);
    } catch (error) {
      console.error(`getGiftIdeasFromGemini error (attempt ${attempt + 1}):`, error);

      if (attempt < TIMING.GEMINI_MAX_RETRIES - 1) {
        const delay = TIMING.GEMINI_BASE_DELAY * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      return getFallbackSuggestions(query);
    }
  }

  return getFallbackSuggestions(query);
}
