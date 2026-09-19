"use client";

import { apiFetch, API_URL } from "./api";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (e) {
    console.warn("SW registration failed", e);
    return null;
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/notifications/vapid-public-key`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.configured ? data.publicKey : null;
  } catch {
    return null;
  }
}

export async function subscribeWebPush(): Promise<{ ok: boolean; error?: string }> {
  if (!isWebPushSupported()) {
    return { ok: false, error: "Web Push is not supported in this browser" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission denied" };
  }

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    return {
      ok: false,
      error: "Web Push is not configured on the server (missing VAPID keys)",
    };
  }

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, error: "Could not register service worker" };

  await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });
  }

  const json = subscription.toJSON();
  const token = JSON.stringify({
    endpoint: json.endpoint,
    keys: json.keys,
  });

  try {
    await apiFetch("/notifications/devices", {
      method: "POST",
      body: JSON.stringify({
        token,
        platform: "web",
        device_name: navigator.userAgent.slice(0, 120),
      }),
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || "Failed to register with server" };
  }
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!isWebPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const json = sub.toJSON();
  const token = JSON.stringify({
    endpoint: json.endpoint,
    keys: json.keys,
  });

  try {
    await apiFetch("/notifications/devices", {
      method: "DELETE",
      body: JSON.stringify({ token, platform: "web" }),
    });
  } catch {
    // ignore
  }
  await sub.unsubscribe();
}

export async function getWebPushStatus(): Promise<
  "unsupported" | "denied" | "subscribed" | "unsubscribed"
> {
  if (!isWebPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return "unsubscribed";
  const sub = await reg.pushManager.getSubscription();
  return sub ? "subscribed" : "unsubscribed";
}
