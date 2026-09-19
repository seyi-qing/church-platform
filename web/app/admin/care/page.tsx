"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Card = {
  id: number;
  requester_name: string;
  category: string;
  priority: string;
  summary: string;
  assigned_to: number | null;
};

type Board = Record<string, Card[]>;

const COLUMNS = ["open", "assigned", "in_progress", "resolved"];
const NEXT: Record<string, string> = {
  open: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
};

export default function CareBoardPage() {
  const [board, setBoard] = useState<Board>({});
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await apiFetch<Board>("/care/workflow/board");
      setBoard(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createRequest() {
    if (!name || !summary) return;
    await apiFetch("/care/requests", {
      method: "POST",
      body: JSON.stringify({ requester_name: name, summary, category: "general" }),
    });
    setName("");
    setSummary("");
    load();
  }

  async function advance(id: number, from: string) {
    const next = NEXT[from];
    if (!next) return;
    await apiFetch(`/care/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pastoral Care</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} className="min-w-[200px] flex-1 rounded border px-3 py-2 text-sm" />
        <button type="button" onClick={createRequest} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">New request</button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col} className="rounded-xl border bg-slate-50 p-3">
            <h2 className="mb-3 text-xs font-bold uppercase text-slate-500">{col.replace("_", " ")}</h2>
            <div className="space-y-2">
              {(board[col] || []).map((card) => (
                <div key={card.id} className="rounded-lg border bg-white p-3 text-sm shadow-sm">
                  <p className="font-semibold">{card.requester_name}</p>
                  <p className="mt-1 text-slate-600">{card.summary}</p>
                  <p className="mt-1 text-xs text-slate-400">{card.category} · {card.priority}</p>
                  {NEXT[col] && (
                    <button type="button" onClick={() => advance(card.id, col)} className="mt-2 text-xs font-medium text-brand-600">
                      → {NEXT[col]}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
