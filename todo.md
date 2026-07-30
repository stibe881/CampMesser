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
## Verifikation (per Code-Prüfung bestätigt)
- SOS: Notfallnummern exakt benannt (Rega 1414, Notruf 112, Polizei 117 in data/emergency.ts), Direktwahl via tel:-Links, Geolocation-Fehlerbehandlung vorhanden, Koordinaten in Dezimalgrad/GMS/LV95 (formatDMS, wgs84ToLV95 – durch Tests abgedeckt)
- Packlisten: toggle-/addItem-Mutationen mit DB-Persistenz vorhanden (PackListDetail.tsx, server/routers.ts packing-Router)
- Inventar: add/update/remove-Mutationen mit Feldern name/weightGrams/volumeLiters/category (Inventory.tsx, inventory-Router)
- Tests: 18 Vitest-Tests grün (Berechnungen, Sonnenstand, LV95, Packlisten-Vorlagen, Auth)
