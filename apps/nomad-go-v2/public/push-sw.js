// Web Push handlers. Imported into the next-pwa generated service worker via
// workboxOptions.importScripts in next.config.mjs.

self.addEventListener("push", (event) => {
  let payload = {
    title: "Nomad-Go",
    body: "You have a new notification.",
    icon: "/Shagai.png",
    url: "/",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const { title, ...options } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: options.body,
      icon: options.icon || "/Shagai.png",
      badge: options.badge || "/Shagai.png",
      tag: options.tag,
      renotify: Boolean(options.tag),
      data: { url: options.url || "/" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab if one is already open.
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
