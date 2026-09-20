"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Overview = {
  period_days?: number;
  users?: number;
  members?: number | { total: number; new_in_period?: number };
  giving?: { donation_count?: number; total_cents?: number; total_dollars?: number };
  media?: { total_views?: number } | number;
  events?: { count_in_period?: number; registrations?: number; attendance_checkins?: number };
  [key: string]: unknown;
};

type FundRow = { fund: string; count?: number; total_dollars?: number; total_cents?: number };

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Overview | null>(null);
  const [funds, setFunds] = useState<FundRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      apiFetch<Overview>(`/analytics/overview?days=${days}`).catch(() => null),
      apiFetch<FundRow[]>(`/analytics/giving-by-fund?days=${days}`).catch(() => [] as FundRow[]),
    ])
      .then(([overview, fundRows]) => {
        setStats(overview);
        setFunds(Array.isArray(fundRows) ? fundRows : []);
      })
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [days]);

  const memberTotal =
    typeof stats?.members === "number"
      ? stats.members
      : stats?.members && typeof stats.members === "object"
        ? stats.members.total
        : "—";

  const givingDollars =
    stats?.giving?.total_dollars ??
    (stats?.giving?.total_cents != null ? stats.giving.total_cents / 100 : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Overview for the selected period</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Users" value={String(stats?.users ?? "—")} sub={`${days}d window`} />
            <Kpi label="Members" value={String(memberTotal)} sub="Directory" />
            <Kpi
              label="Giving"
              value={givingDollars != null ? `$${Number(givingDollars).toFixed(2)}` : "$0.00"}
              sub={`${stats?.giving?.donation_count ?? 0} gifts`}
            />
            <Kpi
              label="Media views"
              value={String(
                typeof stats?.media === "object" && stats?.media
                  ? (stats.media as { total_views?: number }).total_views ?? "—"
                  : stats?.media ?? "—"
              )}
              sub="Published items"
            />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Giving by fund</h2>
            {funds.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No giving data yet.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {funds.map((f) => (
                  <li key={f.fund} className="flex justify-between py-2 text-sm">
                    <span className="font-medium text-slate-800">{f.fund}</span>
                    <span className="text-slate-600">
                      ${
                        f.total_dollars != null
                          ? Number(f.total_dollars).toFixed(2)
                          : ((f.total_cents ?? 0) / 100).toFixed(2)
                      }{" "}
                      <span className="text-slate-400">({f.count ?? 0})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
