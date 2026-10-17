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

  return (
    <div className="space-y-10">
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

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-blue-800 to-slate-900 px-6 py-14 text-center text-white shadow-lg sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-blue-400/10" />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-blue-200">
          Welcome home
        </p>
        <h1 className="relative mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          {BRAND.name}
        </h1>
        <p className="relative mx-auto mt-4 max-w-md text-base text-blue-100 sm:text-lg">
          A community following Jesus together
        </p>
        <p className="relative mx-auto mt-2 max-w-lg text-sm text-blue-100/85">
          Join us this Sunday in person or online. Grow in faith, serve together, and find community.
        </p>
        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/live"
            className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-800 shadow-md hover:bg-blue-50"
          >
            Watch Live
          </Link>
          <Link
            href="/sermons"
            className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
          >
            Sermons
          </Link>
          <Link
            href="/give"
            className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
          >
            Give
          </Link>
          <Link
            href="/events"
            className="rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
          >
            Events
          </Link>
          <Link
            href="/contact"
            className="rounded-xl px-5 py-3 text-sm font-semibold text-blue-100 underline-offset-4 hover:text-white hover:underline"
          >
            Plan a visit
          </Link>
        </div>
      </section>

      {photos.length > 0 && <GalleryStrip photos={photos} brandName={BRAND.name} />}

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
            <h2 className="text-2xl font-bold text-slate-900">Latest messages</h2>
            <p className="mt-1 text-sm text-slate-500">Sermons, video, and audio</p>
          </div>
          <Link href="/sermons" className="text-sm font-semibold text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {sermons.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No sermons published yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sermons.map((m) => (
              <Link
                key={m.id}
                href="/sermons"
                className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
              >
                <MediaThumb
                  title={m.title}
                  media_type={m.media_type}
                  video_url={m.video_url}
                  thumbnail_url={m.thumbnail_url}
                />
                <div className="p-3">
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  {m.speaker && <p className="text-xs text-slate-500">{m.speaker}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

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
