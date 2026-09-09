// @ts-nocheck
/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Listen to push events
self.addEventListener("push", (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const title = data.title || "Notifikasi Baru";
      const options = {
        body: data.body || "Ada pembaruan informasi dari MI Attaqwa 15.",
        icon: data.icon || "/icons/icon-192x192.png",
        badge: data.badge || "/icons/icon-192x192.png",
        vibrate: [100, 50, 100],
        data: {
          url: data.url || "/",
        },
      };
      
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      console.error("Error parsing push notification data", e);
      // Fallback if not JSON
      event.waitUntil(
        self.registration.showNotification("Notifikasi MI Attaqwa 15", {
          body: event.data.text(),
          icon: "/icons/icon-192x192.png",
        })
      );
    }
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // If window already open, focus it
        for (const client of clientList) {
          if (client.url.includes(event.notification.data.url) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
