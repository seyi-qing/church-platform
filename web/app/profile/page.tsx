"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { logout } from "@/lib/auth";

export default function MemberDashboardPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await apiFetch("/auth/me");
        setUser(u);
        if (u.member_profile) {
          setAddress(u.member_profile.address || "");
          setNotes(u.member_profile.notes || "");
        }
      } catch (err) {
        logout();
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/members/profiles", {
        method: "POST",
        body: JSON.stringify({ address, notes })
      });
      alert("🎉 Changes saved successfully!");
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-sm font-medium text-slate-500">Loading your secure profile...</div>;

  return (
    <div className="max-w-xl mx-auto py-6 px-4 space-y-6">
      {/* Dynamic Profile Summary Heading Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-500 to-brand-600" />
        
        <div className="h-20 w-20 rounded-full bg-brand-100 text-brand-700 mx-auto flex items-center justify-center text-2xl font-black uppercase tracking-tight shadow-inner">
          {user?.full_name?.substring(0, 2) || "ME"}
        </div>
        
        <div className="mt-3">
          <h2 className="font-extrabold text-slate-900 text-xl tracking-tight">{user?.full_name}</h2>
          <span className="mt-1 inline-block text-[10px] uppercase font-bold tracking-widest text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
            {user?.role} Portal
          </span>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 text-left gap-4 text-xs text-slate-600">
          <div>
            <span className="font-bold block text-slate-400 text-[10px] uppercase tracking-wider">Email Address</span>
            <span className="truncate block mt-0.5 font-medium">{user?.email}</span>
          </div>
          <div>
            <span className="font-bold block text-slate-400 text-[10px] uppercase tracking-wider">Registry Status</span>
            <span className="block mt-0.5 font-medium text-emerald-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {user?.member_profile?.membership_status || "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Metric Forms Canvas Panel */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Personal Information Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">Modify your localized address data and pastoral communication logs securely.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Home Address Location</label>
            <input 
              type="text"
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none transition bg-slate-50 focus:bg-white" 
              placeholder="E.g. 123 Church Street, Kampala" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">Prayer Requests / Connection Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={4} 
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none transition bg-slate-50 focus:bg-white" 
              placeholder="Share updates, needs, or communication logs directly with the care team..." 
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving changes..." : "Commit Data Updates"}
            </button>
            
            <button 
              type="button" 
              onClick={() => { logout(); localStorage.clear(); router.push("/admin/login"); }} 
              className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
            >
              Sign Out Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
