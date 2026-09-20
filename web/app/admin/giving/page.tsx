"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Donation = {
  id: number;
  amount: number; // 💡 Backend schema field uses 'amount' (stored in cents)
  fund: string;
  status: string;
  donor_name: string | null;
  donor_email: string | null;
  created_at: string;
};

export default function AdminGivingPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Hits your matching historical database endpoint sequence
    apiFetch<Donation[]>("/giving/history?limit=50")
      .then(setItems)
      .catch((err) => {
        setError(err.message || "Failed to audit transactions");
        setItems([]);
      });
  }, []);

  // Calculate sum of successful financial tithes and campaign offerings
  const totalAmountCents = items
    .filter((d) => d.status.toLowerCase() === "succeeded" || d.status.toLowerCase() === "paid")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Giving & Tithe Logs</h1>
        <p className="text-sm text-slate-500">Track financial giving histories and campaign distributions coming from Stripe.</p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg font-semibold">{error}</p>}

      {/* Financial Metrics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggregated Revenue</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1">
            \${(totalAmountCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audited Records</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1">{items.length}</span>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Database Ledger</span>
        </div>
        <ul className="divide-y text-slate-700">
          {items.map((d) => (
            <li key={d.id} className="flex justify-between items-center px-4 py-3 text-sm hover:bg-slate-50 transition">
              <div>
                <p className="font-semibold text-slate-900">
                  \${(d.amount / 100).toFixed(2)} · <span className="text-brand-600 font-medium">{d.fund || "General Fund"}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {d.donor_name || d.donor_email || "Anonymous Giver"} · 
                  <span className={`ml-1 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                    d.status.toLowerCase() === "succeeded" || d.status.toLowerCase() === "paid" 
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {d.status}
                  </span>
                </p>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {new Date(d.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </p>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-slate-400 text-sm">No transaction history records recorded yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
                      }
