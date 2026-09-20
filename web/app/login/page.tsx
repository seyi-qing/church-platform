"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setAuth, isStaffRole } from "@/lib/auth";

type Mode = "login" | "register";

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
        router.replace("/profile");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
          For church members. Staff use{" "}
          <Link href="/admin/login" className="text-blue-600 underline">
            staff login
          </Link>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Full name</span>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
          )}
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
              minLength={8}
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
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button type="button" className="font-semibold text-blue-600" onClick={() => setMode("register")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="font-semibold text-blue-600" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
