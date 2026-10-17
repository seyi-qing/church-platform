"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Org = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  service_times: string | null;
  address: string | null;
};

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "violet" | "green" | "amber" | "slate";
}) {
  const tones = {
    violet: "from-violet-50 to-white border-violet-200 text-violet-900",
    green: "from-emerald-50 to-white border-emerald-200 text-emerald-900",
    amber: "from-amber-50 to-white border-amber-200 text-amber-900",
    slate: "from-slate-50 to-white border-slate-200 text-slate-900",
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br px-4 py-3 shadow-sm ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default function PlatformDashboardPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [busy, setBusy] = useState(false);
  const [activeName, setActiveName] = useState<string | null>(null);

  useEffect(() => {
    try {
      setActiveName(localStorage.getItem("active_tenant_name"));
    } catch {
      /* ignore */
    }
    load();
  }, []);

  async function load() {
    try {
      setError("");
      const list = await apiFetch<Org[]>("/tenants");
      setOrgs(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e.message || "Could not load tenants");
    }
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setError("");
    try {
      await apiFetch("/tenants", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          plan,
        }),
      });
      setName("");
      setSlug("");
      setMsg("Tenant created");
      await load();
    } catch (err: any) {
      setError(err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function actAs(id: number) {
    setMsg("");
    setError("");
    try {
      const org = await apiFetch<Org>(`/tenants/${id}/act-as`, { method: "POST" });
      try {
        localStorage.setItem("active_tenant_id", String(org.id));
        localStorage.setItem("active_tenant_name", org.name);
      } catch {
        /* ignore */
      }
      setActiveName(org.name);
      setMsg(`Working as ${org.name}. Open church admin to manage that tenant.`);
    } catch (err: any) {
      setError(err.message || "Could not switch tenant");
    }
  }

  async function setPlanFor(id: number, next: string) {
    try {
      await apiFetch(`/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ plan: next }),
      });
      await load();
    } catch (err: any) {
      setError(err.message || "Plan update failed");
    }
  }

  async function toggleActive(id: number, is_active: boolean) {
    try {
      await apiFetch(`/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !is_active }),
      });
      await load();
    } catch (err: any) {
      setError(err.message || "Update failed");
    }
  }

  const activeCount = orgs.filter((o) => o.is_active).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform · Churches & plans</h1>
        <p className="mt-1 text-sm text-slate-500">
          SaaS control plane — all tenants (same idea as your school platform console).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Churches" value={orgs.length} tone="violet" />
        <Kpi label="Active" value={activeCount} tone="green" />
        <Kpi label="Inactive" value={orgs.length - activeCount} tone="amber" />
        <Kpi label="Plans" value="3" tone="slate" />
      </div>

      {activeName && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Working as: <strong>{activeName}</strong>
          <span className="ml-2 text-xs text-sky-700">
            Use Church admin tools for that tenant.
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="#create"
          className="rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm hover:border-violet-300"
        >
          <p className="font-bold text-violet-900">Create tenant</p>
          <p className="mt-1 text-xs text-violet-700">Provision a new church</p>
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border bg-white p-4 shadow-sm hover:border-slate-300"
        >
          <p className="font-bold text-slate-900">Church admin</p>
          <p className="mt-1 text-xs text-slate-500">Ops for active / default tenant</p>
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-xl border bg-white p-4 shadow-sm hover:border-slate-300"
        >
          <p className="font-bold text-slate-900">Church settings</p>
          <p className="mt-1 text-xs text-slate-500">Brand · service times</p>
        </Link>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{msg}</p>
      )}

      <form
        id="create"
        onSubmit={createOrg}
        className="scroll-mt-20 space-y-3 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="font-bold text-slate-900">Onboard church</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Hope Chapel"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="hope-chapel"
            />
          </div>
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="starter">starter</option>
          <option value="growth">growth</option>
          <option value="pro">pro</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="block rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create tenant"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">Tenants ({orgs.length})</h2>
        <ul className="space-y-3">
          {orgs.map((o) => (
            <li key={o.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{o.name}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{o.slug}</span>
                    {" · "}
                    <span className={o.is_active ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                      {o.is_active ? "active" : "inactive"}
                    </span>
                    {" · "}
                    <span className="font-semibold">{o.plan}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => actAs(o.id)}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Work as this church
                  </button>
                  <select
                    value={o.plan}
                    onChange={(e) => setPlanFor(o.id, e.target.value)}
                    className="rounded-lg border px-2 py-1 text-xs"
                  >
                    <option value="starter">starter</option>
                    <option value="growth">growth</option>
                    <option value="pro">pro</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => toggleActive(o.id, o.is_active)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                  >
                    {o.is_active ? "Suspend" : "Activate"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-400">
        Next: isolate all church data by organization_id, then Stripe billing per tenant — same path as
        qing-school.
      </p>
    </div>
  );
}
