"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearAuth, getStoredUser, isLoggedIn, isStaffRole } from "@/lib/auth";

type Donation = {
  id: number;
  amount_cents: number;
  fund: string;
  status: string;
  created_at: string;
};

type MemberProfile = {
  id: number;
  user_id: number;
  address: string | null;
  notes: string | null;
  membership_status: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [gifts, setGifts] = useState<Donation[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [giftError, setGiftError] = useState("");
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setUser(getStoredUser());

    apiFetch<Donation[]>("/giving/mine")
      .then(setGifts)
      .catch((e) => setGiftError(e.message || "Could not load giving history"))
      .finally(() => setLoadingGifts(false));

    apiFetch<MemberProfile>("/members/me/profile")
      .then((p) => {
        setProfile(p);
        setAddress(p.address || "");
        setNotes(p.notes || "");
      })
      .catch(() => {});
  }, [router]);

  async function savePersonal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    setSaveErr("");
    try {
      const updated = await apiFetch<MemberProfile>("/members/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ address: address || null, notes: notes || null }),
      });
      setProfile(updated);
      setSaveMsg("Saved");
    } catch (err: any) {
      setSaveErr(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <p className="text-slate-500">Loading…</p>;

  const initials = (user.full_name || user.email || "ME").substring(0, 2).toUpperCase();
  const statusLabel = profile?.membership_status || (user.is_active !== false ? "active" : "inactive");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {initials}
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900">{user.full_name}</h1>
          <span className="mt-1 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold uppercase text-slate-600">
            Member portal
          </span>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-left text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Email address</dt>
            <dd className="mt-0.5 break-all font-medium text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Registry status</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-medium">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  statusLabel === "active" ? "bg-green-500" : "bg-slate-400"
                }`}
              />
              <span className={statusLabel === "active" ? "text-green-700" : "text-slate-600"}>
                {statusLabel === "active" ? "Active" : statusLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Role</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-800">{user.role}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/give" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Give
          </Link>
          {(isStaffRole(user.role) || user.is_superuser) && (
            <Link href="/admin" className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Staff dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              clearAuth();
              router.push("/");
            }}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your address and notes for pastoral care.
        </p>
        <form onSubmit={savePersonal} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Home address location</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="E.g. 123 Church Street, Kampala"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Prayer requests / connection notes</span>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-lg border px-3 py-2"
              placeholder="Optional notes for your pastors or care team"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {saveMsg && <p className="text-sm text-green-700">{saveMsg}</p>}
          {saveErr && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{saveErr}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save information"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">My giving</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gifts linked to this account. Sign in before giving so history is saved.
        </p>
        {loadingGifts && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
        {giftError && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {String(giftError).toLowerCase().includes("not found")
              ? "Giving history API is updating. Wait for the API redeploy, then refresh."
              : giftError}
          </p>
        )}
        {!loadingGifts && !giftError && gifts.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            No gifts yet.{" "}
            <Link href="/give" className="text-blue-600 underline">
              Make a gift
            </Link>
          </p>
        )}
        {gifts.length > 0 && (
          <ul className="mt-4 divide-y">
            {gifts.map((g) => (
              <li key={g.id} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    ${(g.amount_cents / 100).toFixed(2)} · {g.fund}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(g.created_at).toLocaleDateString()} · {g.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
