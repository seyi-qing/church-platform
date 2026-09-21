"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Donation = {
  id: number;
  amount_cents: number;
  currency?: string;
  fund: string;
  status: string;
  donor_name: string | null;
  donor_email: string | null;
  created_at: string;
};

function money(cents: number | null | undefined) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${(n / 100).toFixed(2)}`;
}

export default function AdminGivingPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Donation[]>("/giving/admin/all?limit=100")
      .catch(() => apiFetch<Donation[]>("/giving/history?limit=100"))
      .then(setItems)
      .catch((err) => {
        setError(err.message || "Failed to load giving");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCents = items
    .filter((d) => (d.status || "").toLowerCase() === "succeeded")
    .reduce((sum, d) => sum + (Number(d.amount_cents) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Giving & tithes</h1>
        <p className="text-sm text-slate-500">
          Donations from /give (demo or Stripe). Amounts are stored in cents.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-2.5 text-sm font-semibold text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Aggregated revenue
          </span>
          <span className="mt-1 block text-2xl font-extrabold text-slate-900">{money(totalCents)}</span>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Records</span>
          <span className="mt-1 block text-2xl font-extrabold text-slate-900">{items.length}</span>
        </div>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ledger</span>
        </div>
        <ul className="divide-y text-slate-700">
          {items.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">
                  {money(d.amount_cents)} · <span className="text-blue-600">{d.fund || "General"}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {d.donor_name || d.donor_email || "Anonymous"} ·{" "}
                  <span
                    className={`ml-1 rounded-full px-1.5 text-[10px] font-bold uppercase ${
                      (d.status || "").toLowerCase() === "succeeded"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </p>
              </div>
              <p className="text-xs font-medium text-slate-400">
                {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
              </p>
            </li>
          ))}
          {!loading && items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-400">No gifts yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
