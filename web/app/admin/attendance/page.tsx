"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Row = {
  id: number;
  event_id: number | null;
  member_id: number;
  checked_in_at: string;
  notes: string | null;
};

export default function AdminAttendancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [memberId, setMemberId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function load() {
    apiFetch<Row[]>("/members/attendance?limit=100")
      .then(setRows)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function checkIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/members/attendance", {
        method: "POST",
        body: JSON.stringify({
          member_id: parseInt(memberId, 10),
          notes: notes || null,
        }),
      });
      setMemberId("");
      setNotes("");
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-slate-500">
          Check in members by profile ID (from Members). Reports show engagement over time.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={checkIn} className="flex flex-wrap gap-2 rounded-xl border bg-white p-4">
        <input
          required
          type="number"
          placeholder="Member profile ID"
          className="rounded-lg border px-3 py-2 text-sm"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        />
        <input
          placeholder="Notes (optional)"
          className="min-w-[160px] flex-1 rounded-lg border px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Check in
        </button>
      </form>
      <ul className="divide-y rounded-xl border bg-white">
        {rows.map((r) => (
          <li key={r.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              Profile #{r.member_id}
              {r.notes ? ` · ${r.notes}` : ""}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(r.checked_in_at).toLocaleString()}
            </span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No check-ins yet.</li>
        )}
      </ul>
    </div>
  );
}
