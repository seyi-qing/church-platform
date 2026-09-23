"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { clearAuth, getStoredUser, isLoggedIn, isStaffRole, setAuth, getAccessToken, getRefreshToken } from "@/lib/auth";

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

function money(cents: number | null | undefined) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${(n / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const styles: Record<string, string> = {
    succeeded: "bg-emerald-50 text-emerald-700",
    paid: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-800",
    failed: "bg-red-50 text-red-700",
    refunded: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
        styles[s] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [gifts, setGifts] = useState<Donation[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [giftError, setGiftError] = useState("");
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [fullName, setFullName] = useState("");
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
    const u = getStoredUser();
    setUser(u);
    setFullName(u?.full_name || "");

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
      if (fullName.trim() && fullName.trim() !== user?.full_name) {
        const updatedUser = await apiFetch<any>("/members/me/account", {
          method: "PATCH",
          body: JSON.stringify({ full_name: fullName.trim() }),
        });
        const access = getAccessToken();
        const refresh = getRefreshToken();
        if (access && refresh) {
          setAuth(access, refresh, { ...user, ...updatedUser });
        }
        setUser((prev: any) => ({ ...prev, ...updatedUser }));
      }
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
  const staff = isStaffRole(user.role) || user.is_superuser;
  const portalLabel = staff ? "Staff account" : "Member portal";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 lg:max-w-4xl">
      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
            {initials}
          </div>
          <div className="mt-3 min-w-0 flex-1 sm:mt-0">
            <h1 className="text-xl font-bold text-slate-900">{user.full_name}</h1>
            <span
              className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase ${
                staff ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {portalLabel}
            </span>
            <dl className="mt-4 grid gap-4 border-t pt-4 text-left text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-400">Email address</dt>
                <dd className="mt-0.5 break-all font-medium text-slate-800">{user.email}</dd>
                <p className="mt-0.5 text-[10px] text-slate-400">Email cannot be changed here</p>
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
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/give"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Give
          </Link>
          {staff && (
            <Link
              href="/admin"
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
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

      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your display name and address. Email and password are not changed here.
        </p>
        <form onSubmit={savePersonal} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Full name</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Home address</span>
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

      <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">My giving</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gifts recorded while signed in on this account.
        </p>
        {loadingGifts && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
        {giftError && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{giftError}</p>
        )}
        {!loadingGifts && !giftError && gifts.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">
            No gifts on this account yet.{" "}
            <Link href="/give" className="font-semibold text-blue-600 underline">
              Make a gift
            </Link>
          </p>
        )}
        {gifts.length > 0 && (
          <ul className="mt-4 divide-y">
            {gifts.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {money(g.amount_cents)} · {g.fund}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(g.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={g.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
