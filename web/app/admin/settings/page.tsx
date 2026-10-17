"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Org = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  primary_color: string;
  logo_url: string | null;
  timezone: string;
  service_times: string | null;
  address: string | null;
  plan: string;
  is_active: boolean;
};

export default function AdminChurchSettingsPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [serviceTimes, setServiceTimes] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError("");
      const o = await apiFetch<Org>("/tenants/current");
      setOrg(o);
      setName(o.name || "");
      setTagline(o.tagline || "");
      setServiceTimes(o.service_times || "");
      setAddress(o.address || "");
      setTimezone(o.timezone || "");
      setPrimaryColor(o.primary_color || "#1d4ed8");
    } catch (e: any) {
      setError(e.message || "Could not load church settings");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const o = await apiFetch<Org>("/tenants/current", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          tagline: tagline.trim() || null,
          service_times: serviceTimes.trim() || null,
          address: address.trim() || null,
          timezone: timezone.trim() || null,
          primary_color: primaryColor.trim() || "#1d4ed8",
        }),
      });
      setOrg(o);
      setMsg("Saved. Public site will use these details on the next load.");
    } catch (err: any) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Church settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tenant / organization branding for this church. Multi-tenant SaaS builds on this record.
        </p>
      </div>

      {org && (
        <div className="rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Slug:</span> {org.slug}
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-semibold text-slate-800">Plan:</span> {org.plan}
          <span className="mx-2 text-slate-300">·</span>
          ID {org.id}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{msg}</p>
      )}

      <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Church name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Tagline</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="A community following Jesus together"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Service times</label>
          <input
            value={serviceTimes}
            onChange={(e) => setServiceTimes(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Sundays · 10:00 AM"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Address / city</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Kampala, Uganda"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Timezone</label>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Africa/Kampala"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Primary color</label>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={primaryColor.startsWith("#") ? primaryColor : "#1d4ed8"}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border"
            />
            <input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save church settings"}
        </button>
      </form>

      <p className="text-xs text-slate-400">
        Next SaaS steps: signup for new churches, subdomain routing, and scoping all data by{" "}
        <code className="rounded bg-slate-100 px-1">organization_id</code>.
      </p>
    </div>
  );
}
