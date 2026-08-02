/*
 * CampMesser Service Worker
 * Strategie:
 * - App-Shell (HTML/JS/CSS): network-first mit Cache-Fallback, damit die App
 *   auch komplett offline startet.
 * - Bilder (manus-storage): cache-first, damit Natur-, Knoten- und Rezept-Bilder
 *   nach dem ersten Besuch offline verfügbar sind.
 * - API-Aufrufe (/api/) und externe Dienste (Open-Meteo, Karten): immer Netz,
 *   kein Caching – Live-Daten sollen nicht veralten.
 */
const CACHE_VERSION = "campmesser-v4";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Routen der Wissens-Module, die offline funktionieren sollen (SPA: alle laden dieselbe Shell)
const PRECACHE_URLS = ["/", "/manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => !key.startsWith(CACHE_VERSION))
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Erlaubt der Seite, eine wartende neue SW-Version sofort zu aktivieren
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Unwetter-Push: Warnungen für gespeicherte Zeltplätze anzeigen
self.addEventListener("push", event => {
  let data = { title: "CampMesser", body: "", url: "/wetter" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* Payload nicht lesbar – Standardtext anzeigen */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      data: { url: data.url },
      tag: "campmesser-weather-alert",
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/wetter";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clients => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // API und externe Dienste: nie cachen
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/__manus__/") ||
    (url.origin !== self.location.origin &&
      !url.pathname.startsWith("/manus-storage/"))
  ) {
    return;
  }

  // Bilder aus dem Projekt-Speicher: cache-first
  if (url.pathname.startsWith("/manus-storage/")) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async cache => {
        const cached = await cache.match(request);
        // Nur saubere 200er-Antworten ausliefern; Redirect-/Opaque-Einträge
        // sind für <img> nicht nutzbar und werden verworfen.
        if (cached && cached.status === 200 && !cached.redirected)
          return cached;
        if (cached) await cache.delete(request);
        try {
          // /manus-storage antwortet mit 307 auf eine signierte CloudFront-URL.
          // fetch() folgt dem Redirect, markiert die Antwort aber als
          // "redirected" – solche Responses dürfen nicht direkt gecached oder
          // ausgeliefert werden. Deshalb den Body in eine frische, saubere
          // 200er-Response umpacken.
          const response = await fetch(request);
          if (response.ok) {
            const body = await response.arrayBuffer();
            const clean = new Response(body, {
              status: 200,
              headers: {
                "Content-Type":
                  response.headers.get("Content-Type") || "image/png",
              },
            });
            await cache.put(request, clean.clone());
            return clean;
          }
          return response;
        } catch {
          return Response.error();
        }
      })
    );
    return;
  }

  // Navigation (HTML) und Assets: network-first mit Cache-Fallback
  event.respondWith(
    caches.open(SHELL_CACHE).then(async cache => {
      try {
        const response = await fetch(request);
        if (response.ok && !response.redirected)
          cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        // SPA-Fallback: bei Navigation die gecachte Startseite liefern
        if (request.mode === "navigate") {
          const shell = await cache.match("/");
          if (shell) return shell;
        }
        return Response.error();
      }
    })
  );
});
