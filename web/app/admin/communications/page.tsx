"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Log = {
  id: number;
  title: string;
  body: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

type Channels = { push: boolean; email: boolean; sms: boolean };

export default function AdminCommunicationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"push" | "email" | "sms">("push");
  const [channels, setChannels] = useState<Channels>({ push: false, email: false, sms: false });
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    apiFetch<Log[]>("/notifications/logs?limit=20")
      .then(setLogs)
      .catch(() => setLogs([]));
    apiFetch<Channels>("/notifications/channels")
      .then(setChannels)
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const res = await apiFetch<{
        sent: number;
        failed: number;
        errors?: string[];
        configured?: boolean;
        channel?: string;
      }>("/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          target: "all",
          channel,
          data: { screen: "home" },
        }),
      });
      if (!res.configured) {
        setError(
          channel === "email"
            ? "Set RESEND_API_KEY + EMAIL_FROM on Render."
            : channel === "sms"
              ? "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER on Render."
              : "Set VAPID keys on Render for web push."
        );
      }
      setInfo(`${(res.channel || channel).toUpperCase()}: ${res.sent} sent, ${res.failed} failed.`);
      if (res.errors?.length) setError(res.errors[0]);
      setTitle("");
      setBody("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Push · Email (Resend) · SMS (Twilio). Status:{" "}
          <span className={channels.push ? "text-emerald-700" : "text-amber-700"}>
            push {channels.push ? "on" : "off"}
          </span>
          {" · "}
          <span className={channels.email ? "text-emerald-700" : "text-amber-700"}>
            email {channels.email ? "on" : "off"}
          </span>
          {" · "}
          <span className={channels.sms ? "text-emerald-700" : "text-amber-700"}>
            sms {channels.sms ? "on" : "off"}
          </span>
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>}

      <form onSubmit={send} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(["push", "email", "sms"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                channel === c ? "bg-blue-600 text-white" : "border bg-white text-slate-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          required
          placeholder="Subject / title"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          required
          placeholder="Message body"
          className="min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Sending…" : `Send ${channel}`}
        </button>
      </form>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent sends</h2>
        <ul className="mt-3 divide-y">
          {logs.map((l) => (
            <li key={l.id} className="py-2 text-sm">
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(l.created_at).toLocaleString()} · sent {l.sent_count} · failed{" "}
                {l.failed_count}
              </p>
            </li>
          ))}
          {logs.length === 0 && <li className="py-4 text-sm text-slate-500">No sends yet.</li>}
        </ul>
      </div>
    </div>
  );
}
