"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type Profile = {
  id: number;
  user_id: number;
  membership_status: string;
  notes: string | null;
};

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

type CareCard = {
  id: number;
  requester_name: string;
  category: string;
  priority: string;
  summary: string;
  assigned_to: number | null;
};

type CareBoard = {
  open?: CareCard[];
  assigned?: CareCard[];
};

function StatusPill({ status }: { status: string }) {
  const s = (status || "active").toLowerCase();
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    visitor: "bg-sky-100 text-sky-800",
    inactive: "bg-slate-100 text-slate-600",
    pending: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
        styles[s] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "active"}
    </span>
  );
}

export default function AdminVisitorsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [followUps, setFollowUps] = useState<CareCard[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    notes: "",
    create_follow_up: true,
  });
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([
      apiFetch<Profile[]>("/members/profiles?limit=100").catch(() => [] as Profile[]),
      apiFetch<User[]>("/members/users").catch(() => [] as User[]),
      apiFetch<CareBoard>("/care/workflow/board").catch(
        (): CareBoard => ({ open: [], assigned: [] })
      ),
    ]).then(([p, u, board]) => {
      setProfiles(p);
      setUsers(u);
      const open = board.open ?? [];
      const assigned = board.assigned ?? [];
      setFollowUps(
        [...open, ...assigned].filter(
          (c) => (c.category || "").toLowerCase() === "visitor" || c.summary?.includes("visitor")
        )
      );
    });
  }

  useEffect(() => {
    load();
  }, []);

  const byUser = Object.fromEntries(users.map((u) => [u.id, u]));
  const visitors = profiles.filter(
    (p) => (p.membership_status || "").toLowerCase() === "visitor"
  );

  async function captureVisitor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const res = await apiFetch<{
        ok: boolean;
        follow_up_id: number | null;
        profile_id: number;
      }>("/members/visitors", {
        method: "POST",
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email || null,
          phone: form.phone || null,
          notes: form.notes || null,
          create_follow_up: form.create_follow_up,
        }),
      });
      setInfo(
        res.follow_up_id
          ? `Visitor saved. Follow-up #${res.follow_up_id} opened on Care board.`
          : "Visitor saved."
      );
      setForm({ full_name: "", email: "", phone: "", notes: "", create_follow_up: true });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function markVisitor(profileId: number) {
    setError("");
    try {
      await apiFetch(`/members/profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({ membership_status: "visitor" }),
      });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function markActive(profileId: number) {
    setError("");
    try {
      await apiFetch(`/members/profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({ membership_status: "active" }),
      });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function advanceFollowUp(id: number) {
    try {
      await apiFetch(`/care/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "assigned" }),
      });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Visitors</h1>
          <p className="text-sm text-slate-500">
            Capture new people and open a follow-up for pastoral care.
          </p>
        </div>
        <Link href="/admin/care" className="text-sm font-semibold text-blue-600 hover:underline">
          Care board →
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>}

      <form onSubmit={captureVisitor} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Capture visitor</h2>
        <input
          required
          placeholder="Full name"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="email"
            placeholder="Email (optional)"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone (optional)"
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <textarea
          placeholder="Notes / how they found us"
          className="min-h-[70px] w-full rounded-lg border px-3 py-2 text-sm"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.create_follow_up}
            onChange={(e) => setForm({ ...form, create_follow_up: e.target.checked })}
          />
          Open care follow-up
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save visitor"}
        </button>
      </form>

      {followUps.length > 0 && (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Open visitor follow-ups
          </h2>
          <ul className="mt-3 divide-y">
            {followUps.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-medium">{f.requester_name}</p>
                  <p className="text-xs text-slate-500">{f.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => advanceFollowUp(f.id)}
                  className="rounded border px-2 py-1 text-xs font-semibold"
                >
                  Mark assigned
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Current visitors
        </h2>
        <ul className="mt-3 divide-y">
          {visitors.map((p) => {
            const u = byUser[p.user_id];
            return (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{u?.full_name || `User #${p.user_id}`}</p>
                  <p className="text-xs text-slate-500">{u?.email}</p>
                  <div className="mt-1">
                    <StatusPill status={p.membership_status} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => markActive(p.id)}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                >
                  Mark active
                </button>
              </li>
            );
          })}
          {visitors.length === 0 && (
            <li className="py-4 text-sm text-slate-500">No visitors tagged yet.</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          All profiles
        </h2>
        <ul className="mt-3 divide-y">
          {profiles.map((p) => {
            const u = byUser[p.user_id];
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-medium">{u?.full_name || `Profile #${p.id}`}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <StatusPill status={p.membership_status} />
                    <span>user #{p.user_id}</span>
                  </div>
                </div>
                {p.membership_status !== "visitor" && (
                  <button
                    type="button"
                    onClick={() => markVisitor(p.id)}
                    className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800"
                  >
                    Mark visitor
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
