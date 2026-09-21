"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";

type Campus = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  timezone: string;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  is_active: boolean;
};

export default function AdminCampusesPage() {
  const [items, setItems] = useState<Campus[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    is_primary: false,
  });
  const [saving, setSaving] = useState(false);

  function load() {
    apiFetch<Campus[]>("/campuses?active_only=false")
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
      const slug =
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      await apiFetch("/campuses", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          slug,
          city: form.city || null,
          address: form.address || null,
          phone: form.phone || null,
          email: form.email || null,
          is_primary: form.is_primary,
        }),
      });
      setForm({
        name: "",
        slug: "",
        city: "",
        address: "",
        phone: "",
        email: "",
        is_primary: false,
      });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campuses / branches</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage multiple locations under one platform.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <input
          required
          placeholder="Campus name"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Slug (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            placeholder="City"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            placeholder="Phone"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <input
          placeholder="Address"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
          />
          Primary campus
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add campus"}
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="No campuses yet"
          description="Add your main campus or multiple branches for multi-site oversight."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">{c.name}</p>
                {c.is_primary && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    primary
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {[c.city, c.address].filter(Boolean).join(" · ") || c.slug}
              </p>
              {(c.phone || c.email) && (
                <p className="mt-1 text-xs text-slate-400">
                  {[c.phone, c.email].filter(Boolean).join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
