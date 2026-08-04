/*
 * CampMesser Service Worker
 * Strategie:
 * - App-Shell (HTML/JS/CSS): network-first mit Cache-Fallback, damit die App
 *   auch komplett offline startet.
 * - Bilder (manus-storage): cache-first, damit Natur-, Knoten- und Rezept-Bilder
 *   nach dem ersten Besuch offline verfügbar sind.
 * - Karten-Kacheln (OSM/Esri): cache-first aus dem Offline-Paket, sonst Netz.
 *   Gespeichert wird NUR, was das Platz-Dossier bewusst vorlädt.
 * - API-Aufrufe (/api/) und übrige externe Dienste (Open-Meteo): immer Netz,
 *   kein Caching – Live-Daten sollen nicht veralten. EINE Ausnahme: die
 *   Buchungsbestätigung einer Reise (#279) wird network-first geholt und
 *   zusätzlich abgelegt. Sie ändert sich nie und wird genau dann gebraucht,
 *   wenn kein Empfang ist – an der Schranke um 22 Uhr.
 */
const CACHE_VERSION = "campmesser-v7";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
// Zwischenablage für per Share Target geteilte Fotos – bewusst OHNE
// Versions-Präfix, damit der Aufräum-Schritt in "activate" sie nie löscht.
// Die Seite /teilen liest die Dateien aus und leert den Cache danach selbst.
const SHARE_CACHE = "campmesser-share";
// Offline-Pakete der Karten-Kacheln (client/src/lib/mapTiles.ts) – ebenfalls
// OHNE Versions-Präfix, damit ein App-Update die mühsam geladenen Kacheln
// nicht wegräumt. Verwaltet wird der Cache allein im Platz-Dossier.
const MAP_TILE_CACHE = "campmesser-map-tiles";
// Buchungsbestätigungen (#279) – OHNE Versions-Präfix, damit ein App-Update
// die Datei nicht wegräumt, die man unterwegs braucht.
const RESERVATION_CACHE = "campmesser-reservations";
const RESERVATION_PATH = "/api/trips/reservations/";
const MAP_TILE_HOSTS = ["tile.openstreetmap.org", "server.arcgisonline.com"];

// Routen der Wissens-Module, die offline funktionieren sollen (SPA: alle laden dieselbe Shell)
const PRECACHE_URLS = ["/", "/manifest.json"];

// Bewusst KEIN skipWaiting beim Installieren: die neue Version wartet, bis
// die Person im Update-Hinweis «Aktualisieren» wählt (SKIP_WAITING-Message
// unten) oder alle Tabs geschlossen wurden – kein überraschender Reload.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(
              key =>
                !key.startsWith(CACHE_VERSION) &&
                key !== SHARE_CACHE &&
                key !== MAP_TILE_CACHE
            )
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

// Push-Meldungen: Unwetter-Warnungen und Kühlbox-MHD-Erinnerungen anzeigen.
// Der Payload-Tag trennt die beiden, damit sie sich nicht gegenseitig ersetzen.
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
      tag: data.tag || "campmesser-weather-alert",
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

/**
 * Share Target (PWA): das System POSTet geteilte Fotos als multipart/form-data
 * an /teilen. Standard-Rezept: Dateien in einen eigenen Cache legen und mit
 * 303 auf GET /teilen umleiten – die Seite liest die Dateien aus dem Cache
 * und löscht sie danach. Fehler dürfen die Umleitung nie verhindern, die
 * Seite zeigt ohne Dateien einfach einen Hinweis.
 */
async function handleShareTargetPost(request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("photos")
      .filter(entry => entry instanceof File && entry.size > 0);
    const cache = await caches.open(SHARE_CACHE);
    // Reste einer früheren Teilen-Aktion wegräumen
    const oldKeys = await cache.keys();
    await Promise.all(oldKeys.map(key => cache.delete(key)));
    await Promise.all(
      files.map((file, index) =>
        cache.put(
          `/teilen/share-photo-${index}`,
          new Response(file, {
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
          })
        )
      )
    );
  } catch (error) {
    // Formulardaten nicht lesbar – trotzdem zur Seite umleiten
  }
  return Response.redirect("/teilen", 303);
}

/**
 * Karten-Kacheln: zuerst im Offline-Paket nachschauen, sonst ganz normal aus
 * dem Netz. Bewusst OHNE Rückschreiben – in den Cache kommt nur, was im
 * Platz-Dossier ausdrücklich heruntergeladen wurde (Fair Use gegenüber OSM
 * und Esri, und die Paket-Grösse bleibt vorhersehbar).
 */
async function serveMapTile(request) {
  try {
    const cache = await caches.open(MAP_TILE_CACHE);
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
  } catch {
    /* Cache nicht verfügbar – dann eben direkt aus dem Netz */
  }
  return fetch(request);
}

self.addEventListener("fetch", event => {
  const { request } = event;

  const url = new URL(request.url);

  // Geteilte Fotos aus dem System-Teilen-Dialog entgegennehmen
  if (
    request.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === "/teilen"
  ) {
    event.respondWith(handleShareTargetPost(request));
    return;
  }

  if (request.method !== "GET") return;

  // Karten-Kacheln: vorgeladenes Offline-Paket schlägt das Netz
  if (MAP_TILE_HOSTS.indexOf(url.hostname) !== -1) {
    event.respondWith(serveMapTile(request));
    return;
  }

  // Buchungsbestätigung: erst Netz, dann Cache – und jede erfolgreiche
  // Antwort wird abgelegt. Die Datei ändert sich nie, und ohne Empfang ist
  // sie sonst nicht erreichbar.
  if (url.pathname.startsWith(RESERVATION_PATH)) {
    event.respondWith(
      caches.open(RESERVATION_CACHE).then(async cache => {
        try {
          const response = await fetch(request);
          if (response.ok) await cache.put(request, response.clone());
          return response;
        } catch (error) {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw error;
        }
      })
    );
    return;
  }

  // API und übrige externe Dienste: nie cachen
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
