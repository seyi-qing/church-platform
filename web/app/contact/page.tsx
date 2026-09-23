"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getAccessToken, getStoredUser } from "@/lib/auth";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "visit", label: "Planning a visit" },
  { value: "prayer", label: "Prayer request" },
  { value: "give", label: "Giving / donations" },
  { value: "other", label: "Other" },
];

type Me = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
};

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
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    // Guests: leave empty. Logged-in: fill from local session, then refresh from API.
    const stored = getStoredUser<Me>();
    const token = getAccessToken();
    if (!token && !stored) {
      setIsMember(false);
      return;
    }

    if (stored) {
      setIsMember(true);
      if (stored.full_name) setFullName(stored.full_name);
      if (stored.email) setEmail(stored.email);
      if (stored.phone) setPhone(stored.phone);
    }

    if (!token) return;

    apiFetch<Me>("/auth/me")
      .then((me) => {
        setIsMember(true);
        if (me.full_name) setFullName(me.full_name);
        if (me.email) setEmail(me.email);
        if (me.phone) setPhone(me.phone || "");
      })
      .catch(() => {
        /* guest or expired token — keep empty / stored */
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);
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
      setSubject("");
      setMessage("");
      setTopic("general");
      // Keep identity fields filled for signed-in users; clear for guests
      if (!isMember) {
        setFullName("");
        setEmail("");
        setPhone("");
      }
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
        {isMember && (
          <span className="block mt-1 text-slate-500">
            Your account details are filled in — you can edit them before sending.
          </span>
        )}
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
