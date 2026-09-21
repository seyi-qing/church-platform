"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Photo = {
  id: number;
  title: string;
  caption: string | null;
  image_url: string;
  album: string;
  is_published: boolean;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    caption: "",
    image_url: "",
    album: "General",
    is_published: true,
  });

  function load() {
    setLoading(true);
    apiFetch<Photo[]>("/gallery/photos?published_only=false&limit=100")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch("/gallery/photos", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          caption: form.caption || null,
          image_url: form.image_url,
          album: form.album || "General",
          is_published: form.is_published,
        }),
      });
      setForm({
        title: "",
        caption: "",
        image_url: "",
        album: "General",
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
    if (!confirm("Delete this photo?")) return;
    try {
      await apiFetch(`/gallery/photos/${id}`, { method: "DELETE" });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gallery</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paste public image URLs (Imgur, Drive share links that allow view, CDN, etc.). Shows on{" "}
            <strong>/gallery</strong>.
          </p>
        </div>
        <Link
          href="/gallery"
          target="_blank"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          View gallery
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSave} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <input
          required
          placeholder="Title"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          required
          placeholder="Image URL (https://…)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.image_url}
          onChange={(e) => setForm({ ...form, image_url: e.target.value })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Album (e.g. Sunday, Youth, Baptism)"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.album}
            onChange={(e) => setForm({ ...form, album: e.target.value })}
          />
          <input
            placeholder="Caption (optional)"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Published
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add photo"}
        </button>
      </form>

      {loading && <p className="text-slate-500">Loading…</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt={p.title} className="aspect-video w-full object-cover" />
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500">
                  {p.album}
                  {p.is_published ? " · published" : " · draft"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(p.id)}
                className="shrink-0 text-xs font-semibold text-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!loading && items.length === 0 && (
        <p className="text-center text-sm text-slate-500">No photos yet.</p>
      )}
    </div>
  );
}
