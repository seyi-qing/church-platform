"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  speaker: string | null;
  is_published: boolean;
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");

  async function load() {
    try {
      const data = await apiFetch<MediaItem[]>("/media/items?published_only=false&limit=50");
      setItems(data);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!title) return;
    await apiFetch("/media/items", {
      method: "POST",
      body: JSON.stringify({ title, speaker, media_type: "sermon", is_published: false }),
    });
    setTitle("");
    setSpeaker("");
    load();
  }

  async function publish(id: number) {
    await apiFetch(`/media/items/${id}/publish`, { method: "PATCH" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Media / Sermons</h1>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="Speaker" value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <button type="button" onClick={add} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Add media</button>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-slate-500">{m.speaker || "—"} · {m.is_published ? "published" : "draft"}</p>
            </div>
            {!m.is_published && (
              <button type="button" onClick={() => publish(m.id)} className="text-sm text-brand-600">Publish</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
