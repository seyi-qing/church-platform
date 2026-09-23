"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "visit", label: "Planning a visit" },
  { value: "prayer", label: "Prayer request" },
  { value: "give", label: "Giving / donations" },
  { value: "other", label: "Other" },
];

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 2 || !email.trim() || message.trim().length < 5) {
      setError("Please fill in your name, email, and a short message.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/inquiries", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          topic,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      setDone(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setTopic("general");
    } catch (err: any) {
      setError(err.message || "Could not send. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Contact us</h1>
      <p className="mt-2 text-sm text-slate-600">
        Send a message to the church office. Staff will see it in the admin inbox and follow up.
      </p>

      {done && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          Thank you — we received your message and will get back to you soon.
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border bg-white p-5 shadow-sm">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Phone (optional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Subject (optional)</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500">Message</label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/" className="font-medium text-brand-700 hover:underline">
          ← Back to home
        </Link>
      </p>
    </main>
  );
}
