"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { BRAND } from "@/lib/brand";
import { MediaThumb } from "@/components/MediaThumb";
import { GalleryStrip } from "@/components/GalleryStrip";

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
  status: string;
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
    cta: "Watch live",
  },
  {
    title: "Find community",
    body: "Small groups and teams help you grow in faith with others.",
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
  const [dismissedPin, setDismissedPin] = useState(false);

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

    fetch(`${API_URL}/livestream/sessions?status=live&limit=1`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setLive(list[0] || null);
      })
      .catch(() => {});

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

  return (
    <div className="space-y-12">
      {live && !dismissedPin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">We're live</p>
              <p className="text-sm font-semibold text-slate-900">{live.title || "Join us now"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/live"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Watch
            </Link>
            <button
              type="button"
              onClick={() => setDismissedPin(true)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-red-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero — church identity, not product demo */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/90 via-blue-900/95 to-slate-950" />
        <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative px-6 py-16 sm:px-12 sm:py-20 lg:py-24">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
            {BRAND.locationLabel}
          </p>
          <h1 className="mt-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {BRAND.name}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-blue-100/95 sm:text-xl">
            {BRAND.tagline}
          </p>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-blue-100/80">
            {BRAND.serviceTimes} · {BRAND.serviceNote}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/live"
              className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand-800 shadow-lg hover:bg-blue-50"
            >
              Watch this Sunday
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              I'm new here
            </Link>
            <Link
              href="/give"
              className="rounded-full px-5 py-3.5 text-sm font-semibold text-blue-100 underline-offset-4 hover:text-white hover:underline"
            >
              Give
            </Link>
          </div>
        </div>
      </section>

      {/* Ways to connect — Elevation-style pathways */}
      <section>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Find the right place for you</h2>
          <p className="mt-2 text-sm text-slate-500">
            In person, online, or in community — there is room for you here.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CONNECT.map((c) => (
            <div
              key={c.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.body}</p>
              <Link
                href={c.href}
                className="mt-4 text-sm font-bold text-brand-700 hover:underline"
              >
                {c.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* New here band */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50/80 px-6 py-8 text-center sm:px-10">
        <h2 className="text-xl font-bold text-slate-900">{BRAND.newHereTitle}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{BRAND.newHereBody}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Plan a visit
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800"
          >
            Member sign in
          </Link>
        </div>
      </section>

      {photos.length > 0 && <GalleryStrip photos={photos} brandName={BRAND.name} />}

      {/* Featured message */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Latest message</h2>
            <p className="mt-1 text-sm text-slate-500">Watch or listen anytime</p>
          </div>
          <Link href="/sermons" className="text-sm font-semibold text-brand-600 hover:underline">
            All sermons
          </Link>
        </div>
        {!featured ? (
          <p className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No sermons published yet.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-5">
            <Link
              href="/sermons"
              className="overflow-hidden rounded-2xl border bg-white shadow-sm lg:col-span-3"
            >
              <MediaThumb
                title={featured.title}
                media_type={featured.media_type}
                video_url={featured.video_url}
                thumbnail_url={featured.thumbnail_url}
              />
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Featured</p>
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
                  className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm hover:border-blue-200"
                >
                  <div className="w-24 shrink-0 overflow-hidden rounded-lg">
                    <MediaThumb
                      title={m.title}
                      media_type={m.media_type}
                      video_url={m.video_url}
                      thumbnail_url={m.thumbnail_url}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{m.title}</p>
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
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Church updates</h2>
            <p className="mt-1 text-sm text-slate-500">Announcements from the team</p>
          </div>
          <ul className="space-y-3">
            {(pinned && !dismissedPin ? [pinned, ...rest] : announcements.slice(0, 5)).map((a) => (
              <li
                key={a.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${
                  a.pinned ? "border-amber-200" : ""
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
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upcoming events</h2>
            <p className="mt-1 text-sm text-slate-500">What's next at church</p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No upcoming events.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{ev.title}</p>
                <p className="text-sm text-slate-500">
                  {new Date(ev.start_at).toLocaleString()}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
                {ev.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ev.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
