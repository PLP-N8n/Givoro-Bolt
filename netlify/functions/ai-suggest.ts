import type { Handler } from "@netlify/functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface SuggestionInput {
  occasion?: string;
  recipient?: string;
  budget?: string;
  interests?: string[];
  query?: string;
}

interface GeminiIdea {
  title: string;
  reason: string;
  keywords: string[];
}

interface Product {
  asin: string;
  title: string;
  image?: string;
  price?: string;
  url: string;
}

interface Suggestion extends GeminiIdea {
  products: Product[];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Request body required" }),
      };
    }

    const input: SuggestionInput = JSON.parse(event.body);
    const { occasion, recipient, budget, interests, query } = input;

    if (!query && !occasion && !recipient) {
      return {
        statusCode: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Must provide either 'query' or gift details (occasion, recipient, etc.)",
        }),
      };
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY not configured");
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "AI service not configured" }),
      };
    }

    let promptText = "";
    if (query) {
      promptText = `Generate 6-10 thoughtful gift suggestions for: "${query}". Each suggestion should include a title, reason why it's a good gift, and relevant keywords for finding it on Amazon UK.`;
    } else {
      promptText = `Generate 6-10 thoughtful gift suggestions for:\n- Recipient: ${recipient || "someone special"}\n- Occasion: ${occasion || "general gift"}\n- Budget: ${budget || "flexible"}\n- Interests: ${interests?.join(", ") || "various"}.\n\nEach suggestion should include a title, reason why it's a good gift, and relevant keywords for finding it on Amazon UK.`;
    }

    promptText += `\n\nRespond with valid JSON only, in this exact format:\n{\n  "suggestions": [\n    {\n      "title": "Gift idea name",\n      "reason": "Why this is a great gift",\n      "keywords": ["keyword1", "keyword2", "keyword3"]\n    }\n  ]\n}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "AI generation failed" }),
      };
    }

    const geminiData = await geminiResponse.json();
    let responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let geminiIdeas: GeminiIdea[];
    try {
      const parsed = JSON.parse(responseText);
      geminiIdeas = parsed.suggestions || [];
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "AI response format error" }),
      };
    }

    geminiIdeas = geminiIdeas.slice(0, 10);

    const suggestions: Suggestion[] = await Promise.all(
      geminiIdeas.map(async (idea) => {
        const searchQuery = idea.keywords.join(" ");
        const products: Product[] = [];

        try {
          const amazonUrl = `${process.env.URL || "http://localhost:8888"}/.netlify/functions/amazon-search?q=${encodeURIComponent(searchQuery)}`;
          const amazonResponse = await fetch(amazonUrl);

          if (amazonResponse.ok) {
            const amazonData = await amazonResponse.json();
            products.push(...(amazonData.items || []).slice(0, 2));
          }
        } catch (err) {
          console.error(`Amazon search failed for "${searchQuery}":`, err);
        }

        return {
          ...idea,
          products,
        };
      })
    );

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    let saved = false;
    if (supabaseUrl && supabaseServiceRole) {
      try {
        const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/gift_suggestions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceRole,
            Authorization: `Bearer ${supabaseServiceRole}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            query: query || JSON.stringify({ occasion, recipient, budget, interests }),
            ai_response: { suggestions },
          }),
        });

        if (supabaseResponse.ok) {
          saved = true;
        } else {
          console.error("Failed to save to Supabase:", await supabaseResponse.text());
        }
      } catch (err) {
        console.error("Supabase save error:", err);
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ suggestions, saved }),
    };
  } catch (err: any) {
    console.error("ai-suggest error:", err);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Gift suggestion failed",
        message: err.message,
      }),
    };
  }
};
