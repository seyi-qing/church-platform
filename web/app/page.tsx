"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL, apiFetch } from "@/lib/api";
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

type OrgBrand = {
  name?: string;
  tagline?: string | null;
  service_times?: string | null;
  address?: string | null;
};

const PATHWAYS = [
  {
    title: "Plan a visit",
    body: "First time? We would love to meet you this Sunday.",
    href: "/contact",
    cta: "Get directions",
    icon: "📍",
    tone: "from-blue-500 to-indigo-600",
  },
  {
    title: "Watch & listen",
    body: "Live stream and recent messages, ready whenever you are.",
    href: "/live",
    cta: "Open live",
    icon: "▶️",
    tone: "from-rose-500 to-red-600",
  },
  {
    title: "Events",
    body: "Services, gatherings, and ways to grow with others.",
    href: "/events",
    cta: "See calendar",
    icon: "📅",
    tone: "from-emerald-500 to-teal-600",
  },
  {
    title: "Give",
    body: "Partner with the mission through tithes and offerings.",
    href: "/give",
    cta: "Give now",
    icon: "💝",
    tone: "from-amber-500 to-orange-600",
  },
] as const;

function formatEventDate(iso: string) {
  try {
    const d = new Date(iso);
    return {
      day: d.toLocaleDateString(undefined, { day: "numeric" }),
      month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
      time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    };
  } catch {
    return { day: "—", month: "", time: "" };
  }
}

export default function HomePage() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [live, setLive] = useState<LiveSession | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [org, setOrg] = useState<OrgBrand | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);

    apiFetch<OrgBrand>("/tenants/current")
      .then((d) => setOrg(d))
      .catch(() => {});

    fetch(`${API_URL}/media/items?published_only=true&limit=6`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSermons(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API_URL}/events?limit=4`, { signal: ctrl.signal, cache: "no-store" })
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

  const churchName = org?.name || BRAND.name;
  const tagline = org?.tagline || BRAND.tagline;
  const serviceTimes = org?.service_times || BRAND.serviceTimes;
  const location = org?.address || BRAND.locationLabel;
  const pinned = announcements.find((a) => a.pinned);
  const embedSrc =
    toYouTubeEmbedUrl(live?.youtube_url) ||
    toYouTubeEmbedUrl(live?.playback_url) ||
    null;

  return (
    <div className="-mx-4 space-y-0 sm:-mx-0">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(37,99,235,0.45),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.12),transparent_50%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {location}
            </p>
            <h1 className="mt-5 text-[2.35rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              {churchName}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {tagline}
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/contact"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-slate-900 shadow-lg shadow-blue-950/30 transition hover:bg-blue-50"
              >
                Plan your visit
              </Link>
              <Link
                href={live ? "#live-now" : "/live"}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                {live ? "We are live" : "Watch online"}
              </Link>
              <Link
                href="/give"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full px-5 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Give →
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center backdrop-blur-md sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                  Next gathering
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">{serviceTimes}</p>
              </div>
              <p className="text-xs text-slate-400 sm:text-right">{BRAND.serviceNote}</p>
            </div>
          </div>

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
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
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
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        {pinned && (
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Announcement
            </p>
            <p className="mt-1 font-semibold text-slate-900">{pinned.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 line-clamp-3">{pinned.body}</p>
          </div>
        )}

        <section>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Ways to connect
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Whether you are new or have been here for years — there is a place for you.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PATHWAYS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.tone} text-lg text-white shadow-md`}
                >
                  {c.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{c.body}</p>
                <span className="mt-4 text-sm font-semibold text-blue-600 group-hover:underline">
                  {c.cta} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Latest messages</h2>
              <p className="mt-1 text-sm text-slate-500">Teachings to strengthen your faith</p>
            </div>
            <Link href="/sermons" className="shrink-0 text-sm font-semibold text-blue-600 hover:underline">
              All sermons
            </Link>
          </div>
          {sermons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              Messages will appear here once published.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map((s) => (
                <Link
                  key={s.id}
                  href={`/sermons/${s.id}`}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-video overflow-hidden bg-slate-100">
                    <MediaThumb
                      title={s.title}
                      media_type={s.media_type}
                      thumbnail_url={s.thumbnail_url}
                      video_url={s.video_url}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {s.media_type || "message"}
                      {s.speaker ? ` · ${s.speaker}` : ""}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-bold text-slate-900 group-hover:text-blue-700">
                      {s.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Upcoming events</h2>
              <p className="mt-1 text-sm text-slate-500">Mark your calendar</p>
            </div>
            <Link href="/events" className="shrink-0 text-sm font-semibold text-blue-600 hover:underline">
              Full calendar
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              No upcoming events yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {events.map((ev) => {
                const d = formatEventDate(ev.start_at);
                return (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
                      <span className="text-[10px] font-bold tracking-wide text-blue-300">{d.month}</span>
                      <span className="text-xl font-extrabold leading-none">{d.day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 line-clamp-1">{ev.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {d.time}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                      {ev.description && (
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ev.description}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {photos.length > 0 && (
          <section>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Life together</h2>
              <p className="mt-1 text-sm text-slate-500">Moments from our community</p>
            </div>
            <GalleryStrip photos={photos} brandName={churchName} />
            <div className="mt-4 text-center">
              <Link href="/gallery" className="text-sm font-semibold text-blue-600 hover:underline">
                View gallery →
              </Link>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-6 py-12 text-center text-white shadow-xl sm:px-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">New here?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            {BRAND.newHereBody}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-slate-900 sm:w-auto"
            >
              Contact us
            </Link>
            <Link
              href="/give"
              className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white sm:w-auto"
            >
              Support the mission
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
