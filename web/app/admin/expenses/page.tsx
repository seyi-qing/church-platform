"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Expense = {
  id: number;
  title: string;
  category: string;
  amount_cents: number;
  expense_date: string;
  notes: string | null;
};

function money(cents: number) {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function AdminExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    apiFetch<Expense[]>("/expenses?limit=50")
      .then(setItems)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      if (!cents) throw new Error("Enter a valid amount");
      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          title,
          category,
          amount_cents: cents,
        }),
      });
      setTitle("");
      setAmount("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const total = items.reduce((s, x) => s + (x.amount_cents || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-sm text-slate-500">Record spending for accountability and reports.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-lg font-semibold">Total listed: {money(total)}</p>
      <form onSubmit={create} className="space-y-2 rounded-xl border bg-white p-4">
        <input
          required
          placeholder="Title"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Category"
            className="rounded-lg border px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Amount USD"
            className="rounded-lg border px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {saving ? "Saving…" : "Add expense"}
        </button>
      </form>
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((x) => (
          <li key={x.id} className="flex justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{x.title}</p>
              <p className="text-xs text-slate-500">{x.category}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{money(x.amount_cents)}</p>
              <p className="text-xs text-slate-400">{x.expense_date}</p>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No expenses yet.</li>
        )}
      </ul>
    </div>
  );
}
