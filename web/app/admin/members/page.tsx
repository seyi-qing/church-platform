"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  phone?: string | null;
  is_superuser?: boolean;
};

type UserDetail = {
  user: User & {
    is_superuser?: boolean;
    is_system_protected?: boolean;
    created_at?: string | null;
  };
  profile: {
    id: number;
    membership_status: string;
    address: string | null;
    notes: string | null;
    birthdate: string | null;
    baptism_date: string | null;
    photo_url: string | null;
    family_id: number | null;
  } | null;
  recent_attendance: {
    id: number;
    checked_in_at: string | null;
    notes: string | null;
    event_id: number | null;
  }[];
};

const SYSTEM_ADMIN_EMAIL = "admin@churchplatform.com";

const ROLES = [
  { value: "member", label: "Member" },
  { value: "leader", label: "Leader" },
  { value: "secretary", label: "Secretary" },
  { value: "treasurer", label: "Treasurer" },
  { value: "pastor", label: "Pastor" },
  { value: "admin", label: "Admin" },
] as const;

function isProtectedUser(u: {
  email?: string;
  is_superuser?: boolean;
  is_system_protected?: boolean;
}) {
  if (u.is_system_protected || u.is_superuser) return true;
  return (u.email || "").toLowerCase().trim() === SYSTEM_ADMIN_EMAIL;
}

function canDangerouslyModify(
  u: {
    id?: number;
    email?: string;
    is_superuser?: boolean;
    is_system_protected?: boolean;
  },
  me: { id?: number; email?: string } | null
) {
  if (isProtectedUser(u)) return false;
  if (me?.id != null && u.id != null && me.id === u.id) return false;
  if (me?.email && u.email && me.email.toLowerCase() === u.email.toLowerCase()) return false;
  return true;
}

function roleBadgeClass(role: string) {
  if (role === "admin" || role === "pastor") return "bg-purple-100 text-purple-800";
  if (role === "treasurer") return "bg-amber-100 text-amber-900";
  if (role === "secretary" || role === "leader") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

export default function AdminMembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<{ id?: number; email?: string } | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    role: "member",
    is_active: true,
    password: "",
  });
  const [editProtected, setEditProtected] = useState(false);

  async function load() {
    try {
      setError("");
      setUsers(await apiFetch<User[]>("/members/users?limit=200"));
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    setMe(getStoredUser());
    load();
  }, []);

  async function openProfile(u: User) {
    setViewId(u.id);
    setDetail(null);
    setDetailLoading(true);
    setError("");
    try {
      const d = await apiFetch<UserDetail>(`/members/users/${u.id}`);
      setDetail(d);
    } catch (e: any) {
      setError(e.message);
      setViewId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeProfile() {
    setViewId(null);
    setDetail(null);
  }

  function openEdit(u: User) {
    setEditId(u.id);
    setEditProtected(isProtectedUser(u));
    setEditForm({
      full_name: u.full_name || "",
      phone: u.phone || "",
      role: u.role || "member",
      is_active: u.is_active,
      password: "",
    });
    setError("");
    setInfo("");
    setViewId(null);
    setDetail(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditProtected(false);
    setEditForm({ full_name: "", phone: "", role: "member", is_active: true, password: "" });
  }

  async function create() {
    setError("");
    setInfo("");
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      setError("Name, email, and password (min 8 characters) are required.");
      return;
    }
    if (email.trim().toLowerCase() === SYSTEM_ADMIN_EMAIL) {
      setError("That email is reserved for the system administrator (seed only).");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/members/users", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          password,
          role,
          phone: phone.trim() || null,
        }),
      });
      setEmail("");
      setFullName("");
      setPassword("");
      setPhone("");
      setRole("member");
      setInfo(`Created ${role} account.`);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim() || null,
      };
      if (!editProtected) {
        body.role = editForm.role;
        body.is_active = editForm.is_active;
      }
      if (editForm.password.trim().length >= 8) {
        body.password = editForm.password.trim();
      }
      await apiFetch(`/members/users/${editId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setInfo("User updated.");
      cancelEdit();
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(u: User) {
    if (!canDangerouslyModify(u, me)) {
      setError(
        isProtectedUser(u)
          ? "Cannot deactivate the system administrator."
          : "You cannot deactivate your own account while signed in."
      );
      return;
    }
    if (!confirm(`Deactivate ${u.full_name || u.email}? They will not be able to sign in.`)) return;
    setError("");
    try {
      await apiFetch(`/members/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: false }),
      });
      setInfo("User deactivated.");
      if (viewId === u.id) closeProfile();
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(u: User) {
    if (!canDangerouslyModify(u, me)) {
      setError(
        isProtectedUser(u)
          ? "Cannot delete the system administrator — change only via database seed."
          : "You cannot delete your own account while signed in."
      );
      return;
    }
    if (
      !confirm(
        `Permanently delete ${u.full_name || u.email}? This cannot be undone. Prefer Deactivate if unsure.`
      )
    )
      return;
    setError("");
    try {
      await apiFetch(`/members/users/${u.id}`, { method: "DELETE" });
      setInfo("User deleted.");
      if (editId === u.id) cancelEdit();
      if (viewId === u.id) closeProfile();
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Members & Staff Registry</h1>
        <p className="text-sm text-slate-500">
          Tap a name for profile. Promote via Edit → role. System admin is protected. You cannot
          deactivate or delete your own account.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
      )}
      {info && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {info}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <input
          placeholder="Password (min 8)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={create}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading && !editId ? "Creating…" : "New User"}
        </button>
      </div>

      {editId && (
        <form
          onSubmit={saveEdit}
          className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-900">
            Edit user #{editId}
            {editProtected && (
              <span className="ml-2 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Protected
              </span>
            )}
          </p>
          {editProtected && (
            <p className="text-xs text-slate-600">
              System administrator: role and active status cannot be changed here. Name, phone, and
              password can still be updated.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={editForm.full_name}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="rounded border px-3 py-2 text-sm"
            />
            <select
              value={editForm.role}
              disabled={editProtected}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="rounded border bg-white px-3 py-2 text-sm disabled:opacity-60"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.is_active}
                disabled={editProtected}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
              Active (can sign in)
            </label>
            <input
              placeholder="New password (optional, min 8)"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="rounded border px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <p className="text-xs text-slate-500">Email cannot be changed here.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {(viewId || detailLoading) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">Member profile</h2>
            <button
              type="button"
              onClick={closeProfile}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              aria-label="Close profile"
            >
              ✕
            </button>
          </div>
          {detailLoading && <p className="text-sm text-slate-500">Loading…</p>}
          {detail && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {(detail.user.full_name || detail.user.email || "?")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {detail.user.full_name || "Unnamed"}
                  </p>
                  <p className="text-sm text-slate-500">{detail.user.email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    roleBadgeClass(detail.user.role)
                  }`}
                >
                  {detail.user.role}
                </span>
                {isProtectedUser(detail.user) && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Protected
                  </span>
                )}
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    detail.user.is_active
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {detail.user.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase text-slate-400">Phone</dt>
                  <dd className="font-medium text-slate-800">{detail.user.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Account created</dt>
                  <dd className="font-medium text-slate-800">
                    {detail.user.created_at
                      ? new Date(detail.user.created_at).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Membership status</dt>
                  <dd className="font-medium capitalize text-slate-800">
                    {detail.profile?.membership_status || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Address</dt>
                  <dd className="font-medium text-slate-800">{detail.profile?.address || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-slate-400">Pastoral notes</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-slate-700">
                    {detail.profile?.notes || "No notes yet."}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Recent check-ins
                </p>
                {detail.recent_attendance.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500">No attendance recorded yet.</p>
                ) : (
                  <ul className="mt-2 divide-y rounded-lg border">
                    {detail.recent_attendance.map((a) => (
                      <li key={a.id} className="flex justify-between px-3 py-2 text-sm">
                        <span className="text-slate-700">
                          {a.checked_in_at
                            ? new Date(a.checked_in_at).toLocaleString()
                            : "—"}
                        </span>
                        {a.notes && <span className="text-xs text-slate-500">{a.notes}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(detail.user)}
                  className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-slate-700"
                >
                  Edit account
                </button>
                {canDangerouslyModify(detail.user, me) && detail.user.is_active && (
                  <button
                    type="button"
                    onClick={() => deactivate(detail.user)}
                    className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-semibold text-amber-800"
                  >
                    Deactivate
                  </button>
                )}
                {canDangerouslyModify(detail.user, me) && (
                  <button
                    type="button"
                    onClick={() => remove(detail.user)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
                  >
                    Delete
                  </button>
                )}
                {!canDangerouslyModify(detail.user, me) && (
                  <p className="text-xs text-slate-500">
                    {isProtectedUser(detail.user)
                      ? "Protected system account — delete/deactivate only via database seed."
                      : "You cannot deactivate or delete your own account while signed in."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Registered accounts ({users.length})
          </span>
        </div>
        <ul className="divide-y">
          {users.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No registered system members found.
            </li>
          ) : (
            users.map((u) => {
              const locked = !canDangerouslyModify(u, me);
              return (
                <li
                  key={u.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                    viewId === u.id ? "bg-blue-50/50" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => openProfile(u)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-sm font-semibold text-brand-700 underline-offset-2 hover:underline">
                      {u.full_name || "Unnamed User"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {u.email}
                      {u.phone ? ` · ${u.phone}` : ""}
                    </p>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        roleBadgeClass(u.role)
                      }`}
                    >
                      {u.role}
                    </span>
                    {isProtectedUser(u) && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        Protected
                      </span>
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        u.is_active
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="rounded border px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      Edit
                    </button>
                    {!locked && u.is_active && (
                      <button
                        type="button"
                        onClick={() => deactivate(u)}
                        className="rounded border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800"
                      >
                        Deactivate
                      </button>
                    )}
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => remove(u)}
                        className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
