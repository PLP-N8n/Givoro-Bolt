import { useEffect, useState } from "react";
import { Gift, Sparkles, RefreshCw } from "lucide-react";
import { postIdeas } from "./api";
import { useConversation } from "./hooks/useConversation";
import { ChatMessage } from "./components/ChatMessage";
import { OptionButton } from "./components/OptionButton";
import { TypingIndicator } from "./components/TypingIndicator";
import { ProgressIndicator } from "./components/ProgressIndicator";
import {
  RECIPIENT_OPTIONS,
  OCCASION_OPTIONS,
  BUDGET_OPTIONS,
  INTEREST_OPTIONS,
} from "./types/conversation";

type GiftSuggestion = {
  title: string;
  reason: string;
  keywords: string[];
  products?: Array<{ title?: string; price?: string; image?: string; url?: string }>;
};

function App() {
  const {
    state,
    setState,
    messages,
    conversationData,
    isTyping,
    messagesEndRef,
    handleRecipientSelect,
    handleOccasionSelect,
    handleBudgetSelect,
    handleInterestsSelect,
    handleInterestsConfirm,
    startConversation,
    resetConversation,
    getCurrentStep,
  } = useConversation();

  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (state === "LOADING") {
      const fetchSuggestions = async () => {
        setErr(null);
        setSuggestions([]);

        const query = buildQuery();

        try {
          const result = await postIdeas(query, conversationData);
          setSuggestions(result.suggestions || []);
          setState("RESULTS");
        } catch (e: any) {
          setErr(e.message || "Failed to get gift ideas. Please try again.");
          setState("RESULTS");
        }
      };

      setTimeout(() => {
        fetchSuggestions();
      }, 1500);
    }
  }, [state]);

  const buildQuery = (): string => {
    const { recipient, occasion, budget, interests } = conversationData;
    const parts: string[] = [];

    if (recipient) parts.push(`for ${recipient}`);
    if (occasion) parts.push(`${occasion}`);
    if (budget) parts.push(formatBudget(budget));
    if (interests?.length) parts.push(`interested in ${interests.join(", ")}`);

    return parts.join(" ");
  };

  const formatBudget = (budget: string): string => {
    const budgetMap: Record<string, string> = {
      under_20: "under £20",
      "20_50": "£20-50",
      "50_100": "£50-100",
      "100_200": "£100-200",
      "200_plus": "over £200",
    };
    return budgetMap[budget] || budget;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {import.meta.env.VITE_APP_NAME || "Givoro"}
            </h1>
          </div>
          {state !== "GREET" && state !== "LOADING" && (
            <button
              onClick={resetConversation}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {state === "GREET" && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Gift Recommendations</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find the Perfect Gift
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                in Seconds
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Tell us who you're shopping for and we'll suggest thoughtful gifts they'll love
            </p>
            <button
              onClick={startConversation}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Start Finding Gifts
            </button>

            <div className="grid md:grid-cols-3 gap-8 text-center mt-16">
              <div className="p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI-Powered</h3>
                <p className="text-gray-600 text-sm">
                  Our AI analyzes your request to suggest the most relevant gifts
                </p>
              </div>
              <div className="p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Personalized</h3>
                <p className="text-gray-600 text-sm">
                  Every suggestion is tailored to your recipient and budget
                </p>
              </div>
              <div className="p-6">
                <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fast & Easy</h3>
                <p className="text-gray-600 text-sm">
                  Get personalized suggestions in under a minute
                </p>
              </div>
            </div>
          </div>
        )}

        {state !== "GREET" && state !== "RESULTS" && (
          <div className="max-w-2xl mx-auto">
            <ProgressIndicator currentStep={getCurrentStep()} totalSteps={4} />

            <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[400px] flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {!isTyping && state === "RECIPIENT" && (
                <div className="flex flex-wrap gap-2">
                  {RECIPIENT_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      label={option.label}
                      onClick={() => handleRecipientSelect(option.value)}
                    />
                  ))}
                </div>
              )}

              {!isTyping && state === "OCCASION" && (
                <div className="flex flex-wrap gap-2">
                  {OCCASION_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      label={option.label}
                      onClick={() => handleOccasionSelect(option.value)}
                    />
                  ))}
                </div>
              )}

              {!isTyping && state === "BUDGET" && (
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map((option) => (
                    <OptionButton
                      key={option.value}
                      label={option.label}
                      onClick={() => handleBudgetSelect(option.value)}
                    />
                  ))}
                </div>
              )}

              {!isTyping && state === "INTERESTS" && (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {INTEREST_OPTIONS.map((option) => {
                      const isSelected = conversationData.interests?.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleInterestsSelect(option.value)}
                          className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-transparent"
                              : "bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleInterestsConfirm}
                    disabled={!conversationData.interests?.length}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Continue ({conversationData.interests?.length || 0} selected)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {state === "LOADING" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Finding Perfect Gifts...
              </h3>
              <p className="text-gray-600">Our AI is curating personalized suggestions for you</p>
            </div>
          </div>
        )}

        {state === "RESULTS" && (
          <div className="max-w-6xl mx-auto">
            {err && (
              <div className="mb-8 border-2 border-red-200 bg-red-50 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {err}
                </p>
              </div>
            )}

            {suggestions.length > 0 && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Here are {suggestions.length} gift ideas for you
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((gift, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 mb-1">
                              {gift.title}
                            </h4>
                            <p className="text-sm text-gray-600">{gift.reason}</p>
                          </div>
                        </div>
                        {gift.products && gift.products.length > 0 && (
                          <div className="border-t pt-4 mt-4">
                            {gift.products.map((product, pidx) => {
                              const redirectUrl = `/api/aff-redirect?url=${encodeURIComponent(
                                product.url || ""
                              )}&name=${encodeURIComponent(product.title || "")}`;
                              return (
                                <a
                                  key={pidx}
                                  href={redirectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
                                >
                                  {product.image && (
                                    <img
                                      src={product.image}
                                      alt={product.title}
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {product.title}
                                    </p>
                                    {product.price && (
                                      <p className="text-sm font-semibold text-blue-600">
                                        {product.price}
                                      </p>
                                    )}
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {gift.keywords && gift.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {gift.keywords.slice(0, 3).map((kw, kidx) => (
                              <span
                                key={kidx}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            © 2025 {import.meta.env.VITE_APP_NAME || "Givoro"}. Find the perfect gift with AI.
          </p>
          <p className="text-xs text-gray-500">
            As an Amazon Associate, we earn from qualifying purchases.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
