"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
};

export default function AdminMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  async function load() {
    try {
      setUsers(await apiFetch<User[]>("/members/users"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError("");
    try {
      await apiFetch("/members/users", {
        method: "POST",
        body: JSON.stringify({ email, full_name: fullName, password, role }),
      });
      setEmail("");
      setFullName("");
      setPassword("");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Members</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4">
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="member">member</option>
          <option value="leader">leader</option>
          <option value="admin">admin</option>
          <option value="pastor">pastor</option>
        </select>
        <button type="button" onClick={create} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">New user</button>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
        {users.map((u) => (
          <li key={u.id} className="px-4 py-3">
            <p className="font-medium">{u.full_name || u.email}</p>
            <p className="text-xs text-slate-500">{u.email} · {u.role} · {u.is_active ? "active" : "inactive"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
