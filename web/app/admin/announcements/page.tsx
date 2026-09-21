"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Announcement = {
  id: number;
  title: string;
  body: string;
  is_published: boolean;
  pinned: boolean;
  created_at: string;
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    apiFetch<Announcement[]>("/announcements?published_only=false")
      .then(setItems)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify({ title, body, is_published: true, pinned: false }),
      });
      setTitle("");
      setBody("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-slate-500">Service updates and messages for the community.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4">
        <input
          required
          placeholder="Title"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          required
          placeholder="Message"
          className="min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {saving ? "Saving…" : "Publish announcement"}
        </button>
      </form>
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((a) => (
          <li key={a.id} className="px-4 py-3">
            <p className="font-semibold">{a.title}</p>
            <p className="mt-1 text-sm text-slate-600">{a.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(a.created_at).toLocaleString()}
            </p>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No announcements yet.</li>
        )}
      </ul>
    </div>
  );
}
