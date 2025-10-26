import { useState, FormEvent } from "react";
import { postIdeas } from "./api";
import { Gift, Sparkles, Heart } from "lucide-react";

type GiftSuggestion = {
  title: string;
  reason: string;
  keywords: string[];
  products?: Array<{ title?: string; price?: string; image?: string; url?: string }>;
};

function App() {
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;

    setErr(null);
    setSuggestions([]);
    setLoading(true);

    try {
      const result = await postIdeas(q.trim());
      setSuggestions(result.suggestions || []);
    } catch (e: any) {
      setErr(e.message || "Failed to get gift ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {import.meta.env.VITE_APP_NAME || "Givoro"}
            </h1>
          </div>
          <nav className="flex items-center gap-3">
            <a href="/login" className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800">
              Sign In
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us who you're shopping for and we'll suggest thoughtful gifts they'll love
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={onSubmit} className="max-w-3xl mx-auto mb-12">
          <div className="bg-white border-2 rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g., for wife under £50, birthday gift for dad who loves golf"
                  className="w-full pl-10 h-12 text-base border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !q.trim()}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Finding Gifts...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get Ideas
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Powered by AI • Free to use • No signup required
            </p>
          </div>
        </form>

        {/* Error Message */}
        {err && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <strong>Error:</strong> {err}
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Gift Suggestions */}
        {!loading && suggestions.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Here are {suggestions.length} gift ideas for you
            </h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((gift, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900 mb-1">{gift.title}</h4>
                        <p className="text-sm text-gray-600">{gift.reason}</p>
                      </div>
                    </div>
                    {gift.products && gift.products.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        {gift.products.map((product, pidx) => {
                          const redirectUrl = `/api/aff-redirect?url=${encodeURIComponent(product.url || "")}&name=${encodeURIComponent(product.title || "")}`;
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
                                  <p className="text-sm font-semibold text-blue-600">{product.price}</p>
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
          </div>
        )}

        {/* Empty State - Features */}
        {!loading && suggestions.length === 0 && !err && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 text-center">
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
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Save Favorites</h3>
                <p className="text-gray-600 text-sm">
                  Sign in to save and track your favorite gift ideas
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
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
