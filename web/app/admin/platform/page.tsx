"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

type Org = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  plan: string;
  is_active: boolean;
  service_times: string | null;
  address: string | null;
};

export default function PlatformAdminPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u = getStoredUser<{ is_superuser?: boolean }>();
    if (!u?.is_superuser) {
      router.replace("/admin");
      return;
    }
    load();
  }, [router]);

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
      setMsg(`Acting as ${org.name}. Open Church settings to edit branding.`);
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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Platform</p>
        <h1 className="text-2xl font-bold text-slate-900">Super-admin · Tenants</h1>
        <p className="mt-1 text-sm text-slate-500">
          Oversee all churches, plans, and billing readiness. Act as a tenant to use their admin tools.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{msg}</p>
      )}

      <form onSubmit={createOrg} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Create church tenant</h2>
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
            <label className="text-xs font-semibold uppercase text-slate-500">Slug (optional)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="hope-chapel"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm sm:w-48"
          >
            <option value="starter">starter</option>
            <option value="growth">growth</option>
            <option value="pro">pro</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create tenant"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-bold text-slate-900">All tenants ({orgs.length})</h2>
        {orgs.length === 0 ? (
          <p className="text-sm text-slate-500">No tenants yet.</p>
        ) : (
          <ul className="space-y-3">
            {orgs.map((o) => (
              <li
                key={o.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{o.name}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono">{o.slug}</span>
                      {" · "}
                      <span
                        className={
                          o.is_active ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"
                        }
                      >
                        {o.is_active ? "active" : "inactive"}
                      </span>
                      {" · plan "}
                      <span className="font-semibold">{o.plan}</span>
                    </p>
                    {(o.service_times || o.address) && (
                      <p className="mt-1 text-xs text-slate-400">
                        {[o.service_times, o.address].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => actAs(o.id)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Act as
                    </button>
                    <Link
                      href="/admin/settings"
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Settings
                    </Link>
                    <select
                      value={o.plan}
                      onChange={(e) => setPlanFor(o.id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs"
                      title="Change plan"
                    >
                      <option value="starter">starter</option>
                      <option value="growth">growth</option>
                      <option value="pro">pro</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => toggleActive(o.id, o.is_active)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {o.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Billing (Stripe subscriptions per tenant) is the next phase after data isolation by{" "}
        <code className="rounded bg-slate-100 px-1">organization_id</code>.
      </p>
    </div>
  );
}
