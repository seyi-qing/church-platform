"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Meeting = {
  id: number;
  title: string;
  meeting_type: string;
  location?: string | null;
  start_at: string;
  agenda?: string | null;
  notes?: string | null;
  status: string;
};

const TYPES = [
  { value: "staff", label: "Staff" },
  { value: "elders", label: "Elders / board" },
  { value: "ministry", label: "Ministry" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusClass(s: string) {
  if (s === "scheduled") return "bg-blue-50 text-blue-800 border-blue-200";
  if (s === "completed") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function AdminMeetingsPage() {
  const [items, setItems] = useState<Meeting[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("staff");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [agenda, setAgenda] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [notes, setNotes] = useState("");

  async function load() {
    try {
      setError("");
      setItems(await apiFetch<Meeting[]>("/meetings"));
    } catch (e: any) {
      setError(e.message || "Could not load meetings");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startAt) return;
    setLoading(true);
    try {
      await apiFetch("/meetings", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          meeting_type: meetingType,
          location: location.trim() || null,
          start_at: new Date(startAt).toISOString(),
          agenda: agenda.trim() || null,
          status: "scheduled",
        }),
      });
      setTitle("");
      setLocation("");
      setStartAt("");
      setAgenda("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes(m: Meeting) {
    try {
      await apiFetch(`/meetings/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes, status: "completed" }),
      });
      setEditing(null);
      setNotes("");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function setStatus(id: number, status: string) {
    try {
      await apiFetch(`/meetings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this meeting?")) return;
    try {
      await apiFetch(`/meetings/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meetings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Staff and leadership meetings — schedule, agenda, and notes.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}

      <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Schedule meeting</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            required
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder="Agenda (optional)"
          rows={3}
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Add meeting"}
        </button>
      </form>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No meetings scheduled yet.
          </li>
        ) : (
          items.map((m) => (
            <li key={m.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(m.start_at).toLocaleString()}
                    {m.location ? ` · ${m.location}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {TYPES.find((t) => t.value === m.meeting_type)?.label || m.meeting_type}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        statusClass(m.status)
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  {m.agenda && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{m.agenda}</p>
                  )}
                  {m.notes && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">
                      <span className="text-xs font-semibold uppercase text-slate-400">Notes · </span>
                      {m.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(m.id, s.value)}
                      className="rounded-lg border px-2 py-1 text-[10px] font-semibold text-slate-600"
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(m);
                      setNotes(m.notes || "");
                    }}
                    className="rounded-lg border px-2 py-1 text-[10px] font-semibold text-slate-700"
                  >
                    Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editing?.id === m.id && (
                <div className="mt-3 border-t pt-3">
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Meeting notes…"
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveNotes(m)}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      Save notes & mark completed
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
