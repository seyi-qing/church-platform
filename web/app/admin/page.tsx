"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Stats = {
  members: number;
  media: number;
  events: number;
  donations: number;
};

const ACTIONS = [
  {
    href: "/admin/media",
    label: "Add media",
    desc: "Sermon or playlist item",
    icon: "🎬",
  },
  {
    href: "/admin/events",
    label: "Add event",
    desc: "Service or gathering",
    icon: "📅",
  },
  {
    href: "/admin/livestream",
    label: "Livestream",
    desc: "YouTube live URL",
    icon: "🔴",
  },
  {
    href: "/admin/members",
    label: "Members",
    desc: "Accounts & roles",
    icon: "👥",
  },
  {
    href: "/admin/announcements",
    label: "Announce",
    desc: "Church-wide message",
    icon: "📢",
  },
  {
    href: "/admin/giving",
    label: "Giving",
    desc: "Donations & funds",
    icon: "💝",
  },
];

function StatCard({
  label,
  value,
  href,
  bar,
}: {
  label: string;
  value: string | number;
  href: string;
  bar: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </p>
      <div className={`mt-2 h-1 w-10 rounded-full bg-gradient-to-r ${bar}`} />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [churchName, setChurchName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        try {
          const org = await apiFetch<{ name?: string }>("/tenants/current");
          if (org?.name) setChurchName(org.name);
        } catch {
          /* ignore */
        }
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {churchName ? (
              <>
                <span className="font-semibold text-slate-800">{churchName}</span>
                {" · "}
              </>
            ) : null}
            Command center for people, media, and giving
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
        >
          View public site
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Members"
          value={stats?.members ?? "—"}
          href="/admin/members"
          bar="from-emerald-500 to-teal-600"
        />
        <StatCard
          label="Media"
          value={stats?.media ?? "—"}
          href="/admin/media"
          bar="from-violet-500 to-indigo-600"
        />
        <StatCard
          label="Events"
          value={stats?.events ?? "—"}
          href="/admin/events"
          bar="from-sky-500 to-blue-600"
        />
        <StatCard
          label="Donations"
          value={stats?.donations ?? "—"}
          href="/admin/giving"
          bar="from-rose-500 to-pink-600"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg shadow-sm">
                {a.icon}
              </span>
              <div>
                <p className="font-bold text-slate-900">{a.label}</p>
                <p className="mt-0.5 text-sm text-slate-500">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-sm text-blue-950">
        <p className="font-bold">Today&apos;s workflow</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-blue-900/90">
          <li>Media → add sermon with a YouTube URL</li>
          <li>Events → add or check Sunday service</li>
          <li>Livestream → paste YouTube Live URL → Go live</li>
          <li>Members → create accounts as needed</li>
        </ol>
      </div>
    </div>
  );
}
