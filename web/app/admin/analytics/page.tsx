"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);

  useEffect(() => {
    apiFetch(`/analytics/overview?days=${days}`).then(setStats).catch(() => setStats(null));
    apiFetch(`/analytics/giving-by-fund?days=${days}`).then(setFunds).catch(() => setFunds([]));
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded border px-3 py-2 text-sm">
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>365 days</option>
        </select>
      </div>
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">{k.replace(/_/g, " ")}</p>
              <p className="mt-1 text-xl font-bold">{String(v)}</p>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold">Giving by fund</h2>
        <ul className="mt-3 space-y-2">
          {funds.map((f) => (
            <li key={f.fund} className="flex justify-between text-sm">
              <span>{f.fund}</span>
              <span>${((f.amount_cents || 0) / 100).toFixed(2)}</span>
            </li>
          ))}
          {funds.length === 0 && <li className="text-slate-500">No data</li>}
        </ul>
      </div>
    </div>
  );
}
