"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Session = {
  id: number;
  title: string;
  status: string;
  stream_key: string | null;
  youtube_url: string | null;
};

export default function AdminLivestreamPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [youtube, setYoutube] = useState("");

  async function load() {
    try {
      setSessions(await apiFetch<Session[]>("/livestream/sessions"));
    } catch {
      setSessions([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title) return;
    await apiFetch("/livestream/sessions", {
      method: "POST",
      body: JSON.stringify({ title, youtube_url: youtube || null, is_public: true }),
    });
    setTitle("");
    setYoutube("");
    load();
  }

  async function goLive(id: number) {
    await apiFetch(`/livestream/sessions/${id}/start`, { method: "POST" });
    load();
  }

  async function end(id: number) {
    await apiFetch(`/livestream/sessions/${id}/end`, { method: "POST" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Livestream</h1>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="YouTube URL (optional)" value={youtube} onChange={(e) => setYoutube(e.target.value)} className="min-w-[240px] rounded border px-3 py-2 text-sm" />
        <button type="button" onClick={create} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">New session</button>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
        {sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-slate-500">Status: {s.status}{s.stream_key ? ` · key: ${s.stream_key.slice(0, 8)}…` : ""}</p>
            </div>
            <div className="flex gap-2">
              {s.status !== "live" && s.status !== "ended" && (
                <button type="button" onClick={() => goLive(s.id)} className="rounded bg-red-600 px-3 py-1 text-xs text-white">Go live</button>
              )}
              {s.status === "live" && (
                <button type="button" onClick={() => end(s.id)} className="rounded border px-3 py-1 text-xs">End</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
