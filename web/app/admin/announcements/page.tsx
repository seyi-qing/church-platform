"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [pinned, setPinned] = useState(false);
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
        body: JSON.stringify({
          title,
          body,
          is_published: true,
          pinned,
        }),
      });
      setTitle("");
      setBody("");
      setPinned(false);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this announcement?")) return;
    try {
      await apiFetch(`/announcements/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-slate-500">
            Published messages appear on the <strong>home page</strong> (pinned ones first).
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          View home
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to top of home page
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Publish announcement"}
        </button>
      </form>

      <ul className="divide-y rounded-xl border bg-white">
        {items.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                    Pinned
                  </span>
                )}
                <p className="font-semibold">{a.title}</p>
              </div>
              <p className="mt-1 text-sm text-slate-600">{a.body}</p>
              <p className="mt-1 text-xs text-slate-400">
                {new Date(a.created_at).toLocaleString()}
                {a.is_published ? " · published" : " · draft"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(a.id)}
              className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600"
            >
              Delete
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No announcements yet.</li>
        )}
      </ul>
    </div>
  );
}
