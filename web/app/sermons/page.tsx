"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_URL } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  scripture: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
};

export default function SermonsPage() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    // Direct fetch with long timeout for free-tier cold starts
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    fetch(`${API_URL}/media/items?media_type=sermon&limit=20`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSermons(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e.name === "AbortError"
              ? "Server is waking up — pull to refresh in a moment."
              : e.message || "Could not load sermons"
          );
          // Fallback via apiFetch
          apiFetch<MediaItem[]>("/media/items?media_type=sermon&limit=20")
            .then((d) => !cancelled && setSermons(d))
            .catch(() => {});
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sermons</h1>
        <p className="mt-2 text-slate-600">Recent messages from Sunday gatherings.</p>
      </div>

      {loading && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          Loading sermons… (first load may take up to a minute)
        </p>
      )}

      {!loading && error && sermons.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          {error}
        </p>
      )}

      {!loading && !error && sermons.length === 0 && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          No sermons published yet. Check back soon.
        </p>
      )}

      {sermons.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sermons.map((s) => (
            <article
              key={s.id}
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              {s.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.thumbnail_url} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-slate-100 text-slate-400">
                  Sermon
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold">{s.title}</h2>
                {s.speaker && <p className="mt-1 text-sm text-slate-500">{s.speaker}</p>}
                {s.scripture && <p className="mt-1 text-sm text-blue-600">{s.scripture}</p>}
                {s.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{s.description}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
