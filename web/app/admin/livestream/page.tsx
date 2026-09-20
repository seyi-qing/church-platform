"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Session = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  stream_key: string | null;
  mux_playback_id: string | null;
  playback_url: string | null;
  youtube_url: string | null;
  scheduled_start: string | null;
};

export default function AdminLivestreamPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    youtube_url: "",
    scheduled_start: "",
  });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<Session[]>("/livestream/sessions")
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch<Session>("/livestream/sessions", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          youtube_url: form.youtube_url || null,
          scheduled_start: form.scheduled_start
            ? new Date(form.scheduled_start).toISOString()
            : null,
          is_public: true,
        }),
      });
      setShowForm(false);
      setForm({ title: "", description: "", youtube_url: "", scheduled_start: "" });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function startSession(id: number) {
    try {
      await apiFetch(`/livestream/sessions/${id}/start`, { method: "POST" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function endSession(id: number) {
    try {
      await apiFetch(`/livestream/sessions/${id}/end`, { method: "POST" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Livestream</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paste a YouTube live (or video) URL, then press <strong>Go live</strong> so it appears on /live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "New session"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Title</span>
            <input
              required
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Sunday Service Live"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">YouTube URL</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.youtube_url}
              onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=… or youtu.be/…"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Works with watch links, youtu.be, or YouTube Live links. No Mux key required for YouTube.
            </span>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Description (optional)</span>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Scheduled start (optional)</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={form.scheduled_start}
              onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create session"}
          </button>
        </form>
      )}

      {loading && <p className="text-slate-500">Loading…</p>}

      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                  Status: <span className="font-semibold">{s.status}</span>
                </p>
                {s.youtube_url && (
                  <p className="mt-1 break-all text-xs text-blue-600">{s.youtube_url}</p>
                )}
              </div>
              <div className="flex gap-2">
                {s.status !== "live" && s.status !== "ended" && (
                  <button
                    type="button"
                    onClick={() => startSession(s.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Go live
                  </button>
                )}
                {s.status === "live" && (
                  <button
                    type="button"
                    onClick={() => endSession(s.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    End stream
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
        {!loading && sessions.length === 0 && (
          <li className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
            No sessions yet. Create one with a YouTube URL.
          </li>
        )}
      </ul>
    </div>
  );
}
