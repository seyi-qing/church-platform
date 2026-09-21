"use client";

import { useState } from "react";
import { toYouTubeThumbnailUrl } from "@/lib/youtube";

/** Shared default cover when item has no thumbnail or YouTube URL */
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80";

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
}): string {
  if (opts.thumbnail_url?.trim()) return opts.thumbnail_url.trim();
  const yt = toYouTubeThumbnailUrl(opts.video_url);
  if (yt) return yt;
  return DEFAULT_COVER;
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
  const preferred = mediaCoverUrl({ thumbnail_url, video_url });
  const [src, setSrc] = useState(preferred);
  const kind = kindLabel(media_type, video_url, hasAudio);

  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => {
          if (src !== DEFAULT_COVER) setSrc(DEFAULT_COVER);
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        {kind}
      </span>
      <span className="absolute bottom-2 right-2 max-w-[55%] truncate text-[10px] font-medium text-white/90">
        {title}
      </span>
    </div>
  );
}
