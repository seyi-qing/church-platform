"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Group = {
  id: number;
  name: string;
  description?: string | null;
  group_type: string;
  meeting_day?: string | null;
  meeting_time?: string | null;
  location?: string | null;
  is_public?: boolean;
};

const CATEGORIES = [
  { value: "small_group", label: "Small group" },
  { value: "team", label: "Ministry team" },
  { value: "class", label: "Class" },
  { value: "other", label: "Other" },
];

export default function AdminGroupsPage() {
  const [items, setItems] = useState<Group[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("small_group");
  const [location, setLocation] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setError("");
      setItems(await apiFetch<Group[]>("/members/groups"));
    } catch (e: any) {
      setError(e.message || "Could not load groups");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setLoading(true);
    try {
      await apiFetch("/members/groups", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          group_type: groupType,
          location: location.trim() || null,
          meeting_day: meetingDay.trim() || null,
          meeting_time: meetingTime.trim() || null,
          description: description.trim() || null,
          is_public: true,
        }),
      });
      setName("");
      setLocation("");
      setMeetingDay("");
      setMeetingTime("");
      setDescription("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Groups</h1>
        <p className="mt-1 text-sm text-slate-500">
          Small groups, ministry teams, and classes — the people side of community.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}

      <form onSubmit={create} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800">Add group</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Name (e.g. Young Adults)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Meeting day (e.g. Wednesday)"
            value={meetingDay}
            onChange={(e) => setMeetingDay(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Meeting time (e.g. 7:00 PM)"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder="Description (optional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Create group"}
        </button>
      </form>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No groups yet. Create a small group or ministry team above.
          </li>
        ) : (
          items.map((g) => (
            <li key={g.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">{g.name}</p>
              <p className="text-xs text-slate-500">
                {CATEGORIES.find((c) => c.value === g.group_type)?.label || g.group_type}
                {g.is_public !== false && (
                  <span className="ml-2 font-semibold text-emerald-700">· Public</span>
                )}
              </p>
              {(g.meeting_day || g.meeting_time || g.location) && (
                <p className="mt-1 text-sm text-slate-600">
                  {[g.meeting_day, g.meeting_time, g.location].filter(Boolean).join(" · ")}
                </p>
              )}
              {g.description && <p className="mt-2 text-sm text-slate-600">{g.description}</p>}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
