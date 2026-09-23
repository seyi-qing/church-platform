"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Row = {
  id: number;
  event_id: number | null;
  member_id: number;
  full_name?: string;
  email?: string;
  checked_in_at: string;
  notes: string | null;
};

type Person = {
  user_id: number;
  profile_id: number | null;
  full_name: string;
  email: string;
  membership_status: string;
};

function friendlyError(msg: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("abort")) {
    return "Could not reach the server (often a cold start). Wait ~30s and tap Retry.";
  }
  if (m.includes("unauthorized")) {
    return "Session expired — sign in again via Staff login.";
  }
  return msg || "Request failed";
}

export default function AdminAttendancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [matches, setMatches] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError("");
    apiFetch<Row[]>("/members/attendance?limit=100")
      .then(setRows)
      .catch((e) => setError(friendlyError(e.message)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (q.trim().length < 1) {
      setMatches([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      apiFetch<Person[]>(`/members/directory?q=${encodeURIComponent(q.trim())}&limit=15`)
        .then(setMatches)
        .catch(() => setMatches([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function checkIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!selected?.profile_id) {
      setError("Search and select a person who has a member profile.");
      return;
    }
    try {
      await apiFetch("/members/attendance", {
        method: "POST",
        body: JSON.stringify({
          member_id: selected.profile_id,
          notes: notes || null,
        }),
      });
      setInfo(`Checked in ${selected.full_name}`);
      setQ("");
      setSelected(null);
      setMatches([]);
      setNotes("");
      load();
    } catch (err: any) {
      setError(friendlyError(err.message));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-slate-500">
            Search by <strong>name</strong> and check in — no need to remember profile IDs.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          Retry load
        </button>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={load} className="mt-1 text-xs font-semibold underline">
            Retry
          </button>
        </div>
      )}
      {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>}

      <form onSubmit={checkIn} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Search name or email</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Start typing…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(null);
            }}
          />
        </label>
        {searching && <p className="text-xs text-slate-400">Searching…</p>}
        {matches.length > 0 && !selected && (
          <ul className="max-h-48 overflow-auto rounded-lg border divide-y">
            {matches.map((p) => (
              <li key={p.user_id}>
                <button
                  type="button"
                  disabled={!p.profile_id}
                  onClick={() => {
                    setSelected(p);
                    setQ(p.full_name);
                    setMatches([]);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>
                    <span className="font-medium">{p.full_name}</span>
                    <span className="ml-2 text-xs text-slate-500">{p.email}</span>
                  </span>
                  <span className="text-[10px] uppercase text-slate-400">{p.membership_status}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && (
          <p className="text-sm text-slate-700">
            Selected: <strong>{selected.full_name}</strong> ({selected.email})
          </p>
        )}
        <input
          placeholder="Notes (optional)"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Check in
        </button>
      </form>

      {loading && <p className="text-sm text-slate-500">Loading check-ins…</p>}
      <ul className="divide-y rounded-xl border bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">{r.full_name || `Profile #${r.member_id}`}</p>
              <p className="text-xs text-slate-500">
                {r.email}
                {r.notes ? ` · ${r.notes}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {new Date(r.checked_in_at).toLocaleString()}
            </span>
          </li>
        ))}
        {!loading && rows.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No check-ins yet.</li>
        )}
      </ul>
    </div>
  );
}
