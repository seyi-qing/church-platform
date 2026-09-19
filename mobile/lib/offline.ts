import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";

const CACHE_PREFIX = "cache_";
const QUEUE_KEY = "sync_queue";
const META_KEY = "cache_meta";

export type CacheKey = "sermons" | "events" | "live" | "profile";

export type SyncAction = {
  id: string;
  type: string;
  path: string;
  method: string;
  body?: object;
  createdAt: string;
};

async function setJson(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: CacheKey, data: unknown) {
  await setJson(CACHE_PREFIX + key, data);
  const meta = (await getJson<Record<string, string>>(META_KEY)) || {};
  meta[key] = new Date().toISOString();
  await setJson(META_KEY, meta);
}

export async function cacheGet<T>(key: CacheKey): Promise<T | null> {
  return getJson<T>(CACHE_PREFIX + key);
}

export async function fetchWithCache<T>(
  key: CacheKey,
  path: string
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const data = await apiFetch<T>(path);
    await cacheSet(key, data);
    return { data, fromCache: false };
  } catch {
    const cached = await cacheGet<T>(key);
    if (cached !== null) return { data: cached, fromCache: true };
    throw new Error("Offline and no cached data");
  }
}

export async function enqueueSync(action: Omit<SyncAction, "id" | "createdAt">) {
  const queue = (await getJson<SyncAction[]>(QUEUE_KEY)) || [];
  queue.push({
    ...action,
    id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  });
  await setJson(QUEUE_KEY, queue);
}

/** Alias used by screens */
export async function queueSync(method: string, path: string, body?: object) {
  return enqueueSync({ type: "mutation", path, method, body });
}

export async function getSyncQueue(): Promise<SyncAction[]> {
  return (await getJson<SyncAction[]>(QUEUE_KEY)) || [];
}

export async function flushSyncQueue(): Promise<{ ok: number; failed: number }> {
  const queue = await getSyncQueue();
  if (!queue.length) return { ok: 0, failed: 0 };
  const remaining: SyncAction[] = [];
  let ok = 0;
  let failed = 0;
  for (const action of queue) {
    try {
      await apiFetch(action.path, {
        method: action.method,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      ok += 1;
    } catch {
      remaining.push(action);
      failed += 1;
    }
  }
  await setJson(QUEUE_KEY, remaining);
  return { ok, failed };
}

export async function prefetchForOffline() {
  const paths: { key: CacheKey; path: string }[] = [
    { key: "sermons", path: "/media/items?media_type=sermon&limit=30" },
    { key: "events", path: "/events?limit=30" },
    { key: "live", path: "/livestream/sessions/live" },
  ];
  const results = await Promise.allSettled(
    paths.map(async ({ key, path }) => {
      const data = await apiFetch(path);
      await cacheSet(key, data);
    })
  );
  return results.filter((r) => r.status === "fulfilled").length;
}
