"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Event = {
  id: number;
  title: string;
  location: string | null;
  start_at: string;
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");

  async function load() {
    try {
      setEvents(await apiFetch<Event[]>("/events?public_only=false"));
    } catch {
      setEvents([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title || !startAt) return;
    await apiFetch("/events", {
      method: "POST",
      body: JSON.stringify({
        title,
        location,
        start_at: new Date(startAt).toISOString(),
        is_public: true,
      }),
    });
    setTitle("");
    setLocation("");
    setStartAt("");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Events</h1>
      <div className="flex flex-wrap gap-2">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <button type="button" onClick={create} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">New event</button>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
        {events.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <p className="font-medium">{e.title}</p>
            <p className="text-xs text-slate-500">{new Date(e.start_at).toLocaleString()}{e.location ? ` · ${e.location}` : ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
