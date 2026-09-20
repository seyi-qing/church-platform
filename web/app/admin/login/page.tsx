"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setAuth, isStaffRole } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await apiFetch<{
        access_token: string;
        refresh_token: string;
        user?: any;
      }>("/auth/login/json", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      let user = data.user;
      if (!user) {
        user = await apiFetch("/auth/me", {}, data.access_token);
      }
      setAuth(data.access_token, data.refresh_token, user);

      if (isStaffRole(user?.role) || user?.is_superuser) {
        router.replace("/admin");
      } else {
        router.replace("/profile");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <h1 className="text-xl font-bold text-slate-900">Staff sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          For pastors, admins, and leaders. Members use{" "}
          <Link href="/login" className="text-blue-600 underline">
            member login
          </Link>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Password</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in to dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
