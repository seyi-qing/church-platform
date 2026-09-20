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

      // Save access keys into storage FIRST so apiFetch("/auth/me") reads them
      setAuth(tokens.access_token, tokens.refresh_token);

      // 2. Fetch the current logged-in user profile details
      const user = await apiFetch<any>("/auth/me");
      
      // Update storage to record the profile payload completely
      localStorage.setItem("user", JSON.stringify(user));
      
      // 3. 💡 FIXED DYNAMIC ROUTING: Send staff to management, and members to profile workspace
      if (["admin", "pastor", "leader", "secretary"].includes(user.role) || user.is_superuser) {
        router.replace("/admin");
      } else {
        router.replace("/profile");
      }
    } catch (err: any) {
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
          <h1 className="text-2xl font-bold text-slate-900">Account Login</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your church dashboard</p>
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
