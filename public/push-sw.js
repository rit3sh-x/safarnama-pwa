self.addEventListener("push", (event) => {
    if (!event.data) return;

    event.waitUntil(
        (async () => {
            let data = {};
            try {
                data = event.data.json();
            } catch {
                data = { title: "Safarnama", body: event.data.text() };
            }

            const { title = "Safarnama", body = "", url = "/" } = data;

            await self.registration.showNotification(title, {
                body,
                icon: "/logo.png",
                badge: "/logo.png",
                data: { url },
            });
        })()
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const { url = "/" } = event.notification.data || {};

    event.waitUntil(
        (async () => {
            const clientList = await clients.matchAll({
                type: "window",
                includeUncontrolled: true,
            });

            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    await client.focus();
                    client.postMessage({ type: "NOTIFICATION_CLICK", url });
                    return;
                }
            }

            await clients.openWindow(url);
        })()
    );
});
