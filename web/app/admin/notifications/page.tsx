"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function send() {
    setError("");
    setResult("");
    try {
      const data = await apiFetch<any>("/notifications/send", {
        method: "POST",
        body: JSON.stringify({ title, body, target }),
      });
      setResult(`Sent ${data.sent}, failed ${data.failed}`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Push Notifications</h1>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded border px-3 py-2" />
      <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded border px-3 py-2" />
      <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full rounded border px-3 py-2">
        <option value="all">Everyone</option>
        <option value="role">By role (set target_value via API)</option>
      </select>
      <button type="button" onClick={send} className="rounded-lg bg-brand-600 px-4 py-2 text-white">Send</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && <p className="text-sm text-green-700">{result}</p>}
    </div>
  );
}
