"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setAuth, isStaffRole } from "@/lib/auth";

type Mode = "login" | "register";

function friendlyAuthError(msg: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("abort")) {
    return "Cannot reach the server. The API may be waking up (free hosting) — wait 30–60 seconds and try again.";
  }
  if (m.includes("incorrect") || m.includes("password")) {
    return "Incorrect email or password.";
  }
  return msg || "Something went wrong";
}

export default function MemberLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            full_name: fullName || email.split("@")[0],
          }),
        });
      }

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
        router.replace("/dashboard");
      }
    } catch (err: any) {
      setError(friendlyAuthError(err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {mode === "login" ? "Member sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Access your dashboard, giving history, and church updates."
            : "Join the Grace Church member community."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" className="font-semibold text-brand-700" onClick={() => setMode("register")}>
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="font-semibold text-brand-700" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">
          Staff?{" "}
          <Link href="/admin/login" className="text-blue-600 underline">
            Admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
