"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

type Livestream = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  playback_url: string | null;
  youtube_url: string | null;
};

/** Convert watch / share / short YouTube URLs to embed form */
function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "live" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }
  } catch {
    /* ignore */
  }
  return url;
}

export default function LivePage() {
  const [live, setLive] = useState<Livestream | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_URL}/livestream/sessions/live`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) return null;
        const data = await r.json();
        return data;
      })
      .then((d) => setLive(d))
      .catch(() => setLive(null))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const embedSrc =
    live?.youtube_url
      ? toEmbedUrl(live.youtube_url)
      : live?.playback_url || null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Live</h1>
        <p className="mt-2 text-slate-600">Join us online for worship and teaching.</p>
      </div>

      {loading && (
        <p className="rounded-xl border bg-white p-8 text-center text-slate-500">
          Checking for a live stream…
        </p>
      )}

      {!loading && !live && (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <p className="text-lg text-slate-600">Nothing is live right now.</p>
          <p className="mt-2 text-sm text-slate-400">
            When a pastor starts a session in Admin → Livestream (with a YouTube URL), it appears here.
          </p>
          <Link href="/sermons" className="mt-4 inline-block text-sm font-semibold text-blue-600">
            Browse sermons
          </Link>
        </div>
      )}

      {!loading && live && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-red-600">Live</span>
          </div>
          <h2 className="text-xl font-semibold">{live.title}</h2>
          {live.description && <p className="text-slate-600">{live.description}</p>}
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            {embedSrc ? (
              <iframe
                src={embedSrc}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={live.title}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white">
                Stream starting soon…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
