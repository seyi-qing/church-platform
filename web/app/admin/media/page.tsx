"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  media_type: string;
  speaker: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  description?: string | null;
  is_published: boolean;
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    media_type: "sermon",
    speaker: "",
    video_url: "",
    audio_url: "",
    description: "",
    is_published: true,
  });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    apiFetch<MediaItem[]>("/media/items?published_only=false&limit=50")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(item: MediaItem) {
    setEditId(item.id);
    setForm({
      title: item.title,
      media_type: item.media_type || "sermon",
      speaker: item.speaker || "",
      video_url: item.video_url || "",
      audio_url: item.audio_url || "",
      description: item.description || "",
      is_published: item.is_published,
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
        media_type: form.media_type,
        speaker: form.speaker || null,
        video_url: form.video_url || null,
        audio_url: form.audio_url || null,
        description: form.description || null,
        is_published: form.is_published,
      };
      if (editId) {
        await apiFetch(`/media/items/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/media/items", { method: "POST", body: JSON.stringify(body) });
      }
      setShowForm(false);
      setEditId(null);
      setForm({
        title: "",
        media_type: "sermon",
        speaker: "",
        video_url: "",
        audio_url: "",
        description: "",
        is_published: true,
      });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this media item?")) return;
    try {
      await apiFetch(`/media/items/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media / Playlists</h1>
          <p className="mt-1 text-sm text-slate-500">
            Published items appear on <strong>/sermons</strong>. Use type + video/audio URL.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sermons"
            target="_blank"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            View sermons
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setForm({
                title: "",
                media_type: "sermon",
                speaker: "",
                video_url: "",
                audio_url: "",
                description: "",
                is_published: true,
              });
              setShowForm((v) => !v);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {showForm && !editId ? "Cancel" : "Add media"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{editId ? `Edit #${editId}` : "New item"}</p>
          <input
            required
            placeholder="Title"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.media_type}
              onChange={(e) => setForm({ ...form, media_type: e.target.value })}
            >
              <option value="sermon">Sermon (message)</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="podcast">Podcast</option>
              <option value="text">Text only</option>
            </select>
            <input
              placeholder="Speaker"
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.speaker}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
            />
          </div>
          <input
            placeholder="Video URL (YouTube watch / shorts / youtu.be)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          />
          <input
            placeholder="Audio URL (mp3 / public link)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.audio_url}
            onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
          />
          <textarea
            placeholder="Description or full text message"
            className="min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Published (shows on /sermons)
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : editId ? "Save changes" : "Save"}
          </button>
        </form>
      )}

      {loading && <p className="text-slate-500">Loading…</p>}
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.media_type}
                {item.speaker ? ` · ${item.speaker}` : ""}
                {item.is_published ? " · published" : " · draft"}
                {item.video_url ? " · has video" : ""}
                {item.audio_url ? " · has audio" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/sermons"
                target="_blank"
                className="rounded border px-2 py-1 text-xs font-semibold"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="rounded border px-2 py-1 text-xs font-semibold"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {!loading && items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No media yet.</li>
        )}
      </ul>
    </div>
  );
}
