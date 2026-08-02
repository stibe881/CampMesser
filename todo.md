# CampMesser – Projekt TODO

## Erweiterungen (Nutzerwunsch 02.08.2026, Runde 8)

- [x] Trip-Planer: Tagebuch-Einträge mit Zukunfts-Datum als «Geplante Aufenthalte» mit Countdown, optionaler Packlisten-Verknüpfung (packListId, Migration 0012) und Pack-Fortschritt; Startseiten-Widget «Nächster Trip»
- [x] Platz-Dossier per Link teilen: Teil-Token an campSpots (Migration 0013), öffentliche Seite /platz/:token mit Sonnenzeiten und 3-Tage-Wetter, Teilen-Karte im Dossier
- [x] Eigene Rezepte: Editor im Rezeptbuch (Tabelle customRecipes, Migration 0014), Anzeige mit Badge «Eigenes», Kühlbox-Vorschläge berücksichtigen eigene Rezepte
- [x] Wetter: 48-h-Niederschlagsgrafik (Menge + Wahrscheinlichkeit, zwei Achsen)
- [x] Unwetter-Push: Web Push (VAPID) für gespeicherte Zeltplätze – Opt-in bei den Favoriten, Tabelle pushSubscriptions (Migration 0015), Check-Endpoint /api/push/check für konsoleH-Cron, SW-Push-Handler; Doku in DEPLOYMENT-HETZNER.md
- [x] Accessibility: 3 axe-core-Checks (WCAG 2A/2AA) in der CI; gefundene Verstösse behoben (Zoom-Sperre entfernt, Kontrast Erste-Hilfe-Badge)
- [ ] Mehrsprachigkeit DE/FR/IT/EN – IN ARBEIT: Infrastruktur fertig (shared/i18n.ts, LanguageProvider mit Sync, Sprachwahl im Header, Wörterbücher de/fr/it/en typgeprüft, AppShell umgestellt); Rest gemäss I18N-STATUS.md (alle Seiten + alle Inhalts-Daten)


## Erweiterungen (Nutzerwunsch 01.08.2026, Runde 7)

- [x] Schnitzeljagd-Editor im Familien-Modus: eigene Jagden mit Story, bis zu 12 Stationen (Rätsel/Hinweis/Buchstabe) und Schatz-Finale erstellen, bearbeiten, löschen; Lösungswort automatisch aus den Buchstaben; gleicher Player (schrittweise Enthüllung) und gleiche Druckansicht wie eingebaute Jagden (Tabelle customHunts, Migration 0011, shared/hunts.ts mit 6 Tests)
- [x] Sonnen-Kompass: Datums-Auswahl für die Planung (Sonnenbahn an einem künftigen Tag, Planungs-Badge, Jetzt-Button setzt zurück)
- [x] Platz-Dossier /zeltplaetze/:id: Sonnenzeiten, 3-Tage-Wetter mit Warnungen, Hindernis-Profil-Status und Tagebuch-Aufenthalte eines Favoriten gebündelt
- [x] Knoten-Quiz: Übungsmodus «Welcher Knoten passt zur Situation?» (8 Fragen, Profi-Tipp-Feedback, client/src/lib/knotQuiz.ts mit 4 Tests)
- [x] CI mit echter MySQL: Service-Container, Migrationen gegen frische DB, Auth-Flow-Integrationstest (Registrieren→Anmelden→Liste→Sync→Löschen), lokal automatisch übersprungen
- [x] Härtung: Rate-Limit für POST /api/log (20/IP/10 Min); gesamtes Repo mit Prettier formatiert und prettier --check als CI-Schritt

## Grundgerüst

- [x] Design-System: Farbpalette, Typografie, globales Theming (index.css, index.html)
- [x] Navigationsstruktur & Routing in App.tsx (mobile-first, Bottom-Nav / Modul-Grid)
- [x] Startseite (Home) mit Modul-Übersicht im eleganten Stil
- [x] Datenbank-Schema: Packlisten, Inventar, Energie-Verbraucher

## Offline-Inhalte (statische Daten im Client-Bundle)

- [x] Erste-Hilfe-Guide: 10 Themen (Zeckenbiss, Verbrennung, Verstauchung, Schnittwunde, Unterkühlung, Hitzschlag, Insektenstich, Blasen, Nasenbluten, Reanimation) – textbasiert illustriert
- [x] Knoten-Bibliothek: 8 Knoten mit Schritt-für-Schritt-Anleitungen
- [x] Natur-Entdecker-Lexikon: Tierspuren, Sternbilder, Bäume – kindgerecht mit Fun-Facts und Kinderfragen
- [x] Campfire-Rezeptbuch: 14 Rezepte, filterbar nach Zutaten und Zubereitungszeit
- [x] Packlisten-Vorlagen: Solo-Trip, Familienurlaub, Motorrad-Zelten (+ eigene Liste)

## Funktionen

- [x] Sonnenstand-Kompass: 2D-Karte mit Sonnenposition zu wählbarer Uhrzeit (GPS), Sonnenauf-/-untergang
- [x] Szenario-basierte Packlisten: abhakbar, erweiterbar, persistent
- [x] Inventar-Verwaltung: Name, Gewicht, Volumen, Kategorie (CRUD)
- [x] SOS-Dashboard: GPS-Koordinaten + Notfallnummern (Rega 1414, Notruf 112, Polizei 117) mit Schnellzugriff
- [x] Energie-Budget-Rechner: Verbraucher + Akkukapazität (Standard DJI Power 1000 / 1024 Wh) + Solarertrag über einstellbare Sonnenstunden (inkl. 30 % Systemverlust) → Autarkie-Dauer
- [x] Packmass- & Gewichtsoptimierung: Gesamtübersicht Gewicht/Volumen, Optimierungshinweise Auto/Motorrad
- [x] Familien-Modus: Kinder-Checklisten (kindersichere Ausrüstung), Reiseapotheken-Erweiterung, Offline-Schnitzeljagden, Natur-Quiz
- [x] Lebensmittel-Inventar (Kühlbox): Liste führen, passende One-Pot-Rezepte vorschlagen
- [x] Trinkwasser-Rechner: Personen, Tage, Aussentemperatur → benötigte Liter
- [x] SOS-Erweiterung: Koordinaten in Dezimalgrad, GMS und LV95, Direktwahl-Buttons, Rega-App-Hinweis, Notruf-Anleitung (Wer/Wo/Was)

## Qualität

- [x] Barrierefreiheit: ARIA-Labels, Tastaturnavigation, Kontraste (WCAG 2.1)
- [x] Vitest-Tests für Server-Prozeduren und Berechnungslogik (18 Tests grün)
- [x] Responsive Prüfung (Mobile 375px + Desktop)
- [x] Checkpoint erstellen und liefern (Version 0891b6aa)

## Erweiterungen (Nutzerwunsch 30.07.2026)

- [x] Natur-Entdecker: Bild für jeden Eintrag (Tierspuren, Sternbilder, Bäume) generieren und einbinden (16 Illustrationen)
- [x] Startseite: modernes, echtes Hero-Bild statt Muster-Hintergrund (Alpen-Camping-Szene mit Zelt, Solarpanels, Powerstation)
- [x] Gruppe/Menüpunkt «Wissen» in «1. Hilfe» umbenennen (Startseite + Bottom-Navigation)

## Erweiterungen (Nutzerwunsch 30.07.2026, Runde 2)

- [x] Trinkwasser-Rechner: Option für Hunde (Anzahl) und komfortable Körperpflege (+4 l/Person/Tag)
- [x] Knoten-Bibliothek: Schritt-für-Schritt-Bild für jeden der 8 Knoten (4-Panel-Anleitungen)
- [x] Wetter-Modul: hyperlokale Vorhersage (Open-Meteo, ICON-CH) + Unwetterwarnungen (Sturm, Starkregen, Gewitter, Hitze, Frost), Route /wetter
- [x] Rezeptbuch: 6 weitere Rezepte ergänzt (jetzt 18 Rezepte)

## Erweiterungen (Nutzerwunsch 30.07.2026, Runde 3)

- [x] Zeltplatz-Favoriten: Orte speichern (DB campSpots, Route /zeltplaetze), Wetter-Vorschau (Open-Meteo + Warnungen) und Sonnenzeiten pro Ort, Link zum Sonnenstand-Kompass mit URL-Parametern
- [x] Energie-Budget: Button «Sonnenstunden aus Wetterprognose übernehmen» (Ø sunshine_duration der nächsten 3 Tage am Standort)
- [x] Rezeptbuch: Bild für jedes der 18 Rezepte generiert und in Karten + Detail-Dialog eingebunden

## Erweiterungen (Nutzerwunsch 31.07.2026, Runde 4)

- [x] Sonnenstand-Kompass: moderneres, selbsterklärendes Design (Himmels-Gradient, Aufgang/Untergang-Marker, vergangene/zukünftige Bahn, Sonne mit Strahlen, Legende, Live-Zusammenfassung in Alltagssprache)
- [x] Familien-Modus: 2 neue Schnitzeljagden (Expedition Wassertropfen, Nachtwächter-Prüfung) und 2 neue Quizze (Wetterfrosch, Lagerfeuer-Profi)
- [x] Familien-Modus: alle 6 Schnitzeljagden als Erlebnis-Jagden (Story, Stationen mit Rätseln/Hinweisen, Buchstaben sammeln, Lösungswort + Schatz-Finale, Stationen werden erst nach und nach enthüllt)
- [x] Zeltplatz-Favoriten: Karten-Auswahl im Dialog (Tipp auf Karte setzt Marker und Koordinaten)
- [x] Camp-Wetter: Favoriten-Chips zur Ortsauswahl (Mein Standort + gespeicherte Zeltplätze)
- [x] Packlisten: Teil-Link (shareToken), öffentliche Route /liste/:token mit gemeinsamem Abhaken (Auto-Refresh 15 s), Link kopieren – per DB-Token-Test verifiziert

## Erweiterungen (Runde 5)

- [x] Sonnen-Kompass: Hindernis-Profil – Hindernisse (Baum/Wald, Berg/Hügel, Gebäude) mit Richtung, Höhe und Breite erfassen (localStorage), Sektoren im Diagramm, «im Schatten»-Anzeige an der Sonne, Schattenzeiten-Fenster des Tages, Faust-Regel-Tipp (Logik in shared/obstacles.ts, 8 Tests)
- [x] PWA: manifest.json + Icons (192/512, maskable) + Service Worker (network-first Shell, cache-first Bilder, kein API-Caching), Registrierung nur in Produktion, Apple-Meta-Tags, lang=de-CH
- [x] PWA: Wissens-Module inkl. /manus-storage-Bilder offline nutzbar (SPA-Fallback auf gecachte Shell; Inhalte statisch im JS-Bundle; OfflinePrecache-Komponente lädt alle Natur-/Knoten-/Rezept-Bilder nach App-Start gezielt vor)

## Erweiterungen (Runde 6)

- [x] Sonnen-Kompass: Hindernisse per Tipp/Klick direkt aufs Diagramm setzen (Tipp-Modus-Button, Pixel→Azimut/Höhe-Umrechnung, Crosshair-Cursor, Hinweisbanner mit Abbrechen; Zahleneingabe bleibt als Alternative)
- [x] Familien-Modus: Schnitzeljagd-Druckansicht unter /familie/drucken/:id (Stationen, Rätsel, Abhak- und Buchstabenfelder, Lösungswort-Felder leer; Print-CSS blendet Navigation aus; Links auf jeder Jagd-Karte)
- [x] Natur-Modul: Mondphasen-Kalender (aktuelle Phase mit Symbol und Beleuchtung, Sternbeobachtungs-Bewertung, nächste 3 Vollmonde/Neumonde, offline berechnet; shared/moon.ts mit 7 Tests)

## Erweiterungen (Runde 7)

- [x] Energie-Budget: Effektive Sonnenstunden zuverlässig aus der Wetter-Prognose übernehmen (Auto-Load beim Öffnen, Fallback auf ersten Zeltplatz-Favoriten wenn GPS fehlt/abgelehnt, Quellen-Anzeige im Bestätigungstext)
- [x] Sonnen-Kompass: Zeit-Slider steht beim Öffnen auf der aktuellen Uhrzeit, synchronisiert sich beim Zurückkehren aus dem Hintergrund (PWA) und hat einen «Jetzt»-Button
- [x] Sonnen-Kompass: Live-Kompass-Modus – Diagramm dreht sich automatisch mit der Smartphone-Ausrichtung (DeviceOrientation, iOS-Berechtigungsabfrage, Ein/Aus-Button mit Grad-Anzeige, Fallback-Hinweis auf Desktop, Tipp-Modus rechnet Rotation heraus)
- [x] Projekt-Code committen und ins GitHub-Repo stibe881/CampMesser pushen (Branch main, Commit 6769856)

## Erweiterungen (Runde 8)

- [x] Trockenzeiten-Rechner: 11 Materialien, Berechnung aus Temperatur/Feuchte/Wind (Auto-Load vom Standort-Wetter + manuelle Eingabe), Sonnenuntergangs-Empfehlung mit 30-Min-Tau-Reserve (shared/drying.ts, 8 Tests, Route /trockenzeiten)
- [x] Camp-Quiet-Timer: Web-Audio-Pegelmessung (rein lokal), einstellbares Nachtruhe-Fenster (auch über Mitternacht) und Schwelle, Erinnerung nach 3 s über Schwelle (Route /nachtruhe)
- [x] Energie-Budget: Auto/Manuell-Schalter für Sonnenstunden – manuelles Ziehen des Sliders deaktiviert Auto, Schalter zurück auf Auto übernimmt die Prognose sofort
- [x] Sonnen-Kompass: Sonnenauf- (orange) und -untergangs-Symbol (rot) an der korrekten Position des Zeit-Sliders
- [x] Live-Kompass: Sichtkegel (50° Öffnung) mit Richtungspfeil zeigt die Blickrichtung des Smartphones im Diagramm

## Erweiterungen (Runde 9)

- [x] Trockenzeiten: Eigene Materialien mit individueller Basis-Trockenzeit hinzufügen/löschen (localStorage, Formular + Papierkorb-Button)
- [x] Trockenzeiten: Stündlicher Prognose-Verlauf (48 h, Open-Meteo) mit Integrations-Berechnung (estimateDryingWithForecast, 4 neue Tests); zeigt «Voraussichtlich trocken um HH:MM»; manuelle Eingabe schaltet auf Punktschätzung
- [x] Quiet-Timer: Vibration bei der Erinnerung (navigator.vibrate, max. alle 15 s, Hinweis dass iPhones das nicht unterstützen)

## Erweiterungen (Runde 10)

- [x] Trockenzeiten: Zeltplatz-Favoriten als Standort-Auswahl (Chips «Mein Standort» + gespeicherte Orte, nur für angemeldete Nutzer sichtbar)
- [x] Trockenzeiten: Regen-Warnung (rainBeforeDry, ≥0.2 mm/h oder ≥60 % Wahrscheinlichkeit vor dem Trockenzeitpunkt, 4 neue Tests)
- [x] Startseite: Schnellzugriff «Zuletzt genutzt» mit bis zu 4 zuletzt geöffneten Modulen (localStorage-Tracking im AppShell)
- [x] Header: Blendet beim Runterscrollen aus (ab 80 px), schwebender SOS-Button bleibt oben rechts sichtbar; Hochscrollen zeigt Header wieder

## Erweiterungen (Runde 11)

- [x] Dark Mode: dunkle Alpine-Palette, ThemeProvider switchable, Mond/Sonne-Umschalter im Header
- [x] Startseite: Kachel-Sortierung per Drag-and-Drop + Pfeil-Buttons (Sortier-Modus, localStorage, pro Gruppe)
- [x] Trockenzeiten: Wäsche-Erinnerung vor Regen/Sonnenuntergang (Notification API, Toast, Vibration; Vorlauf 15/30/60 Min.)
- [x] Eigenständige Auth: passwordHash-Spalte, auth.register/login/logout (scrypt, JWT-Cookie), auth.me ohne passwordHash (7 Tests)
- [x] Eigenständige Auth: Login-/Registrierungsseite /anmelden, LoginPrompt und 401-Redirect umgestellt, Konto-Menü mit Abmelden im Header
- [x] Rasenschoner-Rechner: shared/lawn.ts (Zeltboden, Rasen, Temperatur, Sonne, Feuchte → Vergilbung/Schäden/Umstell-Empfehlung), Seite /rasen, 7 Tests

## Runde 12: Wetter-Rasenschoner, Profil, Passwort-Reset

- [x] Rasenschoner: Temperatur und Bodenfeuchte automatisch aus der Wetter-Prognose übernehmen (GPS, manuell überschreibbar, Hinweis mit Quelle; Bodenfeuchte primär aus soil_moisture_0_to_7cm, Fallback Niederschlag 48 h – deriveMoisture mit 3 Tests)
- [x] Profil-Seite /profil: Name ändern, Passwort aktualisieren (mit aktuellem Passwort bestätigen), Konto löschen (inkl. aller Daten, AlertDialog mit Passwort), Profil-Link im Konto-Menü
- [x] Passwort vergessen: 6-stelliger Code (15 Min., max. 5 Versuche, scrypt-gehasht), Versand als Owner-Benachrichtigung, zweistufiger Flow in /anmelden, 6 Tests
- [x] Profil: Standard-Design wählbar (Hell/Dunkel) – localStorage, wird beim App-Start angewendet
- [x] Bug: Hero-Text auf der Startseite im Dark Mode fast unlesbar – explizit weisse Textfarben verwenden
- [x] Bug: Hero-Bild wird in der veröffentlichten Version nicht angezeigt – Fix-Versuch 1: sw.js v2 (Redirect-sichere Bild-Auslieferung) – hat laut User nicht geholfen
- [x] Bug (Runde 2): Hero-Bild fehlt beim User trotz SW v2 – Live-Test im echten Browser: Bild lädt korrekt, SW v2 cached sauber (200/nicht-redirected). Ursache beim User: alter SW v1 bleibt aktiv, bis alle Tabs/PWA-Instanzen geschlossen werden. Fix: Auto-Update-Mechanismus (registration.update + SKIP_WAITING + einmaliger Reload bei controllerchange), Cache v3. Upgrade-Szenario in Produktion verifiziert: Browser mit aktivem v2-SW erhielt beim Seitenbesuch automatisch v3 (alte v2-Caches gelöscht, nur campmesser-v3-\* vorhanden, kein waiting worker), Hero-Bild lädt (naturalWidth 1920)
- [x] Bug (Runde 3): Hero-Bild fehlt beim User weiterhin – robusteste Lösung umgesetzt: Bild als gebündeltes Vite-Asset (client/src/assets/hero-camping.webp, 112 KB WebP statt 4 MB PNG über Redirect); kein /manus-storage-Redirect, kein Service Worker im Pfad; in Produktion verifiziert (Status 200, keine Redirects)

## Selbst-Hosting (Hetzner)

- [x] Alle Modul-Bilder (Natur 16, Knoten 8, Rezepte 18) als lokale WebP-Bundle-Assets einbinden, damit die App ohne Manus-Storage läuft
- [x] Passwort-Reset ohne Manus-Notification-Dienst nutzbar machen (server/mailer.ts: SMTP über nodemailer, Fallback Manus-Notification, sonst Logfile)
- [x] Hetzner-Deployment-Anleitung erstellt (DEPLOYMENT-HETZNER.md) – zugeschnitten auf Webhosting L/XL mit Node.js-Aktivierung in konsoleH (statt VPS/Nginx/systemd)
- [x] Deploy-Skript scripts/deploy-hetzner.sh und Umgebungs-Vorlage env.hetzner.template ergänzt
- [x] Selbst-Hosting verifiziert: Produktions-Build ohne Manus-Variablen gestartet (nur NODE_ENV/PORT/DATABASE_URL/JWT_SECRET) – Startseite HTTP 200, Hero-Bild 114 KB, Registrierung erfolgreich
- [x] Vollständige Prüfung (Build sauber, 88 Vitest-Tests grün) und Checkpoint
- [x] Bug: «Live-Kompass aus»-Button funktioniert nicht → behoben (stabiler Event-Handler mit enabledRef, stop() entfernt beide Event-Typen zuverlässig)

## Hetzner-Konfiguration (Subdomain camping.gross-ict.ch, Node.js 24)

- [x] Start-Skript app.js im Projektwurzelverzeichnis angelegt: liest .env (eigener Parser, konsoleH-Variablen haben Vorrang), prüft dist/index.js, startet den Server
- [x] Start aus fremdem Arbeitsverzeichnis getestet: Startseite HTTP 200, Bundle 1.3 MB ausgeliefert, tRPC-Antwort korrekt, ohne Manus-Umgebungsvariablen
- [x] Server läuft ohne PORT-Vorgabe (Standard 3000 mit automatischem Ausweichen); PORT als optionale konsoleH-Variable dokumentiert
- [x] Anleitung mit exakten Feldwerten für das konsoleH-Formular ergänzt (Skript-Pfad app.js, Arbeitsverzeichnis public_html/camping, Log-Datei camping.log, 512 MB, Version 24, Umgebungsvariablen)
- [x] DATABASE_URL für die Hetzner-Datenbank korrekt URL-kodiert (Sonderzeichen im Passwort) und in die Anleitung übernommen
- [x] Zielverzeichnis auf ~/public_html/camping umgestellt (Anleitung, Deploy-Skript)
- [x] Start ohne PORT-Variable verifiziert: Standard 3000, automatisches Ausweichen auf 3001 bei Belegung, Startseite HTTP 200
- [x] OAuth-Warnung im Log geprüft: rein informativ (Manus-OAuth wird nicht mehr genutzt), Anmeldung läuft über die eigene E-Mail/Passwort-Auth
- [x] Checkpoint speichern und ins GitHub-Repo pushen (TypeScript sauber, 88 Tests grün)

## Verifikation (per Code-Prüfung bestätigt)

- SOS: Notfallnummern exakt benannt (Rega 1414, Notruf 112, Polizei 117 in data/emergency.ts), Direktwahl via tel:-Links, Geolocation-Fehlerbehandlung vorhanden, Koordinaten in Dezimalgrad/GMS/LV95 (formatDMS, wgs84ToLV95 – durch Tests abgedeckt)
- Packlisten: toggle-/addItem-Mutationen mit DB-Persistenz vorhanden (PackListDetail.tsx, server/routers.ts packing-Router)
- Inventar: add/update/remove-Mutationen mit Feldern name/weightGrams/volumeLiters/category (Inventory.tsx, inventory-Router)
- Tests: 18 Vitest-Tests grün (Berechnungen, Sonnenstand, LV95, Packlisten-Vorlagen, Auth)

## Hetzner Runde 2: eigene Domain campmesser.ch

- [x] Erkenntnis: Node.js wirkt bei Hetzner auf die GESAMTE Domain – Aktivierung für camping.gross-ict.ch legte gross-ict.ch lahm (503). Nach Deaktivierung wieder 200 OK.
- [x] Erkenntnis: Projekt darf NICHT in public_html liegen – Apache lieferte app.js/package.json/server/mailer.ts mit Status 200 aus. Nach Verschieben nach ~/campmesser: 404, Quellcode nicht mehr öffentlich.
- [x] Anleitung auf eigene Domain campmesser.ch und Zielverzeichnis ~/campmesser umgestellt
- [x] Startseiten-Gruppe und Navigation von «1. Hilfe» auf «Erste Hilfe» umbenannt (Home, AppShell, Weather, Login)
- [x] DNS von campmesser.ch geprüft: Domain heute registriert, Status «active», Nameserver ns1.your-server.de / ns3.second-ns.de / ns.second-ns.com (Hetzner) – A-Eintrag noch nicht weltweit auflösbar, Verzögerung normal
- [ ] Node.js in konsoleH für campmesser.ch konfigurieren und Start verifizieren (wartet auf DNS-Verbreitung und Rückmeldung des Users)

## Erweiterungen (Nutzerwunsch 01.08.2026)

- [x] Startseite: Kachel-Sortierung auf Pointer Events umgestellt – Drag-and-drop funktioniert jetzt auch auf Touch-Geräten (touch-none gegen Mitscrollen, Pfeil-Buttons bleiben als Fallback)
- [x] Packlisten: QR-Code im Teilen-Dialog – Mitreisende scannen den Teil-Link direkt mit der Handy-Kamera (qrcode-Paket, weisser Rahmen für Dark Mode)
- [x] Camp-Wetter: Waldbrandgefahr-Anzeige für die Schweiz – Gefahrenstufe 1–5 der offiziellen BAFU-Warnkarte via GeoAdmin-API (LV95), mit Region, Feuerregeln je Stufe und Verweis auf waldbrandgefahr.ch (shared/fireDanger.ts, 8 Tests)
- [x] Energie-Budget: Solarpanel-Ausrichtungshilfe – optimale Ausrichtung und Neigung für heute aus Sonnenbahn und Hindernis-Profil des Sonnen-Kompasses (Rastersuche mit Luftmassen-Gewichtung), inkl. Mehrertrag vs. flach, Sonnenfenster und Verschattungs-Stunden (shared/solar.ts, 6 Tests; Hindernis-Speicher nach client/src/lib/obstacleStore.ts ausgelagert)
- [x] Reise-Tagebuch (/tagebuch): Aufenthalte mit Zeltplatz-Favorit oder Freitext-Ort, An-/Abreise und Notizen erfassen; Statistik mit Nächten im laufenden Jahr, Nächten gesamt, Aufenthalten und Lieblingsplatz (DB-Tabelle tripLogs, Migration 0007, trips-Router, shared/trips.ts mit 8 Tests, Kachel in Gruppe «Planung»)

## Erweiterungen (Nutzerwunsch 01.08.2026, Runde 2)

- [x] auth.logout-Test an die Lax-Cookie-Policy angeglichen (sameSite lax statt none) – Suite wieder komplett grün
- [x] Startseite: Kacheln im Sortier-Modus per Augen-Button aus-/einblenden; ausgeblendete Kacheln verschwinden im Normal-Modus (auch aus «Zuletzt genutzt» und leeren Gruppen), bleiben im Sortier-Modus gedimmt mit Badge sichtbar
- [x] Geräte-Sync über das Konto: Tabelle userSettings (userId+key unique, JSON-Wert, Migration 0008), settings-Router (all/set, Schlüssel-Allowlist in shared/settings.ts), Client-Hook useSyncedSetting (Server-Stand gewinnt beim Laden, lokale Änderungen werden gepusht, ohne Anmeldung rein lokal); angebunden: Kachel-Reihenfolge + ausgeblendete Kacheln, Hindernis-Profil des Sonnen-Kompasses, eigene Materialien im Trockenzeiten-Rechner (3 Tests)
- [x] Code-Splitting: alle Routen ausser Home per React.lazy in eigene Chunks (Haupt-Bundle 914 kB → 532 kB, gzip 262 kB → 165 kB); Route-Chunks werden 2,5 s nach App-Start im Leerlauf vorgeladen, damit der Service Worker sie cached und die Offline-Module offline nutzbar bleiben; getThemePreference nach client/src/lib/themePreference.ts ausgelagert

## Offene Aufgaben (User)

- [ ] Backup auf dem Hetzner-Server einrichten: einmal `bash ~/campmesser/scripts/backup-db.sh` von Hand ausführen, dann Cronjob in konsoleH anlegen (z. B. täglich 03:30) – siehe Abschnitt «Datenbank-Backup» in DEPLOYMENT-HETZNER.md
- [ ] Auto-Deploy scharf schalten: SSH-Key erzeugen, Public Key in `~/.ssh/authorized_keys` auf dem Server, GitHub-Secrets `HETZNER_HOST`/`HETZNER_USER`/`HETZNER_SSH_KEY` anlegen – siehe Abschnitt «Automatisches Deployment» in DEPLOYMENT-HETZNER.md
- [ ] Uptime-Dienst (z. B. UptimeRobot) auf `https://campmesser.ch/api/health` einrichten
- [ ] Feature-Branch `claude/projekt-laden-eb1rox` nach `main` mergen (Claude sagen oder selbst mergen – löst nach Secret-Einrichtung das Auto-Deploy aus)

## Erweiterungen (Nutzerwunsch 01.08.2026, Runde 3)

- [x] index.html von 369 kB auf 1,7 kB verkleinert: Manus-Runtime-Plugin (367 kB Inline-Skript) und jsx-loc nur noch im Dev-Server, totes Analytics-Tag entfernt
- [x] Chunk-Lade-Fehler nach Deployments abgefangen: lazyWithRetry lädt einmalig neu (60-s-Schleifenschutz), danach ErrorBoundary
- [x] CI: GitHub-Actions-Workflow (pnpm install/check/test/build bei Push auf main und PRs)
- [x] Login-Rate-Limiting: max. 10 Fehlversuche pro E-Mail+IP in 15 Min (server/rateLimit.ts, 6 Tests)
- [x] DB-Backup: scripts/backup-db.sh (mysqldump, gzip, Rotation 14 Stände) + Abschnitt in DEPLOYMENT-HETZNER.md (Cronjob, Restore)
- [x] Wasserwaage (/wasserwaage): Libelle mit Lagesensor, Grad-Anzeige beider Achsen, Unterleg-Tipps, «Hier nullen»-Kalibrierung, Bildschirmdrehungs-Kompensation, iOS-Berechtigung; Logik in shared/level.ts mit 8 Tests, offline
- [x] Hindernis-Profil pro Zeltplatz: Profile {global, spots} in shared/obstacleProfiles.ts (alte Array-Form wird migriert, 7 Tests), Profil-Chips im Sonnen-Kompass (Allgemein + Favoriten mit Zähler), Spots-Link übergibt spot-ID und wählt das Profil automatisch, Energie-Budget nutzt das Profil des Prognose-Zeltplatzes, Sync über bestehenden Schlüssel sunObstacles

## Erweiterungen (Nutzerwunsch 01.08.2026, Runde 4)

- [x] Auto-Deploy: GitHub-Actions-Workflow deploy.yml (verify: check/test/build → deploy: SSH aufs Hetzner, Deploy-Skript, Passenger-Neustart via tmp/restart.txt); überspringt sauber, solange Secrets fehlen; Einrichtungs-Anleitung in DEPLOYMENT-HETZNER.md
- [x] Schriften selbst gehostet: Fraunces/Inter/JetBrains Mono via Fontsource im Bundle, Google-Fonts-Links entfernt – offline-fähig, datenschutzfreundlich, ein Roundtrip weniger
- [x] Health-Endpoint /api/health (200 ok / 503 bei DB-Ausfall, uptime+latency) + Doku-Abschnitt Uptime-Überwachung
- [x] Globale Suche auf der Startseite über alle Wissensmodule (Erste Hilfe, Knoten, Rezepte, Natur) mit Umlaut-Faltung und Titel-Gewichtung (client/src/lib/globalSearch.ts, 7 Tests)
- [x] PWA-Shortcuts im Manifest: SOS, Wetter, Wasserwaage per Langdruck aufs App-Icon
- [x] Kühlbox: MHD-Tracking – optionales Haltbarkeitsdatum (Spalte expiryDate, Migration 0009), Warn-Badges (abgelaufen/heute/bald), «Verbrauche zuerst»-Sortierung und Hinweis-Banner (shared/food.ts, 6 Tests)

## Erweiterungen (Nutzerwunsch 01.08.2026, Runde 5)

- [x] Globale Suche findet jetzt auch die Werkzeug-Module selbst («wasserwaage» → Kachel); Modul-Katalog nach client/src/data/modules.ts extrahiert (Home + Suche teilen ihn)
- [x] Trinkwasser-Rechner: Tageshöchsttemperatur automatisch aus der 3-Tages-Prognose am Standort (manuelles Ziehen schaltet auf manuell, Prognose per Klick wieder übernehmbar)
- [x] Versions-Anzeige: Git-Commit + Build-Datum beim Build eingebettet (vite define + dist/version.json via scripts/write-version.mjs), sichtbar im Profil-Footer und in /api/health – zeigt auf einen Blick, welcher Stand live läuft
- [x] DB-Indizes auf alle userId-Spalten sowie packItems.listId und packLists.shareToken (Migration 0010)
- [x] Dependabot: wöchentliche, gruppierte Update-PRs für npm und GitHub Actions (CI prüft sie automatisch)

## Erweiterungen (Nutzerwunsch 01.08.2026, Runde 6)

- [x] Packlisten ↔ Inventar: Gegenstände per Chip aus dem Inventar übernehmen; Gewichts-Bilanz (gesamt/gepackt/Volumen) über Namens-Abgleich (shared/packWeight.ts, 4 Tests)
- [x] Packliste duplizieren: Kopie mit unabgehakten Einträgen per Button (packing.duplicateList)
- [x] Startseite: Wetter-Widget mit aktueller Temperatur, Zustand, Wind und höchster Unwetterwarnung am Standort, verlinkt aufs Wetter-Modul
- [x] Natur-Modul: Sternschnuppen-Kalender – die 10 grossen Jahresströme mit nächstem Maximum, Raten, Blickrichtung, Tipps und Mondstörung (shared/astro.ts, 5 Tests)
- [x] Quiet-Timer: Nacht-Protokoll – höchster Pegel pro Minute als Verlaufsgrafik (recharts) mit Schwellen-Linie, bleibt für den Morgen-Rückblick erhalten
- [x] Profil: E-Mail-Adresse ändern (Passwort-Bestätigung, Validierung, Konflikt-Prüfung, auth.updateEmail)
- [x] Client-Fehler-Reporting: ErrorBoundary meldet Abstürze an POST /api/log (Datei-Log logs/client-errors.log mit 1-MB-Rotation)
- [x] Smoke-Tests: 4 Playwright-Tests gegen den Produktions-Build (Startseite, Anmelden, Code-Splitting-Chunk, Health-Version) als eigener CI-Job

## Logo (Nutzerwunsch 31.07.2026)

- [x] Eigenständiges CampMesser-Logo entworfen: Taschenmesser mit aufgeklappter Klinge als SVG-Bauteil `client/src/components/BrandLogo.tsx` (skalierbar, echte Transparenz, Farbe via currentColor)
- [x] Symbol-Dateien erzeugt: favicon.ico (16/32/48), favicon-16/32.png, icon-192.png, icon-512.png (maskable), apple-touch-icon.png (180), logo-mark.png transparent – Generator `/home/ubuntu/make_icons.py`
- [x] Logo im Kopfbereich (AppShell) ersetzt – altes Dreieck-SVG entfernt
- [x] Logo in index.html eingesetzt (favicon.ico, PNG-Favicons 16/32, Apple-Touch-Icon 180) und manifest.json ergänzt
- [x] Service Worker Cache-Version v3 → v4 erhöht, damit alte Symbole ersetzt werden
- [x] Geprüft: Startseite, Anmeldeseite, SOS, mobile Ansicht – TypeScript sauber, 88 Tests grün
- [x] Checkpoint f49ca398 gespeichert, veröffentlicht und ins GitHub-Repo gepusht
