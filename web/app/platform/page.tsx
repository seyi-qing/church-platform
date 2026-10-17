"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Org = {
  id: number;
  name: string;
  slug: string;
  plan: string;
  subscription_status?: string | null;
  is_active: boolean;
  tagline?: string | null;
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
    violet: "from-violet-500 to-indigo-600",
    green: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    slate: "from-slate-600 to-slate-800",
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
      <div className={`mt-2 h-1 w-10 rounded-full bg-gradient-to-r ${tones[tone]}`} />
    </div>
  );
}

export default function PlatformPage() {
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
      const list = await apiFetch<Org[]>("/tenants");
      setOrgs(Array.isArray(list) ? list : []);
      setError("");
    } catch (e: any) {
      setError(e.message || "Could not load tenants");
    }
  }

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await apiFetch("/tenants", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          plan,
        }),
      });
      setName("");
      setSlug("");
      setMsg("Church tenant created.");
      await load();
    } catch (err: any) {
      setError(err.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function startBilling(id: number, planName: string = "growth") {
    setMsg("");
    setError("");
    setBusy(true);
    try {
      const res = await apiFetch<{
        url?: string | null;
        demo?: boolean;
        message?: string;
      }>(`/tenants/${id}/billing/checkout?plan=${encodeURIComponent(planName)}`, {
        method: "POST",
      });
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setMsg(
        res.message ||
          "Plan activated (demo mode — add STRIPE_SECRET_KEY on Render for live checkout)."
      );
      await load();
    } catch (err: any) {
      setError(err.message || "Billing failed");
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
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Platform · Churches & plans
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          SaaS control plane — tenants, Act-as, and billing (demo or Stripe).
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
          <Link href="/admin" className="ml-3 font-semibold text-sky-800 underline">
            Open admin →
          </Link>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {msg && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</p>
      )}

      <form
        id="create"
        onSubmit={createTenant}
        className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-5 shadow-sm"
      >
        <h2 className="font-bold text-violet-950">Create church tenant</h2>
        <input
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
          placeholder="Church name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
          placeholder="slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="starter">starter</option>
          <option value="growth">growth</option>
          <option value="pro">pro</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-violet-700 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create tenant"}
        </button>
      </form>

      <div>
        <h2 className="mb-3 font-bold text-slate-900">Tenants ({orgs.length})</h2>
        <ul className="space-y-3">
          {orgs.map((o) => (
            <li key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{o.name}</p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{o.slug}</span>
                    {" · "}
                    <span
                      className={
                        o.is_active
                          ? "font-semibold text-emerald-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {o.is_active ? "active" : "inactive"}
                    </span>
                    {" · "}
                    <span className="font-semibold">{o.plan}</span>
                    {o.subscription_status ? (
                      <>
                        {" · "}
                        <span className="font-semibold text-violet-700">
                          {o.subscription_status}
                        </span>
                      </>
                    ) : null}
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
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startBilling(o.id, o.plan || "growth")}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
                  >
                    Billing / plan
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
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {o.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-400">
        Billing uses demo mode until <code className="rounded bg-slate-100 px-1">STRIPE_SECRET_KEY</code>{" "}
        is set on Render. Then Checkout opens for real subscriptions.
      </p>
    </div>
  );
}
