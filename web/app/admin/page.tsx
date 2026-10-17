"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  IconMedia,
  IconEvent,
  IconLive,
  IconPeople,
  IconAnnounce,
  IconGive,
} from "@/components/AdminIcons";

type Stats = {
  members: number;
  media: number;
  events: number;
  donations: number;
};

const ACTIONS: {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  tone: string;
}[] = [
  {
    href: "/admin/media",
    label: "Add media",
    desc: "Sermon or playlist item",
    icon: <IconMedia className="h-5 w-5" />,
    tone: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  {
    href: "/admin/events",
    label: "Add event",
    desc: "Service or gathering",
    icon: <IconEvent className="h-5 w-5" />,
    tone: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    href: "/admin/livestream",
    label: "Livestream",
    desc: "YouTube live URL",
    icon: <IconLive className="h-5 w-5" />,
    tone: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    href: "/admin/members",
    label: "Members",
    desc: "Accounts & roles",
    icon: <IconPeople className="h-5 w-5" />,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    href: "/admin/announcements",
    label: "Announce",
    desc: "Church-wide message",
    icon: <IconAnnounce className="h-5 w-5" />,
    tone: "bg-amber-50 text-amber-800 ring-amber-100",
  },
  {
    href: "/admin/giving",
    label: "Giving",
    desc: "Donations & funds",
    icon: <IconGive className="h-5 w-5" />,
    tone: "bg-pink-50 text-pink-700 ring-pink-100",
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

  const isEmptyTenant =
    stats &&
    stats.media === 0 &&
    stats.events === 0 &&
    stats.donations === 0;

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

      {isEmptyTenant && (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-5 shadow-sm">
          <p className="text-sm font-bold text-indigo-950">New church workspace</p>
          <p className="mt-1 text-sm leading-relaxed text-indigo-900/80">
            This tenant has no sermons, events, or gifts yet. Start with media and a Sunday event —
            the public site will fill in as you publish.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/media"
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Add first sermon
            </Link>
            <Link
              href="/admin/events"
              className="rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              Add event
            </Link>
            <Link
              href="/admin/livestream"
              className="rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              Set livestream
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${a.tone}`}
              >
                {a.icon}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 group-hover:text-blue-700">{a.label}</p>
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
