"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getAccessToken, getStoredUser, isLoggedIn } from "@/lib/auth";

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
  const [rsvpId, setRsvpId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const u = getStoredUser<{ full_name?: string; email?: string }>();
    if (u?.full_name) setName(u.full_name);
    if (u?.email) setEmail(u.email);

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

  async function submitRsvp(eventId: number) {
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/events/${eventId}/rsvp`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: name.trim() || "Guest",
          email: email.trim() || "guest@example.com",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `RSVP failed (${res.status})`);
      setMsg(data.message || "You're registered!");
      setRsvpId(null);
    } catch (e: any) {
      setError(typeof e.message === "string" ? e.message : "RSVP failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="mt-2 text-slate-600">Upcoming gatherings — RSVP in one tap.</p>
      </div>

      {msg && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {msg}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      {loading && (
        <p className="rounded-lg border bg-white p-8 text-center text-slate-500">Loading events…</p>
      )}

      {!loading && events.length === 0 && !error && (
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

              {rsvpId === e.id ? (
                <div className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  {!isLoggedIn() && (
                    <>
                      <input
                        required
                        placeholder="Your name"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={name}
                        onChange={(ev) => setName(ev.target.value)}
                      />
                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                      />
                    </>
                  )}
                  {isLoggedIn() && (
                    <p className="text-sm text-slate-600">
                      RSVP as <strong>{name || "you"}</strong>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || (!isLoggedIn() && (!name.trim() || !email.trim()))}
                      onClick={() => submitRsvp(e.id)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy ? "Saving…" : "Confirm I'm coming"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpId(null)}
                      className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRsvpId(e.id);
                    setMsg("");
                    setError("");
                  }}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  I'm coming
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
