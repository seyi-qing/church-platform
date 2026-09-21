"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  media_type: string;
  speaker: string | null;
  scripture: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null;
  published_at: string | null;
};

function TypeBadge({ type, hasVideo, hasAudio }: { type: string; hasVideo: boolean; hasAudio: boolean }) {
  let label = type || "sermon";
  let className = "bg-slate-100 text-slate-700";

  if (hasVideo || type === "video") {
    label = type === "sermon" ? "video sermon" : "video";
    className = "bg-violet-50 text-violet-800";
  } else if (hasAudio || type === "podcast" || type === "audio") {
    label = type === "podcast" ? "podcast" : "audio";
    className = "bg-sky-50 text-sky-800";
  } else if (type === "text" || (!hasVideo && !hasAudio)) {
    label = "text";
    className = "bg-amber-50 text-amber-800";
  }

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>
      {label}
    </span>
  );
}

export default function SermonsPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "video" | "audio" | "text">("all");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    // All published media — not only media_type=sermon
    fetch(`${API_URL}/media/items?published_only=true&limit=50`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setItems(list);
        if (list[0]) setActiveId(list[0].id);
      })
      .catch((e) => {
        setError(
          e.name === "AbortError"
            ? "Server is waking up — refresh in a moment."
            : e.message || "Could not load media"
        );
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filtered = items.filter((s) => {
    const hasVideo = !!(s.video_url || s.media_type === "video");
    const hasAudio = !!(s.audio_url || s.media_type === "audio" || s.media_type === "podcast");
    const isText = !s.video_url && !s.audio_url && s.media_type !== "video";
    if (filter === "video") return hasVideo;
    if (filter === "audio") return hasAudio && !hasVideo;
    if (filter === "text") return isText;
    return true;
  });

  const active = filtered.find((s) => s.id === activeId) || filtered[0] || null;
  const yt = active ? toYouTubeEmbedUrl(active.video_url) : null;

  useEffect(() => {
    if (filtered.length && !filtered.some((s) => s.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filter, filtered, activeId]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sermons & media</h1>
        <p className="mt-2 text-slate-600">
          Video, audio, and written messages from Grace Church.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "video", "audio", "text"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              filter === f
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">Loading…</p>
      )}
      {!loading && error && items.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          {error}
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          No published media yet. Add items in Admin → Media and mark them published.
        </p>
      )}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <p className="rounded-lg border bg-white p-6 text-center text-sm text-slate-500">
          Nothing in this filter. Try “All”.
        </p>
      )}

      {active && (
        <div className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge
              type={active.media_type}
              hasVideo={!!active.video_url}
              hasAudio={!!active.audio_url}
            />
            {active.speaker && <span className="text-sm text-slate-500">{active.speaker}</span>}
          </div>
          <h2 className="text-xl font-semibold">{active.title}</h2>
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
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Audio</p>
              <audio src={active.audio_url} controls className="w-full" />
            </div>
          )}

          {!yt && !active.video_url && !active.audio_url && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Text message — no video or audio URL on this item.
              {active.description ? null : " Add a description or media URL in Admin."}
            </div>
          )}

          {active.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {active.description}
            </p>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <ul className="divide-y rounded-xl border bg-white">
          {filtered.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActiveId(s.id)}
                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                  activeId === s.id ? "bg-blue-50" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.speaker || "Grace Church"}</p>
                </div>
                <TypeBadge type={s.media_type} hasVideo={!!s.video_url} hasAudio={!!s.audio_url} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
