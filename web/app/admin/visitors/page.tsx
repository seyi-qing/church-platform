"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Profile = {
  id: number;
  user_id: number;
  membership_status: string;
  address: string | null;
  notes: string | null;
  created_at: string;
};

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visitors</h1>
        <p className="text-sm text-slate-500">
          Capture and nurture new people. Mark profiles as visitor from the list below.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold uppercase text-slate-500">Current visitors</h2>
        <ul className="mt-3 divide-y">
          {visitors.map((p) => {
            const u = byUser[p.user_id];
            return (
              <li key={p.id} className="py-2 text-sm">
                <p className="font-medium">{u?.full_name || `User #${p.user_id}`}</p>
                <p className="text-xs text-slate-500">{u?.email}</p>
                {p.notes && <p className="text-xs text-slate-600">{p.notes}</p>}
              </li>
            );
          })}
          {visitors.length === 0 && (
            <li className="py-4 text-sm text-slate-500">No visitors tagged yet.</li>
          )}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold uppercase text-slate-500">All profiles</h2>
        <ul className="mt-3 divide-y">
          {profiles.map((p) => {
            const u = byUser[p.user_id];
            return (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{u?.full_name || `Profile #${p.id}`}</p>
                  <p className="text-xs text-slate-500">
                    {p.membership_status} · user #{p.user_id}
                  </p>
                </div>
                {p.membership_status !== "visitor" && (
                  <button
                    type="button"
                    onClick={() => markVisitor(p.id)}
                    className="rounded border px-2 py-1 text-xs font-semibold"
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
