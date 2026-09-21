"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Session = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  youtube_url: string | null;
  playback_url: string | null;
};

export default function AdminLivestreamPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", youtube_url: "" });
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

  function openEdit(s: Session) {
    setEditId(s.id);
    setForm({
      title: s.title,
      description: s.description || "",
      youtube_url: s.youtube_url || "",
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        title: form.title,
        description: form.description || null,
        youtube_url: form.youtube_url || null,
        is_public: true,
      };
      if (editId) {
        await apiFetch(`/livestream/sessions/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/livestream/sessions", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: "", description: "", youtube_url: "" });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this session?")) return;
    try {
      await apiFetch(`/livestream/sessions/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) {
      setError(err.message);
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
            Paste a YouTube URL, <strong>Go live</strong>, then open the public page.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/live"
            target="_blank"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            View /live
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setForm({ title: "", description: "", youtube_url: "" });
              setShowForm((v) => !v);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {showForm && !editId ? "Cancel" : "New session"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            {editId ? `Edit session #${editId}` : "New session"}
          </p>
          <input
            required
            placeholder="Title"
            className="w-full rounded-lg border px-3 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="YouTube URL"
            className="w-full rounded-lg border px-3 py-2"
            value={form.youtube_url}
            onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full rounded-lg border px-3 py-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : editId ? "Save changes" : "Create session"}
          </button>
        </form>
      )}

      {loading && <p className="text-slate-500">Loading…</p>}

      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">
                  Status:{" "}
                  <span
                    className={
                      s.status === "live"
                        ? "font-semibold text-red-600"
                        : s.status === "ended"
                          ? "font-semibold text-slate-500"
                          : "font-semibold text-amber-600"
                    }
                  >
                    {s.status}
                  </span>
                </p>
                {s.youtube_url && (
                  <a
                    href={s.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-xs text-blue-600"
                  >
                    {s.youtube_url}
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/live"
                  target="_blank"
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  Edit
                </button>
                {s.status !== "live" && (
                  <button
                    type="button"
                    onClick={() => startSession(s.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Go live
                  </button>
                )}
                {s.status === "live" && (
                  <button
                    type="button"
                    onClick={() => endSession(s.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                  >
                    End
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
        {!loading && sessions.length === 0 && (
          <li className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
            No sessions yet.
          </li>
        )}
      </ul>
    </div>
  );
}
