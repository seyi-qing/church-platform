"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

const TOOLS = [
  { id: "sermon-outline", path: "/ai/sermon-outline", fields: ["topic", "scripture"] },
  { id: "prayer", path: "/ai/prayer", fields: ["situation"] },
  { id: "summarize", path: "/ai/summarize", fields: ["transcript"] },
  { id: "chat", path: "/ai/chat", fields: ["message"] },
];

export default function AIToolsPage() {
  const [tool, setTool] = useState(TOOLS[0].id);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setResult("");
    const t = TOOLS.find((x) => x.id === tool)!;
    const body: Record<string, string> = {};
    body[t.fields[0]] = input;
    try {
      const data = await apiFetch<any>(t.path, { method: "POST", body: JSON.stringify(body) });
      setResult(data.outline || data.prayer || data.summary || data.reply || JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">AI Pastoral Tools</h1>
      <select value={tool} onChange={(e) => setTool(e.target.value)} className="w-full rounded-lg border px-3 py-2">
        {TOOLS.map((t) => (
          <option key={t.id} value={t.id}>{t.id}</option>
        ))}
      </select>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={6} className="w-full rounded-lg border px-3 py-2" placeholder="Enter topic, situation, or transcript…" />
      <button type="button" onClick={run} disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-white disabled:opacity-50">
        {loading ? "Running…" : "Run"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && <pre className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm">{result}</pre>}
    </div>
  );
}
