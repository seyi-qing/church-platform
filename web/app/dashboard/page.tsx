"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, API_URL } from "@/lib/api";
import { clearAuth, getStoredUser, isLoggedIn, isStaffRole } from "@/lib/auth";

type LiveSession = { id: number; title: string; status: string };
type EventItem = { id: number; title: string; location: string | null; start_at: string };
type MediaItem = {
  id: number;
  title: string;
  speaker: string | null;
  media_type: string;
  thumbnail_url?: string | null;
};
type Donation = { id: number; amount_cents: number; fund: string; status: string; created_at: string };

function money(cents: number) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function initials(name?: string | null) {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [live, setLive] = useState<LiveSession | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sermons, setSermons] = useState<MediaItem[]>([]);
  const [gifts, setGifts] = useState<Donation[]>([]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    const u = getStoredUser();
    setUser(u);
    if (u && (isStaffRole(u.role) || u.is_superuser)) {
      // Staff can use dashboard, but primary workspace is admin
    }

    const ctrl = new AbortController();
    fetch(`${API_URL}/livestream/sessions?status=live&limit=1`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLive(Array.isArray(d) && d[0] ? d[0] : null))
      .catch(() => {});

    fetch(`${API_URL}/events?limit=3`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch(`${API_URL}/media/items?published_only=true&limit=3`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSermons(Array.isArray(d) ? d : []))
      .catch(() => {});

    apiFetch<Donation[]>("/giving/mine")
      .then(setGifts)
      .catch(() => setGifts([]));

    return () => ctrl.abort();
  }, [router]);

  function signOut() {
    clearAuth();
    router.push("/");
  }

  if (!user) {
    return <p className="p-8 text-center text-sm text-slate-500">Loading your dashboard…</p>;
  }

  const staff = isStaffRole(user.role) || user.is_superuser;
  const recentGift = gifts[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
            {initials(user.full_name)}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Your dashboard</p>
            <h1 className="text-xl font-bold text-slate-900">
              Hello{user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {staff && (
            <Link
              href="/admin"
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Staff dashboard
            </Link>
          )}
          <Link
            href="/profile"
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600"
          >
            Sign out
          </button>
        </div>
      </div>

      {live && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">We're live</p>
              <p className="font-semibold text-slate-900">{live.title || "Join the service"}</p>
            </div>
          </div>
          <Link
            href="/live"
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
          >
            Watch now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/live", label: "Watch", sub: "Live & replay" },
          { href: "/give", label: "Give", sub: "Tithe & offering" },
          { href: "/sermons", label: "Sermons", sub: "Messages" },
          { href: "/events", label: "Events", sub: "What's next" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-2xl border bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">{a.label}</p>
            <p className="text-xs text-slate-500">{a.sub}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Upcoming</h2>
          <Link href="/events" className="text-sm font-semibold text-brand-600">
            All events
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming events listed.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <p className="font-medium text-slate-900">{ev.title}</p>
                <p className="text-xs text-slate-500">
                  {new Date(ev.start_at).toLocaleString()}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent messages</h2>
          <Link href="/sermons" className="text-sm font-semibold text-brand-600">
            Library
          </Link>
        </div>
        {sermons.length === 0 ? (
          <p className="text-sm text-slate-500">No published sermons yet.</p>
        ) : (
          <ul className="space-y-2">
            {sermons.map((m) => (
              <li key={m.id}>
                <Link href="/sermons" className="block rounded-lg px-2 py-2 hover:bg-slate-50">
                  <p className="font-medium text-slate-900">{m.title}</p>
                  <p className="text-xs text-slate-500">
                    {[m.speaker, m.media_type].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Giving</h2>
          <Link href="/give" className="text-sm font-semibold text-brand-600">
            Give now
          </Link>
        </div>
        {recentGift ? (
          <p className="text-sm text-slate-600">
            Latest: <span className="font-semibold text-slate-900">{money(recentGift.amount_cents)}</span>{" "}
            to {recentGift.fund}{" "}
            <span className="text-xs text-slate-400">
              ({new Date(recentGift.created_at).toLocaleDateString()})
            </span>
          </p>
        ) : (
          <p className="text-sm text-slate-500">No gifts on this account yet.</p>
        )}
        <Link href="/profile" className="mt-2 inline-block text-sm font-medium text-brand-700">
          Full giving history →
        </Link>
      </section>

      <p className="text-center text-xs text-slate-400">
        <Link href="/" className="hover:underline">
          Public church site
        </Link>
      </p>
    </div>
  );
}
