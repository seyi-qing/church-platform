"use client";

import { useEffect, useState } from "react";
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
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Profile[]>("/members/profiles?limit=100").catch(() => []),
      apiFetch<User[]>("/members/users").catch(() => []),
    ]).then(([p, u]) => {
      setProfiles(p);
      setUsers(u);
    });
  }, []);

  const byUser = Object.fromEntries(users.map((u) => [u.id, u]));
  const visitors = profiles.filter(
    (p) => (p.membership_status || "").toLowerCase() === "visitor"
  );

  async function markVisitor(profileId: number) {
    setError("");
    try {
      await apiFetch(`/members/profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify({ membership_status: "visitor" }),
      });
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, membership_status: "visitor" } : p))
      );
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
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, membership_status: "active" } : p))
      );
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visitors</h1>
        <p className="text-sm text-slate-500">
          Capture and nurture new people. Status colors:{" "}
          <span className="font-semibold text-emerald-700">active</span>,{" "}
          <span className="font-semibold text-sky-700">visitor</span>.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

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
