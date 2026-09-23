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

    fetch(`${API_URL}/gallery/photos?published_only=true&limit=12`, {
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

      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-blue-800 px-6 py-12 text-center text-white shadow-lg sm:px-10 sm:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome to {BRAND.name}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-blue-100 sm:text-lg">
          A community following Jesus together
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-blue-100/90">
          Join us this Sunday in person or online. Grow in faith, serve together, and find community.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/live"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow hover:bg-blue-50"
          >
            Watch Live
          </Link>
          <Link
            href="/sermons"
            className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Sermons
          </Link>
          <Link
            href="/give"
            className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Give
          </Link>
          <Link
            href="/events"
            className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Events
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
            <p className="mt-1 text-sm text-slate-500">Plan your week with us</p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">
            All events
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No upcoming events listed.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{e.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(e.start_at).toLocaleString()}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{e.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white px-6 py-10 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Support the mission</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Your generosity fuels worship, outreach, and care in our community.
        </p>
        <Link
          href="/give"
          className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Give online
        </Link>
      </section>
    </div>
  );
}
