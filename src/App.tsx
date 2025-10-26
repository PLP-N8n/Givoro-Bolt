import { useState } from "react";
import { postIdeas } from "./api";

function App() {
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onGo() {
    setErr(null); setLoading(true);
    try {
      const result = await postIdeas(q.trim());
      setData(result);
    } catch (e: any) {
      setErr(e.message || "Something broke. Again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-3xl p-6 bg-white rounded-xl shadow">
        <div className="flex gap-3">
          <input className="flex-1 border rounded px-3 py-2" value={q} onChange={e => setQ(e.target.value)} placeholder="for wife under £10" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onGo} disabled={loading}>
            {loading ? "Thinking..." : "Get Ideas"}
          </button>
        </div>
        {err && <div className="mt-4 text-red-600 border border-red-300 rounded p-3">{err}</div>}
        {data && <pre className="mt-4 bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </div>
  );
}

export default App;
