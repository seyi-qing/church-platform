"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/analytics/overview?days=30")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["users", "members", "giving_cents", "media_published", "attendance", "event_registrations"].map((k) => (
            <div key={k} className="rounded-xl border bg-white p-5">
              <p className="text-xs font-semibold uppercase text-slate-500">{k.replace(/_/g, " ")}</p>
              <p className="mt-2 text-2xl font-bold">
                {k === "giving_cents" ? `$${((stats[k] || 0) / 100).toFixed(2)}` : stats[k]}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/members" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Members</Link>
        <Link href="/admin/media" className="rounded-lg border px-4 py-2 text-sm">Media</Link>
        <Link href="/admin/care" className="rounded-lg border px-4 py-2 text-sm">Care</Link>
        <Link href="/admin/notifications" className="rounded-lg border px-4 py-2 text-sm">Notifications</Link>
      </div>
    </div>
  );
}
