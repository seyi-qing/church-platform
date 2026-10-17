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

      // Pure platform-only accounts → platform portal
      if (user?.is_superuser && !isStaffRole(user?.role)) {
        setAuth(data.access_token, data.refresh_token, user);
        router.replace("/platform");
        return;
      }

      if (!isStaffRole(user?.role) && !user?.is_superuser) {
        setError("This portal is for church staff. Members use member login.");
        return;
      }

      setAuth(data.access_token, data.refresh_token, user);
      router.replace("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Grace Church
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Church staff sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pastors, admins, leaders, secretaries, treasurers — church operations dashboard.
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
            {busy ? "Signing in…" : "Sign in to church admin"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Platform super-admin?{" "}
          <Link href="/platform/login" className="font-semibold text-violet-700 underline">
            Platform sign in
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">
          Members:{" "}
          <Link href="/login" className="underline">
            member login
          </Link>
        </p>
      </div>
    </div>
  );
}
