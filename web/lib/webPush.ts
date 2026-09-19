import { apiFetch, API_URL } from "./api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function enableWebPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const keyRes = await fetch(`${API_URL}/notifications/vapid-public-key`);
  const { publicKey, configured } = await keyRes.json();
  if (!configured || !publicKey) return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await apiFetch("/notifications/devices", {
    method: "POST",
    body: JSON.stringify({
      token: JSON.stringify(sub.toJSON()),
      platform: "web",
      device_name: navigator.userAgent.slice(0, 80),
    }),
  });
  return true;
}
