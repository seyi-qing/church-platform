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

/** Compact contact form for site footer area — guests empty, members prefilled. */
export function ContactSection({ compact = false }: { compact?: boolean }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
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
      .catch(() => {});
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
          subject: "",
          message: message.trim(),
        }),
      });
      setDone(true);
      setMessage("");
      setTopic("general");
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
    <section
      className={`rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm sm:p-6 ${
        compact ? "" : ""
      }`}
      aria-labelledby="contact-section-heading"
    >
      <h2 id="contact-section-heading" className="text-center text-xl font-bold text-slate-900">
        Get in touch
      </h2>
      <p className="mx-auto mt-1 max-w-md text-center text-sm text-slate-600">
        Questions, prayer requests, or planning a visit? Send a message — our team will follow up.
      </p>

      {done && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-900">
          Thank you — we received your message.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mx-auto mt-4 max-w-lg space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoComplete="name"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoComplete="email"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
            autoComplete="tel"
          />
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          required
          rows={3}
          placeholder="Your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-slate-400">
        Prefer a full page?{" "}
        <Link href="/contact" className="font-medium text-brand-700 hover:underline">
          Open Contact
        </Link>
      </p>
    </section>
  );
}
