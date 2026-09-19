"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Donation = {
  id: number;
  amount_cents: number;
  fund: string;
  status: string;
  donor_name: string | null;
  donor_email: string | null;
  created_at: string;
};

export default function AdminGivingPage() {
  const [items, setItems] = useState<Donation[]>([]);

  useEffect(() => {
    apiFetch<Donation[]>("/giving/history?limit=50")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Giving</h1>
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((d) => (
          <li key={d.id} className="flex justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">${(d.amount_cents / 100).toFixed(2)} · {d.fund}</p>
              <p className="text-xs text-slate-500">{d.donor_name || d.donor_email || "Anonymous"} · {d.status}</p>
            </div>
            <p className="text-xs text-slate-400">{new Date(d.created_at).toLocaleString()}</p>
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-8 text-center text-slate-500">No donations yet</li>}
      </ul>
    </div>
  );
}
