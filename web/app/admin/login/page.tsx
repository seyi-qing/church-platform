"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

function setAuth(access: string, refresh: string, user: object | null = null) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Fetch token pairs
      const tokens = await apiFetch<{ access_token: string; refresh_token: string }>(
        "/auth/login/json",
        { method: "POST", body: JSON.stringify({ email, password }) }
      );

      // 💡 FIXED: Save access keys into storage FIRST so apiFetch("/auth/me") reads them
      setAuth(tokens.access_token, tokens.refresh_token);

      // 2. Safely call backend profile endpoint with the token populated in storage
      const user = await apiFetch<any>("/auth/me");
      if (!["admin", "pastor", "leader"].includes(user.role) && !user.is_superuser) {
        setError("You do not have staff access.");
        // Clean out unauthorized storage items
        localStorage.clear();
        setLoading(false);
        return;
      }

      // 3. Update storage to record the profile payload
      localStorage.setItem("user", JSON.stringify(user));
      
      // 4. Redirect safely to dashboard panels
      router.replace("/admin");
    } catch (err: any) {
      // Clean out any partial tokens on failure
      localStorage.clear();
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-xl border bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Login</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the admin dashboard</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="pastor@grace.church" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
            }
