import { useState } from "react";
import { Gift } from "lucide-react";
import { getSuggestions, getAffiliateLink } from "./api";
import { Loading } from "./ui/Loading";
import type { Suggestion } from "./types";

function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleGetIdeas = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await getSuggestions({ query });
      setSuggestions(result.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGetIdeas();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Gift className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Givoro</h1>
            <p className="text-lg text-gray-600">Find the perfect gift with AI</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What are you gifting? (e.g., gift for sister who loves yoga under £50)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleGetIdeas}
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Get Ideas
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>

          {loading && <Loading />}

          {suggestions.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {suggestion.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{suggestion.reason}</p>

                    {suggestion.products.length > 0 && (
                      <div className="space-y-4">
                        {suggestion.products.slice(0, 2).map((product, pIdx) => (
                          <div key={pIdx} className="border-t pt-4">
                            <div className="flex gap-4">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-20 h-20 object-contain flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                  {product.title}
                                </p>
                                {product.price && (
                                  <p className="text-lg font-bold text-blue-600 mb-2">
                                    {product.price}
                                  </p>
                                )}
                                <a
                                  href={getAffiliateLink(product.url, product.title)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                                >
                                  View on Amazon
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>As an Amazon Associate, we earn from qualifying purchases.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
