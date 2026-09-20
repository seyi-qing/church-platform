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
        
        // Populate profile fallback options
        if (u.member_profile) {
          setAddress(u.member_profile.address || "");
          setNotes(u.member_profile.notes || "");
        }
      } catch (err) {
        console.error(err);
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
      // Safely saves non-sensitive member metrics
      await apiFetch("/members/profiles", {
        method: "POST",
        body: JSON.stringify({ address, notes })
      });
      alert("🎉 Profile information synchronized successfully!");
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-sm font-medium text-slate-500">Syncing member profile...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Short Side Profile Card */}
      <div className="md:col-span-1 rounded-xl border bg-white p-6 shadow-sm text-center space-y-4 h-fit">
        <div className="h-20 w-20 rounded-full bg-brand-100 text-brand-700 mx-auto flex items-center justify-center text-2xl font-bold uppercase">
          {user?.full_name?.substring(0, 2) || "ME"}
        </div>
        <div>
          <h2 className="font-bold text-slate-900 text-lg">{user?.full_name}</h2>
          <p className="text-xs uppercase text-brand-600 font-bold tracking-wider">{user?.role}</p>
        </div>
        <div className="border-t pt-4 text-left text-xs space-y-2 text-slate-600">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone:</strong> {user?.phone || "Not provided"}</p>
          <p><strong>Status:</strong> {user?.member_profile?.membership_status || "Active"}</p>
        </div>
        <button type="button" onClick={() => { logout(); localStorage.clear(); router.push("/admin/login"); }} className="w-full mt-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition">
          Sign out
        </button>
      </div>

      {/* Profile Modification Details Form Area */}
      <div className="md:col-span-2 rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personal Information Management</h2>
          <p className="text-xs text-slate-500">Keep your church registry data, addresses, and connect notes updated.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">Home Address Location</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none" placeholder="123 Church Street, Kampala" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">Pastoral Notes / Prayer Needs</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none" placeholder="Share notes, updates, or specific prayer items with the pastoral care team..." />
          </div>

          <button type="submit" disabled={saving} className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition disabled:opacity-50">
            {saving ? "Synchronizing Changes..." : "Commit Profile Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
