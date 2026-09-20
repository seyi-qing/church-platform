"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Event = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    fetch(`${API_URL}/events?limit=20`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e.name === "AbortError"
              ? "Server is waking up — pull to refresh in a moment."
              : e.message || "Could not load events"
          );
        }
      })
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="mt-2 text-slate-600">Upcoming gatherings and opportunities.</p>
      </div>

      {loading && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          Loading events… (first load may take up to a minute)
        </p>
      )}

      {!loading && error && events.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
          {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">
          No upcoming events listed right now.
        </p>
      )}

      {events.length > 0 && (
        <ul className="space-y-4">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{e.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(e.start_at).toLocaleString()}
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.description && <p className="mt-3 text-slate-600">{e.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
