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

function Thumb({ src, title }: { src: string; title: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-slate-100 px-3 text-center">
        <span className="text-2xl" aria-hidden>
          🖼
        </span>
        <p className="text-xs font-medium text-slate-500">Image did not load</p>
        <p className="max-w-full truncate text-[10px] text-slate-400">{src || "No URL"}</p>
        <p className="text-[10px] text-amber-700">
          Use a direct https image link (ends in .jpg/.png/.webp), not a web page.
        </p>
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={title}
      className="aspect-video w-full object-cover bg-slate-100"
      onError={() => setBroken(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

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
          image_url: form.image_url.trim(),
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
            Paste a <strong>direct</strong> image URL (https…jpg/png/webp). Page links from Google
            Photos/Drive often fail.
          </p>
        </div>
        <Link
          href="/gallery"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          View public gallery →
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
          type="url"
          placeholder="Image URL (https://…jpg or .png)"
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
          Published (show on public site)
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
            <Thumb src={p.image_url} title={p.title} />
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{p.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500">{p.album}</span>
                    {p.is_published ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                        published
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                        draft
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="shrink-0 text-xs font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/gallery"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  View gallery
                </Link>
                <a
                  href={p.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                >
                  Open image URL
                </a>
              </div>
              <p className="truncate text-[10px] text-slate-400" title={p.image_url}>
                {p.image_url}
              </p>
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
