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

export default function AdminCommunicationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"push" | "email" | "sms">("push");
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);

  function loadLogs() {
    apiFetch<Log[]>("/notifications/logs?limit=20")
      .then(setLogs)
      .catch(() => setLogs([]));
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setInfo("");
    try {
      if (channel === "push") {
        const res = await apiFetch<{ sent: number; failed: number; errors?: string[] }>(
          "/notifications/send",
          {
            method: "POST",
            body: JSON.stringify({
              title,
              body,
              target: "all",
              data: { screen: "home" },
            }),
          }
        );
        setInfo(`Push: ${res.sent} sent, ${res.failed} failed.`);
        if (res.errors?.length) setError(res.errors[0]);
      } else {
        // Email/SMS: log as notification for audit; real providers need API keys later
        await apiFetch("/notifications/send", {
          method: "POST",
          body: JSON.stringify({
            title: `[${channel.toUpperCase()}] ${title}`,
            body: `${body}\n\n(Channel ${channel} queued — configure provider keys for delivery.)`,
            target: "all",
            data: { channel },
          }),
        });
        setInfo(
          `${channel.toUpperCase()} message recorded. Connect a provider (Resend/Twilio) for real delivery.`
        );
      }
      setTitle("");
      setBody("");
      loadLogs();
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
          Reach the congregation via push now. Email/SMS need provider keys (logged for workflow).
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
