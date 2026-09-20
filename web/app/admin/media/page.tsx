"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type MediaItem = {
  id: number;
  title: string;
  media_type: string;
  speaker: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  is_published: boolean;
  published_at: string | null;
  view_count: number;
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    media_type: "sermon",
    speaker: "",
    scripture: "",
    description: "",
    video_url: "",
    audio_url: "",
    is_published: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  async function uploadFile(file: File, kind: "video" | "audio") {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Upload failed — use a URL instead, or configure S3/R2");
      }
      if (kind === "video") setForm((f) => ({ ...f, video_url: data.url }));
      else setForm((f) => ({ ...f, audio_url: data.url }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/media/items", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          media_type: form.media_type,
          speaker: form.speaker || null,
          scripture: form.scripture || null,
          description: form.description || null,
          video_url: form.video_url || null,
          audio_url: form.audio_url || null,
          is_published: form.is_published,
        }),
      });
      setShowForm(false);
      setForm({
        title: "",
        media_type: "sermon",
        speaker: "",
        scripture: "",
        description: "",
        video_url: "",
        audio_url: "",
        is_published: true,
      });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function publish(id: number) {
    try {
      await apiFetch(`/media/items/${id}/publish`, { method: "PATCH" });
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
            Add sermons with YouTube or file URLs. Optional direct upload if S3/R2 is configured.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {showForm ? "Cancel" : "Add media"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
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
              <option value="sermon">Sermon</option>
              <option value="podcast">Podcast / audio</option>
              <option value="video">Video</option>
            </select>
            <input
              placeholder="Speaker"
              className="rounded-lg border px-3 py-2 text-sm"
              value={form.speaker}
              onChange={(e) => setForm({ ...form, speaker: e.target.value })}
            />
          </div>
          <input
            placeholder="Scripture (optional)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.scripture}
            onChange={(e) => setForm({ ...form, scripture: e.target.value })}
          />
          <textarea
            placeholder="Description"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Video URL (YouTube or direct MP4)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="https://youtube.com/watch?v=… or https://….mp4"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            />
            <input
              type="file"
              accept="video/*"
              className="mt-2 text-xs"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "video");
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Audio URL (MP3 / podcast)</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="https://….mp3"
              value={form.audio_url}
              onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
            />
            <input
              type="file"
              accept="audio/*"
              className="mt-2 text-xs"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, "audio");
              }}
            />
          </label>
          {uploading && <p className="text-sm text-slate-500">Uploading…</p>}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Publish immediately
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save to library"}
          </button>
        </form>
      )}

      {loading && <p className="text-slate-500">Loading…</p>}
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                {item.media_type}
                {item.speaker ? ` · ${item.speaker}` : ""}
                {item.is_published ? " · published" : " · draft"}
              </p>
            </div>
            {!item.is_published && (
              <button
                type="button"
                onClick={() => publish(item.id)}
                className="rounded border px-2 py-1 text-xs font-semibold"
              >
                Publish
              </button>
            )}
          </li>
        ))}
        {!loading && items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No media yet.</li>
        )}
      </ul>
    </div>
  );
}
