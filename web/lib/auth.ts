"use client";

const ACCESS_KEY = "cp_access_token";
const REFRESH_KEY = "cp_refresh_token";
const USER_KEY = "cp_user";
const LEGACY_TOKEN = "token";
const LEGACY_USER = "user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(LEGACY_TOKEN);
}

export function getToken(): string | null {
  return getAccessToken();
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuth(access: string, refresh: string, user?: object) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(LEGACY_TOKEN, access);
  if (user) {
    const raw = JSON.stringify(user);
    localStorage.setItem(USER_KEY, raw);
    localStorage.setItem(LEGACY_USER, raw);
  }
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN);
  localStorage.removeItem(LEGACY_USER);
}

export function logout() {
  clearAuth();
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export function isStaffRole(role?: string | null): boolean {
  return !!role && ["admin", "pastor", "leader", "secretary"].includes(role);
}
