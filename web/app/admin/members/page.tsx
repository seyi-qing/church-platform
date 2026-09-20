"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone?: string;
};

export default function AdminMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      // 💡 Enhanced payload matching backend schema values
      await apiFetch("/members/users", {
        method: "POST",
        body: JSON.stringify({ 
          email, 
          full_name: fullName, 
          password, 
          role, 
          phone: phone || undefined 
        }),
      });
      setEmail("");
      setFullName("");
      setPassword("");
      setPhone("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Members & Staff Registry</h1>
        <p className="text-sm text-slate-500">Manage church members and provision user accounts for pastors, leaders, or secretaries.</p>
      </div>

      {error && <p className="text-sm font-semibold rounded-lg bg-red-50 px-3 py-2 text-red-600">{error}</p>}
      
      {/* 🛠️ Dynamic Forms Header Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded border px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded border px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
        <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded border px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
        
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded border px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-500">
          <option value="member">Member</option>
          <option value="leader">Leader</option>
          <option value="secretary">Secretary</option> 
          <option value="pastor">Pastor</option>
          <option value="admin">Admin</option>
        </select>
        
        <button type="button" onClick={create} disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white font-medium hover:bg-brand-700 transition disabled:opacity-50">
          {loading ? "Creating..." : "New User"}
        </button>
      </div>

      {/* 📋 Live Dynamic Listing Workspace */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Accounts ({users.length})</span>
        </div>
        <ul className="divide-y">
          {users.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">No registered system members found.</li>
          ) : (
            users.map((u) => (
              <li key={u.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{u.full_name || "Unnamed User"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {u.email} {u.phone && `· ${u.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    u.role === "admin" || u.role === "pastor" ? "bg-purple-100 text-purple-800" :
                    u.role === "secretary" || u.role === "leader" ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {u.role}
                  </span>
                  <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                    u.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
  }
