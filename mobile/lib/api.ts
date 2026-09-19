import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("access_token");
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync("refresh_token");
}

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync("access_token", access);
  await SecureStore.setItemAsync("refresh_token", refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync("access_token");
  await SecureStore.deleteItemAsync("refresh_token");
  await SecureStore.deleteItemAsync("user");
}

export async function setUser(user: object) {
  await SecureStore.setItemAsync("user", JSON.stringify(user));
}

export async function getUser<T = any>(): Promise<T | null> {
  const raw = await SecureStore.getItemAsync("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refresh = await getRefreshToken();
    if (refresh) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          await setTokens(data.access_token, data.refresh_token);
          headers["Authorization"] = `Bearer ${data.access_token}`;
          res = await fetch(`${API_URL}${path}`, { ...options, headers });
        } else {
          await clearTokens();
        }
      } catch {
        await clearTokens();
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || res.statusText);
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const data = await apiFetch<{ access_token: string; refresh_token: string }>(
    "/auth/login/json",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
  await setTokens(data.access_token, data.refresh_token);
  try {
    const user = await apiFetch<any>("/auth/me");
    await setUser(user);
  } catch {}
  return data;
}

export async function logout() {
  await clearTokens();
}
