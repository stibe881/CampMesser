# CampMesser – Projekt TODO

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
- [x] Bug (Runde 2): Hero-Bild fehlt beim User trotz SW v2 – Live-Test im echten Browser: Bild lädt korrekt, SW v2 cached sauber (200/nicht-redirected). Ursache beim User: alter SW v1 bleibt aktiv, bis alle Tabs/PWA-Instanzen geschlossen werden. Fix: Auto-Update-Mechanismus (registration.update + SKIP_WAITING + einmaliger Reload bei controllerchange), Cache v3. Upgrade-Szenario in Produktion verifiziert: Browser mit aktivem v2-SW erhielt beim Seitenbesuch automatisch v3 (alte v2-Caches gelöscht, nur campmesser-v3-* vorhanden, kein waiting worker), Hero-Bild lädt (naturalWidth 1920)
- [x] Bug (Runde 3): Hero-Bild fehlt beim User weiterhin – robusteste Lösung umgesetzt: Bild als gebündeltes Vite-Asset (client/src/assets/hero-camping.webp, 112 KB WebP statt 4 MB PNG über Redirect); kein /manus-storage-Redirect, kein Service Worker im Pfad; in Produktion verifiziert (Status 200, keine Redirects)

## Selbst-Hosting (Hetzner)

- [x] Alle Modul-Bilder (Natur 16, Knoten 8, Rezepte 18) als lokale WebP-Bundle-Assets einbinden, damit die App ohne Manus-Storage läuft
- [x] Passwort-Reset ohne Manus-Notification-Dienst nutzbar machen (server/mailer.ts: SMTP über nodemailer, Fallback Manus-Notification, sonst Logfile)
- [x] Hetzner-Deployment-Anleitung erstellt (DEPLOYMENT-HETZNER.md) – zugeschnitten auf Webhosting L/XL mit Node.js-Aktivierung in konsoleH (statt VPS/Nginx/systemd)
- [x] Deploy-Skript scripts/deploy-hetzner.sh und Umgebungs-Vorlage env.hetzner.template ergänzt
- [x] Selbst-Hosting verifiziert: Produktions-Build ohne Manus-Variablen gestartet (nur NODE_ENV/PORT/DATABASE_URL/JWT_SECRET) – Startseite HTTP 200, Hero-Bild 114 KB, Registrierung erfolgreich
- [x] Vollständige Prüfung (Build sauber, 88 Vitest-Tests grün) und Checkpoint
- [x] Bug: «Live-Kompass aus»-Button funktioniert nicht → behoben (stabiler Event-Handler mit enabledRef, stop() entfernt beide Event-Typen zuverlässig)
## Verifikation (per Code-Prüfung bestätigt)
- SOS: Notfallnummern exakt benannt (Rega 1414, Notruf 112, Polizei 117 in data/emergency.ts), Direktwahl via tel:-Links, Geolocation-Fehlerbehandlung vorhanden, Koordinaten in Dezimalgrad/GMS/LV95 (formatDMS, wgs84ToLV95 – durch Tests abgedeckt)
- Packlisten: toggle-/addItem-Mutationen mit DB-Persistenz vorhanden (PackListDetail.tsx, server/routers.ts packing-Router)
- Inventar: add/update/remove-Mutationen mit Feldern name/weightGrams/volumeLiters/category (Inventory.tsx, inventory-Router)
- Tests: 18 Vitest-Tests grün (Berechnungen, Sonnenstand, LV95, Packlisten-Vorlagen, Auth)
