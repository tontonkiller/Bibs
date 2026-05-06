// Bibs — service worker minimal pour shell offline.
// Stratégie: network-first pour les requêtes Supabase et HTML, cache-first pour les assets statiques.

const CACHE = "bibs-v1";
const APP_SHELL = ["/", "/historique", "/stats"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Bypass cross-origin requests (Supabase, etc.) — let them fail naturally.
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML so we always serve the latest UI when online.
  const isHtml = req.headers.get("accept")?.includes("text/html");
  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/"))),
    );
    return;
  }

  // Cache-first for static assets.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached as Response),
    ),
  );
});
