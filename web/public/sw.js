/* Church Platform – Web Push service worker */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "Grace Church", body: "New notification", data: {} };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Grace Church", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let path = "/";
  if (data.screen === "live") path = "/live";
  else if (data.screen === "sermons") path = "/sermons";
  else if (data.screen === "events") path = "/events";
  else if (data.screen === "give") path = "/give";
  else if (data.url) path = data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(path);
          return client.focus();
        }
      }
      return clients.openWindow(path);
    })
  );
});
