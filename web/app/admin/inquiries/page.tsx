"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Inquiry = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  topic: string;
  subject: string;
  message: string;
  status: string;
  staff_notes?: string | null;
  follow_up_created?: boolean;
  care_request_id?: number | null;
  created_at?: string | null;
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "spam", label: "Spam" },
];

function statusClass(s: string) {
  if (s === "new") return "border-blue-200 bg-blue-50 text-blue-800";
  if (s === "in_progress") return "border-amber-200 bg-amber-50 text-amber-900";
  if (s === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

export default function AdminInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setError("");
      const q = filter ? `?status_filter=${filter}` : "";
      setItems(await apiFetch<Inquiry[]>(`/inquiries${q}`));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  function open(item: Inquiry) {
    setSelected(item);
    setNotes(item.staff_notes || "");
    setInfo("");
  }

  async function setStatus(id: number, status: string) {
    setLoading(true);
    setError("");
    try {
      const updated = await apiFetch<Inquiry>(`/inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, staff_notes: notes }),
      });
      setInfo("Updated.");
      setSelected(updated);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setLoading(true);
    try {
      const updated = await apiFetch<Inquiry>(`/inquiries/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ staff_notes: notes }),
      });
      setSelected(updated);
      setInfo("Notes saved.");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function visitorFollowUp() {
    if (!selected) return;
    if (!confirm("Create a visitor profile and care follow-up from this inquiry?")) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ inquiry: Inquiry }>(
        `/inquiries/${selected.id}/visitor-follow-up`,
        { method: "POST" }
      );
      setSelected(res.inquiry);
      setInfo("Visitor follow-up created. Check Visitors / Care.");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this inquiry permanently?")) return;
    try {
      await apiFetch(`/inquiries/${id}`, { method: "DELETE" });
      if (selected?.id === id) setSelected(null);
      setInfo("Deleted.");
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const newCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inquiries</h1>
        <p className="text-sm text-slate-500">
          Messages from the public Contact form. {newCount > 0 && (
            <span className="font-semibold text-blue-700">{newCount} new</span>
          )}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}
      {info && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {info}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !filter ? "bg-slate-900 text-white" : "border bg-white text-slate-700"
          }`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(s.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === s.value ? "bg-slate-900 text-white" : "border bg-white text-slate-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-semibold text-slate-900">{selected.full_name}</p>
              <p className="text-sm text-slate-500">
                <a href={`mailto:${selected.email}`} className="text-brand-700 hover:underline">
                  {selected.email}
                </a>
                {selected.phone ? ` · ${selected.phone}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className={`rounded border px-2 py-0.5 font-bold uppercase ${statusClass(selected.status)}`}>
              {selected.status.replace("_", " ")}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold capitalize text-slate-700">
              {selected.topic}
            </span>
            {selected.created_at && (
              <span className="text-slate-500">
                {new Date(selected.created_at).toLocaleString()}
              </span>
            )}
          </div>
          {selected.subject && (
            <p className="mb-2 text-sm font-semibold text-slate-800">{selected.subject}</p>
          )}
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
            {selected.message}
          </p>

          <label className="mt-4 block text-xs font-semibold uppercase text-slate-500">
            Staff notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={saveNotes}
              className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Save notes
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                disabled={loading}
                onClick={() => setStatus(selected.id, s.value)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Mark {s.label}
              </button>
            ))}
            {!selected.follow_up_created && (
              <button
                type="button"
                disabled={loading}
                onClick={visitorFollowUp}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Create visitor follow-up
              </button>
            )}
            {selected.follow_up_created && (
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                Follow-up created
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(selected.id)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <ul className="divide-y">
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-slate-500">
              No inquiries yet. Public form is at /contact.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(item)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${
                    selected?.id === item.id ? "bg-blue-50/60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.full_name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {item.subject || item.message.slice(0, 80)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {item.topic}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        statusClass(item.status)
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
