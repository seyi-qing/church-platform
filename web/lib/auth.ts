"use client";

import { apiFetch } from "./api";

export type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_superuser: boolean;
};

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; refresh_token: string }>(
    "/auth/login/json",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;
}
