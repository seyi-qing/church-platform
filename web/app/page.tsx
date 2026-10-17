"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { MediaThumb } from "@/components/MediaThumb";
import { GalleryStrip } from "@/components/GalleryStrip";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  media_type: string;
  video_url?: string | null;
  audio_url?: string | null;
  thumbnail_url?: string | null;
};

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
};

type Announcement = {
  id: number;
  title: string;
  body: string;
  is_published: boolean;
  pinned: boolean;
  created_at: string;
};

type LiveSession = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  youtube_url?: string | null;
  playback_url?: string | null;
};

type GalleryPhoto = {
  id: number;
  title: string;
  image_url: string;
  caption: string | null;
};

const CONNECT = [
  {
    title: "Worship with us",
    body: "Join in person this Sunday. Families, students, and first-time guests are welcome.",
    href: "/contact",
    cta: "Plan a visit",
  },
  {
    title: "Watch online",
    body: "Stream the service live or catch recent messages whenever you can.",
    href: "/live",
    cta: "Go to Live",
  },
  {
    title: "Find community",
    body: "Events and groups help you grow in faith with others.",
    href: "/events",
    cta: "See events",
  },
  {
    title: "Give generously",
    body: "Support the mission of the church through tithes and offerings.",
    href: "/give",
    cta: "Give now",
  },
] as const;

export default function HomePage() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [live, setLive] = useState<LiveSession | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);

    fetch(`${API_URL}/media/items?published_only=true&limit=6`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSermons(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API_URL}/events?limit=3`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API_URL}/announcements?published_only=true`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAnnouncements(Array.isArray(d) ? d : []))
      .catch(() => {});

    // Prefer dedicated live endpoint (full session + YouTube URL)
    fetch(`${API_URL}/livestream/sessions/live`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => setLive(d && d.id ? d : null))
      .catch(() => setLive(null));

    fetch(`${API_URL}/gallery?published_only=true&limit=12`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => {});

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, []);

  const pinned = announcements.find((a) => a.pinned);
  const rest = announcements.filter((a) => !a.pinned);
  const featured = sermons[0];
  const embedSrc =
    toYouTubeEmbedUrl(live?.youtube_url) ||
    toYouTubeEmbedUrl(live?.playback_url) ||
    null;

  return (
    <div className="-mx-4 space-y-0 sm:-mx-0">
      {/* Full-bleed hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white sm:rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-brand-900/90 to-slate-950" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.25),_transparent_55%)]" />

        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-300/90">
            {BRAND.locationLabel}
          </p>
          <h1 className="mt-4 text-center text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            {BRAND.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg font-light text-slate-200 sm:text-xl">
            {BRAND.tagline}
          </p>
          <p className="mx-auto mt-3 text-center text-sm text-slate-400">
            {BRAND.serviceTimes}
            <span className="mx-2 text-slate-600">·</span>
            {BRAND.serviceNote}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={live ? "#live-now" : "/live"}
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              {live ? "Watch live now" : "Watch this Sunday"}
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
            >
              I'm new here
            </Link>
            <Link
              href="/give"
              className="rounded-full px-5 py-3.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              Give
            </Link>
          </div>

          {/* Embedded live player when session is live */}
          {live && (
            <div id="live-now" className="mx-auto mt-12 max-w-4xl scroll-mt-24">
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Live now
                </span>
                <span className="text-sm text-slate-300">· {live.title}</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                <div className="aspect-video w-full">
                  {embedSrc ? (
                    <iframe
                      src={`${embedSrc}${embedSrc.includes("?") ? "&" : "?"}autoplay=0`}
                      title={live.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-900 p-8 text-center">
                      <p className="text-sm text-slate-300">Live session is active</p>
                      <Link
                        href="/live"
                        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white"
                      >
                        Open live page
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              {live.description && (
                <p className="mt-3 text-center text-sm text-slate-400">{live.description}</p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-0">
        {/* Pathways */}
        <section>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Every stage of life has a place here
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              Whether you are visiting for the first time or looking for a place to belong — start here.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CONNECT.map((c) => (
              <div
                key={c.title}
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.body}</p>
                <Link
                  href={c.href}
                  className="mt-5 text-sm font-bold text-brand-700 group-hover:underline"
                >
                  {c.cta} →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* New here */}
        <section className="rounded-3xl bg-slate-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{BRAND.newHereTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">{BRAND.newHereBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100"
            >
              Plan a visit
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Member sign in
            </Link>
          </div>
        </section>

        {photos.length > 0 && (
          <div className="px-0">
            <GalleryStrip photos={photos} brandName={BRAND.name} />
          </div>
        )}

        {/* Latest message */}
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Latest message</h2>
              <p className="mt-1 text-sm text-slate-500">Watch or listen anytime</p>
            </div>
            <Link href="/sermons" className="text-sm font-semibold text-brand-600 hover:underline">
              All sermons
            </Link>
          </div>
          {!featured ? (
            <p className="rounded-2xl border border-dashed bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No sermons published yet.
            </p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-5">
              <Link
                href="/sermons"
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md lg:col-span-3"
              >
                <MediaThumb
                  title={featured.title}
                  media_type={featured.media_type}
                  video_url={featured.video_url}
                  thumbnail_url={featured.thumbnail_url}
                />
                <div className="p-5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                    Featured
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">{featured.title}</h3>
                  {featured.speaker && (
                    <p className="mt-1 text-sm text-slate-500">{featured.speaker}</p>
                  )}
                </div>
              </Link>
              <div className="space-y-3 lg:col-span-2">
                {sermons.slice(1, 4).map((m) => (
                  <Link
                    key={m.id}
                    href="/sermons"
                    className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm transition hover:border-blue-200"
                  >
                    <div className="w-24 shrink-0 overflow-hidden rounded-lg">
                      <MediaThumb
                        title={m.title}
                        media_type={m.media_type}
                        video_url={m.video_url}
                        thumbnail_url={m.thumbnail_url}
                      />
                    </div>
                    <div className="min-w-0 self-center">
                      <p className="line-clamp-2 font-semibold text-slate-900">{m.title}</p>
                      {m.speaker && <p className="text-xs text-slate-500">{m.speaker}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {announcements.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900">Stay in touch</h2>
            <p className="mt-1 text-sm text-slate-500">Updates from the church family</p>
            <ul className="mt-5 space-y-3">
              {(pinned ? [pinned, ...rest] : announcements).slice(0, 4).map((a) => (
                <li
                  key={a.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm ${
                    a.pinned ? "border-amber-200 bg-amber-50/30" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        Pinned
                      </span>
                    )}
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Upcoming</h2>
              <p className="mt-1 text-sm text-slate-500">Events and gatherings</p>
            </div>
            <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {events.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No upcoming events listed.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border bg-white shadow-sm">
              {events.map((ev) => (
                <li key={ev.id} className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{ev.title}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(ev.start_at).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
