"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Photo = {
  id: number;
  title: string;
  caption: string | null;
  image_url: string;
  album: string;
};

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [album, setAlbum] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);

    Promise.all([
      fetch(`${API_URL}/gallery/photos?published_only=true&limit=100`, {
        signal: ctrl.signal,
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/gallery/albums?published_only=true`, {
        signal: ctrl.signal,
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([p, a]) => {
        setPhotos(Array.isArray(p) ? p : []);
        setAlbums(Array.isArray(a) ? a : []);
      })
      .catch((e) => {
        setError(
          e.name === "AbortError"
            ? "Server is waking up — refresh in a moment."
            : e.message || "Could not load gallery"
        );
      })
      .finally(() => {
        clearTimeout(t);
        setLoading(false);
      });

    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const filtered =
    album === "all" ? photos : photos.filter((p) => p.album === album);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Gallery</h1>
        <p className="mt-2 text-slate-600">Moments from the life of Grace Church.</p>
      </div>

      {(albums.length > 0 || photos.length > 0) && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAlbum("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              album === "all"
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            All
          </button>
          {albums.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlbum(a)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                album === a
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Loading…</p>
      )}
      {!loading && error && photos.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          {error}
        </p>
      )}
      {!loading && !error && photos.length === 0 && (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
          No photos yet. Staff can add image URLs in Admin → Gallery.
        </p>
      )}
      {!loading && photos.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
          No photos in this album. Try All.
        </p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setLightbox(p)}
              className="group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url}
                alt={p.title}
                className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="p-2">
                <p className="truncate text-sm font-medium text-slate-900">{p.title}</p>
                <p className="truncate text-[10px] uppercase tracking-wide text-slate-400">
                  {p.album}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal
          aria-label={lightbox.title}
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setLightbox(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.image_url}
              alt={lightbox.title}
              className="max-h-[75vh] w-full object-contain"
            />
            <div className="p-4">
              <h2 className="font-semibold text-slate-900">{lightbox.title}</h2>
              {lightbox.caption && (
                <p className="mt-1 text-sm text-slate-600">{lightbox.caption}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">{lightbox.album}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
