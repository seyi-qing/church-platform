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

  const kind =
    video_url || media_type === "video"
      ? "Video"
      : hasAudio || media_type === "audio" || media_type === "podcast"
        ? "Audio"
        : media_type === "text"
          ? "Text"
          : "Message";

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

  return (
    <div
      className={`flex items-center justify-center bg-brand-50 text-sm font-semibold text-brand-700 ${className}`}
    >
      {kind}
    </div>
  );
}
