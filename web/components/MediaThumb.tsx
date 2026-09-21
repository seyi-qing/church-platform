"use client";

import { useState } from "react";
import { toYouTubeThumbnailUrl } from "@/lib/youtube";

type Props = {
  title: string;
  thumbnail_url?: string | null;
  video_url?: string | null;
  media_type?: string;
  hasAudio?: boolean;
  className?: string;
};

export function mediaCoverUrl(opts: {
  thumbnail_url?: string | null;
  video_url?: string | null;
}): string | null {
  if (opts.thumbnail_url?.trim()) return opts.thumbnail_url.trim();
  return toYouTubeThumbnailUrl(opts.video_url);
}

function kindLabel(
  media_type?: string,
  video_url?: string | null,
  hasAudio?: boolean
) {
  if (video_url || media_type === "video") return "Video";
  if (hasAudio || media_type === "audio" || media_type === "podcast") return "Audio";
  if (media_type === "text") return "Text";
  return "Message";
}

export function MediaThumb({
  title,
  thumbnail_url,
  video_url,
  media_type,
  hasAudio,
  className = "aspect-video",
}: Props) {
  const src = mediaCoverUrl({ thumbnail_url, video_url });
  const [broken, setBroken] = useState(false);
  const kind = kindLabel(media_type, video_url, hasAudio);
  const initial = (title || "G").trim().charAt(0).toUpperCase() || "G";

  if (src && !broken) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
        <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {kind}
        </span>
      </div>
    );
  }

  /* Designed placeholder when no image — still looks like a cover */
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 text-white ${className}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl font-bold backdrop-blur-sm">
        {initial}
      </span>
      <span className="mt-2 max-w-[90%] truncate px-2 text-center text-xs font-semibold text-white/90">
        {title}
      </span>
      <span className="absolute bottom-2 left-2 rounded bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
        {kind}
      </span>
    </div>
  );
}
