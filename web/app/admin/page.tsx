"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </Link>
  );
}

const ACTIONS = [
  { href: "/admin/members", label: "Members", desc: "Accounts & roles" },
  { href: "/admin/media", label: "Media", desc: "Sermons & playlists" },
  { href: "/admin/events", label: "Events", desc: "Calendar" },
  { href: "/admin/livestream", label: "Livestream", desc: "YouTube go-live" },
  { href: "/admin/giving", label: "Giving", desc: "Donations" },
  { href: "/admin/ai", label: "AI Tools", desc: "Pastoral helpers" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    members: number;
    media: number;
    events: number;
    donations: number;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [profiles, items, events, donations] = await Promise.all([
          apiFetch<unknown[]>("/members/users").catch(() => []),
          apiFetch<unknown[]>("/media/items?published_only=false&limit=100").catch(() => []),
          apiFetch<unknown[]>("/events?limit=100").catch(() => []),
          apiFetch<unknown[]>("/giving/admin/all?limit=100").catch(() => []),
        ]);
        setStats({
          members: Array.isArray(profiles) ? profiles.length : 0,
          media: Array.isArray(items) ? items.length : 0,
          events: Array.isArray(events) ? events.length : 0,
          donations: Array.isArray(donations) ? donations.length : 0,
        });
      } catch (e: any) {
        setError(e.message || "Failed to load dashboard");
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Members · media · events · livestream · giving</p>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Members" value={stats?.members ?? "—"} href="/admin/members" />
        <StatCard label="Media" value={stats?.media ?? "—"} href="/admin/media" />
        <StatCard label="Events" value={stats?.events ?? "—"} href="/admin/events" />
        <StatCard label="Donations" value={stats?.donations ?? "—"} href="/admin/giving" />
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900">{a.label}</p>
              <p className="mt-1 text-sm text-slate-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Today’s workflow</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Media → add sermon with a YouTube URL</li>
          <li>Events → add or check Sunday service</li>
          <li>Livestream → paste YouTube Live URL → Go live</li>
          <li>Members → create accounts as needed</li>
        </ol>
      </div>
    </div>
  );
}
