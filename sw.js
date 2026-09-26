/* PassTheFE service worker — minimal passthrough.
   Exists so the app meets browser installability criteria (PWA install
   prompt). All requests fall through to the network; nothing is cached. */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function () {
  // Intentionally no respondWith: let the request go to the network.
});
