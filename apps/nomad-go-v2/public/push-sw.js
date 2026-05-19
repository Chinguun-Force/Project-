self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "New update",
    body: "You have a new notification.",
    icon: "/file.svg",
  };

  try {
    payload = event.data.json();
  } catch {
    // Keep default payload for malformed pushes.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/app/quests"));
});

