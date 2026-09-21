"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

type MediaItem = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  media_type: string;
  video_url?: string | null;
  audio_url?: string | null;
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

export default function HomePage() {
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, []);

  const pinned = announcements.find((a) => a.pinned) || announcements[0] || null;
  const rest = announcements.filter((a) => !pinned || a.id !== pinned.id).slice(0, 4);

  return (
    <div className="space-y-12">
      {pinned && !dismissedPin && (
        <div className="relative rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm sm:px-5">
          <div className="pr-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              {pinned.pinned ? "Pinned announcement" : "Announcement"}
            </p>
            <p className="mt-0.5 font-semibold text-slate-900">{pinned.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{pinned.body}</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setDismissedPin(true)}
            className="absolute right-2 top-2 rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-amber-100"
          >
            ✕
          </button>
        </div>
      )}

      <section className="rounded-2xl bg-blue-700 px-6 py-12 text-white shadow-lg sm:px-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome to Grace Church
        </h1>
        <p className="mt-4 max-w-xl text-lg text-blue-100">
          A community following Jesus together. Join us this Sunday or watch live online.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/live"
            className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-800 shadow hover:bg-blue-50"
          >
            Watch Live
          </Link>
          <Link
            href="/give"
            className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Give Online
          </Link>
        </div>
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
            <h2 className="text-2xl font-bold text-slate-900">Latest messages</h2>
            <p className="mt-1 text-sm text-slate-500">Sermons, video, and audio from the library</p>
          </div>
          <Link href="/sermons" className="text-sm font-semibold text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {sermons.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">
            Loading media… or none published yet. Publish items in Admin → Media.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {sermons.slice(0, 3).map((s) => {
              const kind = s.video_url
                ? "Video"
                : s.audio_url
                  ? "Audio"
                  : s.media_type === "video"
                    ? "Video"
                    : "Message";
              return (
                <Link
                  key={s.id}
                  href="/sermons"
                  className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-500">
                    {kind}
                  </div>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  {s.speaker && <p className="mt-1 text-sm text-slate-500">{s.speaker}</p>}
                  {s.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{s.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upcoming events</h2>
            <p className="mt-1 text-sm text-slate-500">Gatherings and ways to get involved</p>
          </div>
          <Link href="/events" className="text-sm font-semibold text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="rounded-xl border bg-white p-6 text-sm text-slate-500">
            Loading events… or none listed yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-slate-900">{e.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(e.start_at).toLocaleString()}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
                {e.description && <p className="mt-2 text-sm text-slate-600">{e.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
