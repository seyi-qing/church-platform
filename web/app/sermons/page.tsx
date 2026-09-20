"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  scripture: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  published_at: string | null;
};

function youtubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function SermonsPage() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
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
        const list = Array.isArray(data) ? data : [];
        setSermons(list);
        if (list[0]) setActiveId(list[0].id);
      })
      .catch((e) => {
        setError(
          e.name === "AbortError"
            ? "Server is waking up — refresh in a moment."
            : e.message || "Could not load sermons"
        );
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const active = sermons.find((s) => s.id === activeId) || sermons[0] || null;
  const yt = active ? youtubeEmbed(active.video_url) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sermons</h1>
        <p className="mt-2 text-slate-600">Playlist of messages — play video or audio below.</p>
      </div>

      {loading && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          Loading sermons…
        </p>
      )}
      {!loading && error && sermons.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          {error}
        </p>
      )}
      {!loading && !error && sermons.length === 0 && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          No sermons published yet.
        </p>
      )}

      {active && (
        <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold">{active.title}</h2>
          {active.speaker && <p className="text-sm text-slate-500">{active.speaker}</p>}
          {active.scripture && <p className="text-sm text-blue-600">{active.scripture}</p>}
          {yt ? (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={yt}
                className="h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                title={active.title}
              />
            </div>
          ) : active.video_url ? (
            <video src={active.video_url} controls className="w-full rounded-lg bg-black" />
          ) : null}
          {active.audio_url && (
            <audio src={active.audio_url} controls className="w-full" />
          )}
          {!yt && !active.video_url && !active.audio_url && (
            <p className="text-sm text-slate-500">No playable media linked yet.</p>
          )}
          {active.description && (
            <p className="text-sm text-slate-600">{active.description}</p>
          )}
        </div>
      )}

      {sermons.length > 0 && (
        <ul className="divide-y rounded-xl border bg-white">
          {sermons.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActiveId(s.id)}
                className={`w-full px-4 py-3 text-left hover:bg-slate-50 ${
                  activeId === s.id ? "bg-blue-50" : ""
                }`}
              >
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500">
                  {s.speaker || "Sermon"}
                  {s.audio_url ? " · audio" : ""}
                  {s.video_url ? " · video" : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
