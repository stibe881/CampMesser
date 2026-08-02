# CampMesser – Projekt TODO

## Erweiterungen (Nutzerwunsch 02.08.2026, Runde 12)

- [x] Eigene Packliste als Vorlage speichern: neue Tabelle packTemplatesCustom (userId, name varchar(120), itemsJson als JSON-Array von {name, category, quantity} – gleiches Text-JSON-Muster wie customRecipes.ingredientsJson, Migration 0024) mit defensivem Parser parseCustomTemplateItems in shared/packTemplates.ts; tRPC packing.saveAsTemplate (friert Einträge der Liste sortiert nach sortOrder ein, ohne Häkchen/Personen-Zuordnung, leere Listen abgelehnt), packing.listTemplates (geparste Einträge, neuste zuerst), packing.deleteTemplate, packing.createListFromTemplate (neue Liste mit scenario "custom", alles unabgehakt); im Packlisten-Detail Knopf «Als Vorlage speichern» (Dialog mit Namensfeld, vorbefüllt mit Listennamen) neben Teilen/Drucken; im Neue-Liste-Dialog eigener Abschnitt «Meine Vorlagen» unter den Szenarien (Vorlage wählbar mit Eintrags-Zahl, Löschen-Knopf mit confirm, Auswahl schliesst Szenario-Auswahl aus, Namens-Platzhalter/Fallback aus dem Vorlagen-Namen); Konto-Lösch-Kaskade in deleteUserAccount um packTemplatesCustom ergänzt und DB-Integrationstest erweitert (Vorlage speichern → Liste daraus bauen → nach Konto-Löschung Tabelle leer); neue packListDetail.saveTemplate*-/template*- und packLists.template\*-Schlüssel in DE/FR/IT/EN

- [x] Zelt-Finder-Ziele auf der Karte (/karte): die gespeicherten Zelt-Finder-Ziele (localStorage campmesser.tentFinderTargets inkl. einmaliger Migration des Alt-Ziels und Geräte-Sync über useSyncedSetting – gleicher Ladeweg wie im Zelt-Finder, die Karte liest nur und pusht nie) erscheinen zusätzlich zu den Zeltplatz-Pins als eigene bernsteinfarbene Fadenkreuz-divIcons; Popup mit Ziel-Name, Typ-Zeile «Zelt-Finder-Ziel» und Link «Anpeilen →» in den Zelt-Finder (/zeltfinder?target=<id> – TentFinder wertet den neuen Query-Param analog zu ?spot= aus und wählt das Ziel vor); fitBounds spannt sich über Zeltplatz- UND Ziel-Pins, leerer Zustand erst wenn beides fehlt; Legende unter der Karte zweigeteilt (Zelt-Symbol = Zeltplätze, Fadenkreuz = Ziele, Ziel-Zeile nur wenn vorhanden); 3 neue mapView-Schlüssel (targetKind/aimTarget/targetLegend) in DE/FR/IT/EN

- [x] Sternengucker-Rotlicht-Modus im Natur-Modul: neuer Abschnitt «Rotlicht-Modus» im Astro-Bereich (unter Mond-/Sternschnuppen-Kalender) mit Hinweistext zur Dunkeladaption und Umschalt-Knopf (aria-pressed); aktiviert legt die Komponente client/src/components/RedLightMode.tsx zwei fixe Vollbild-Overlays über die ganze App (rotes multiply-Overlay löscht Grün-/Blauanteile + schwarze 40-%-Abdunkelung, beide pointer-events: none und z-index über allem – die App bleibt voll bedienbar) plus einen schwebenden, bewusst dunkelrot gehaltenen «Rotlicht aus»-Knopf (einziges klickbares Element des Modus, aria-Label, zusätzlich beendet Escape); Zustand nur im React-State der Natur-Seite, bewusst NICHT persistiert (Neuladen/Verlassen der Seite = Modus aus); keine neue reine Logik, daher kein Unit-Test; 6 neue nature.redLight\*-Schlüssel in DE/FR/IT/EN

## Erweiterungen (Nutzerwunsch 02.08.2026, Runde 11)

- [x] Konto-Löschung räumt jetzt wirklich alle Nutzerdaten auf: deleteUserAccount (server/localAuth.ts) löschte bisher nur Packlisten (+Positionen), Inventar, Energie-Verbraucher, Kühlbox, Zeltplätze und Reset-Tokens – neu fallen zusätzlich Reise-Tagebuch (tripLogs), Tagebuch-Fotos (tripPhotos inkl. Dateien unter uploads/trips/), Menüpläne (menuEntries), eigene Rezepte (customRecipes inkl. Foto-Dateien unter uploads/recipes/), eigene Schnitzeljagden (customHunts), Einkaufsliste (shoppingItems), Push-Abos (pushSubscriptions) und synchronisierte Einstellungen (userSettings); Dateinamen werden vor dem DB-Löschen gesichert und die Upload-Dateien zuletzt entfernt (Muster wie trips.remove/recipes.remove, fehlende Dateien blockieren nie); DB-Integrationstest erweitert: legt vor dem Löschen Daten in allen Nutzer-Tabellen samt echten Upload-Dateien an und prüft danach, dass alle 12 Tabellen leer und die Dateien weg sind (gegen echtes MySQL 8 verifiziert)

- [x] Natur-Quizze im Familien-Modus: jedes der fünf Quizze (Wald, Sterne, Tierspuren, Wetter, Lagerfeuer) um 7 neue Fragen erweitert (je 5 → 12, gesamt 25 → 60) – gleiche Machart wie bisher (3 Antwortoptionen, Erklärung mit Merkhilfe, kindgerecht zur Altersangabe des Quiz, natur-/campingbezogen, komplett DE/FR/IT/EN als L4); Quiz-Player in Family.tsx geprüft: Fortschritt, Punkte und Auswertung rechnen überall dynamisch mit quiz.questions.length, keine Anpassung nötig

- [x] «Checklisten für Familien» vom Familien-Modus ins Packlisten-Modul verschoben: Abschnitt in Family.tsx komplett entfernt, in PackLists.tsx als eigener Abschnitt unter den Listen eingebaut – gleiche Karten (Label, Beschreibung, erste 4 Einträge, «… und n weitere»), «Zu einer Packliste hinzufügen» öffnet neu einen Listen-Auswahl-Dialog (eigene Listen als Buttons, Hinweis wenn noch keine Liste existiert) und übernimmt die Einträge in der aktiven Sprache per packing.addItems (Muster wie addAddOn im PackListDetail, Erfolgs-Toast mit Paket- und Listennamen); familyAddOns-Daten bleiben in shared/packTemplates.ts (nur der Konsument wechselt), zugehörige Schlüssel vom family- in den packLists-Namespace umgezogen und um Dialog-Schlüssel ergänzt (DE/FR/IT/EN)

- [x] Startseite: Modul-Gruppe «Planung» in zwei Gruppen aufgeteilt – «Reise planen» (Packlisten, Inventar, Pack-Optimierung, Familien-Modus, Reise-Tagebuch) und «Vor Ort» (Sonnenstand-Kompass, Zeltplatz-Favoriten, Zelt-Finder, Rasenschoner, Wasserwaage, Trockenzeiten); technische Gruppen-Schlüssel `reise`/`vorOrt` mit L4-Labels in groupLabels (DE/FR/IT/EN), Home-Gruppierung/Sortier-Modus und globale Suche unverändert (gespeicherte moduleOrder/hiddenModules bleiben gültig, da pfad-basiert)

- [x] Foto für eigene Rezepte: im Rezept-Editor lässt sich EIN Foto wählen (Vorschau, «Foto ändern», «Foto entfernen»), Upload nach dem Speichern des Rezepts als Raw-Body über POST /api/recipes/:recipeId/photo (gleiche Session-Prüfung/Limits wie Tagebuch-Fotos: 5 MB, JPEG/PNG/WebP, HEIC-Meldung; ein neuer Upload ersetzt die alte Datei), Client-Resize auf 1600 px/JPEG 0.85 (bestehendes client/src/lib/imageResize.ts); private Auslieferung nur für Besitzer*in über GET /api/recipes/photos/:fileName (Cache private/max-age 1h); Spalte customRecipes.imageFileName (Migration 0022), Anzeige auf Rezept-Karte und im Detail-Dialog über das bestehende Recipe.image-Feld (customRecipeToRecipe mappt auf die Foto-URL); Foto-Entfernen über tRPC recipes.removePhoto, beim Rezept-Löschen wird die Datei mitgelöscht; Storage-Helper zu server/photoStorage.ts verallgemeinert (createPhotoStorage("trips"/"recipes"), ersetzt tripPhotoStorage.ts), Deploy-Skript legt uploads/recipes/ an, Backup-Hinweis in DEPLOYMENT-HETZNER.md ergänzt; neue recipes.editor.photo*-Schlüssel in DE/FR/IT/EN

- [x] Zelt-Finder: mehrere benannte Ziele – beliebig viele Orte per «Aktuellen Standort speichern unter …» mit freiem Namen (Textfeld + Vorschlags-Chips Zelt/Duschen/WC/Abwaschstelle/Spielplatz/Rezeption als Wörterbuch-Schlüssel, gespeichert wird der Text in der aktiven Sprache); Liste {id, name, lat, lon, savedAt} in localStorage campmesser.tentFinderTargets, altes Einzel-Ziel campmesser.tentFinderTarget wird einmalig als «Zelt»-Eintrag migriert und der alte Schlüssel gelöscht; Geräte-Sync für Angemeldete über neuen Schlüssel tentFinderTargets (SYNCED_SETTING_KEYS, Muster dryingCustomItems); Ziel-Auswahl als Listen-Buttons (eigene Ziele mit Live-Distanz und Lösch-Knopf mit confirm, darunter die gespeicherten Zeltplätze), ohne Wahl wird das zuletzt gespeicherte eigene Ziel angepeilt, Kompass-/Distanz-Teil unverändert; leerer Zustand mit Kurzanleitung; Obergrenzen 50 Ziele / 60 Zeichen Name; reine Logik (sanitizeTargets/migrateTargets/newTargetId) in client/src/lib/tentFinderTargets.ts mit 11 Tests (server/tentFinderTargets.test.ts); tentFinder-Namespace in DE/FR/IT/EN erweitert (5 obsolete Schlüssel entfernt)

- [x] Karte der Plätze & Reisen (/karte): alle gespeicherten Zeltplatz-Favoriten als Pins auf einer OpenStreetMap-Karte (Leaflet 1.9.4 direkt, ohne react-leaflet; Tile-Layer tile.openstreetmap.org mit OSM-Attribution, runde Zelt-divIcons ohne Bild-Assets); Ausgangs-Ausschnitt fitBounds über alle Pins, Fallback Schweiz (46.8/8.2, Zoom 8); Popup pro Platz mit Name, Übernachtungen laut Reise-Tagebuch (Zuordnung über spotId, Freitext-Orte über Namens-Abgleich case-insensitiv wie computeTripStats – Tagebuch-Einträge ohne Koordinaten bekommen bewusst KEINE eigenen Pins/kein Geocoding) und Dossier-Link (/zeltplaetze/:id, Popup-DOM ohne innerHTML wegen Nutzertext); LoginPrompt für Gäste, leerer Zustand mit Hinweis + Link zu /zeltplaetze, Karte im Rahmen (Tiles bleiben im Dark Mode hell), aria-Label auf der Karten-Region; Modul-Kachel (Map-Icon, Gruppe «Vor Ort», bewusst NICHT offline markiert – Tiles brauchen Netz); Leaflet landet per Code-Splitting im eigenen Route-Chunk (MapView ~153 kB JS / 45 kB gzip + 16 kB CSS); Namespace mapView in DE/FR/IT/EN

- [x] «Wer packt was»: Personen-Zuordnung pro Packlisten-Eintrag – neue nullable Spalte packItems.assignee varchar(80) (Migration 0023), tRPC packing.updateItem {id, assignee|null} (db.setPackItemAssignee, Muster toggleItem; addItems/Vorlagen bewusst ohne assignee); im Packlisten-Detail pro Eintrag ein Personen-Knopf (UserRoundPlus) mit Inline-Editor (Eingabefeld + bereits vergebene Namen als Ein-Tipp-Chips + «Zuordnung entfernen»), Namens-Badge am Eintrag; Personen-Filter über der Liste als Chips (Alle + vorkommende Namen alphabetisch + «Ohne Zuordnung»), Fortschritts-Balken zeigt bei aktivem Filter den Filter-Stand plus Textzeile «Im Filter … · Gesamt …» (Gesamt bleibt zusätzlich im Untertitel sichtbar), Filter setzt sich selbst zurück wenn die letzte Zuordnung einer Person wegfällt, leerer Filter-Zustand mit Hinweis; optimistisches Update wie toggleItem; geteilte Liste (/liste/:token) zeigt die Badges read-only mit aus (sharedGet liefert assignee automatisch mit); 16 neue packListDetail-Schlüssel in DE/FR/IT/EN

- [x] Packlisten-Druckansicht (/packlisten/:id/drucken): Seite PackListPrint nach dem Muster HuntPrint – Listentitel mit CampMesser-Kopfzeile, Eintrags-/Kategorien-Zahl und Druckdatum (LOCALE_TAGS), Kategorien als Abschnitte in Listen-Reihenfolge, pro Eintrag Papier-Kästchen + Name + ×Menge + Personen-Badge (Rahmen statt Farbe, druckt sauber schwarz-weiss über print-sheet/print-station und die bestehenden @media-print-Styles); optionaler Druck-Filter ?person=<Name> (zeigt «Nur Einträge von X», Badges dann weggelassen), der aktive Personen-Filter der Detail-Seite wird beim «Drucken»-Knopf als Query-Parameter mitgegeben («Ohne Zuordnung» bewusst nicht); Standalone-Fallback wie HuntPrint (window.print() ist in der installierten PWA wirkungslos → Knopf öffnet Browser-Tab + Hinweis), isStandaloneApp dafür in die gemeinsame Utility client/src/lib/standalone.ts ausgelagert und in beiden Druckseiten verwendet; «Drucken»-Knopf neben «Liste teilen» im Detail (wouter-Link), Route in App.tsx VOR /packlisten/:id registriert, eigener Route-Chunk; Namespace packListPrint + packListDetail.printButton in DE/FR/IT/EN

- [x] Beste Reisezeit im Platz-Dossier: neuer aufklappbarer Abschnitt «Beste Reisezeit» (CalendarRange-Icon, aria-expanded) – lädt historisches Wetter bewusst erst beim Aufklappen (Open-Meteo Archive-API ist träge): daily temperature_2m_max/temperature_2m_min/precipitation_sum über die letzten 5 vollen Kalenderjahre (climateYearRange/climateRequestUrl); Aggregation zu Monats-Mitteln als reine Funktion aggregateMonthlyClimate in shared/climate.ts (Ø Tagesmaximum, Ø Tagesminimum, Ø Regentage/Monat mit Schwelle > 1 mm, geteilt durch abgedeckte Jahr-Monat-Vorkommen; null-Lücken übersprungen, Monate ohne Daten = null); Hervorhebung der 3 besten Monate als Chips über einfachen Score (climateScore = Ø-Max − 0.7 × Regentage, bestTravelMonths mit deterministischem Tie-Break) – exportiert und getestet (server/climate.test.ts, 9 Tests); Recharts-ComposedChart über 12 Monate (Ø-Max/Ø-Min als Linien auf linker Achse, Regentage als Balken auf rechter Achse, Monats-Kurzlabels via LOCALE_TAGS), Lade-Skeleton, Fehlerzustand mit «Erneut versuchen», Quellenangabe mit Jahresspanne; beim Platzwechsel wird der Abschnitt zurückgesetzt; 13 neue spotDetail.climate\*-Schlüssel in DE/FR/IT/EN

- [x] Wetter-Vergleich zweier Orte: Knopf «Mit anderem Ort vergleichen» unter der 7-Tage-Vorhersage öffnet den Abschnitt «Orte vergleichen» (per X wieder schliessbar) – zweiter Ort über eine Ortssuche (Open-Meteo-Geocoding-API, gleiche Datenquelle wie das Wetter; searchPlaces mit Sprache der Oberfläche, Ergebnis-Liste mit Region/Land) oder per Klick auf einen gespeicherten Zeltplatz (Chips wie in der Ortsauswahl oben); die 7-Tage-Prognosen beider Orte nebeneinander als echte Tabelle (Zeile pro Tag, Spalten aktueller Ort/Vergleichsort – mobil 2 kompakte Spalten, caption + th scope für Screenreader, sr-only-Labels für Regen/Böen): pro Tag Wetter-Icon (Code-Label als sr-only via describeWeatherCode), Max/Min, Regenmenge + Regenwahrscheinlichkeit, Böen; Vergleichs-Prognose über denselben fetchWeather-Abruf wie die Hauptprognose mit eigenem Lade-/Fehlerzustand («Erneut versuchen»); zweiter Ort wird in localStorage campmesser.weatherCompareLocation gemerkt und beim nächsten Öffnen direkt geladen («Ort ändern» wechselt); 19 neue weather.compare\*-Schlüssel in DE/FR/IT/EN

- [x] Schulferien & Feiertage CH im Trip-Planer: bei den geplanten Aufenthalten eine Kantons-Auswahl (Select mit allen 26 Kantonen aus shared/holidays.ts CANTONS – amtliche Eigennamen, bewusst nicht übersetzt – plus «Kein Kanton», gemerkt in localStorage campmesser.holidayCanton); pro geplantem Trip Badges «Liegt in den Schulferien (Name)» bzw. «Feiertag am DD.MM: Name», wenn der Zeitraum Schulferien/Feiertage des Kantons überlappt (sonst nichts, Ferien-Namen über Schulkreise hinweg dedupliziert); Daten von der OpenHolidays-API (openholidaysapi.org – der Host api.openholidays.eu aus dem Auftrag existiert nicht; GET /SchoolHolidays + /PublicHolidays mit countryIsoCode=CH & subdivisionCode=CH-XX, ohne languageIsoCode, damit die name-Arrays mehrsprachig kommen) über client/src/lib/holidays.ts mit In-Memory- + localStorage-Cache (~1 Tag pro Kanton und Zeitraum laufendes+nächstes Jahr); API-Fehler bewusst still (Hinweise werden weggelassen, Seite bleibt nutzbar); reine Logik in shared/holidays.ts (overlappingHolidays mit inklusiven Datumsgrenzen, holidayDisplayName passend zur UI-Sprache mit Fallback DE, parseHolidaysResponse defensiv, URL-Helfer, CANTONS) mit 13 Tests in server/holidays.test.ts; 6 neue trips.holiday\*-Schlüssel in DE/FR/IT/EN

- [x] Regenradar im Wetter-Modul: aufklappbarer Abschnitt «Regenradar» unter der Niederschlags-Grafik (eigene Komponente client/src/components/RainRadar.tsx) – Leaflet-Karte um den gewählten Ort (OSM-Tiles mit Attribution, Zoom 8, Orts-Marker als circleMarker) mit animiertem RainViewer-Overlay: weather-maps.json liefert die Frames (letzte 7 past-Frames ≈ 60 min + kompletter Nowcast), Tiles über tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png; Animation mit Play/Pause (aria-Labels), Zeitstempel-Anzeige via LOCALE_TAGS-Zeitformat mit «Prognose»-Badge für Nowcast-Frames, Loop 500 ms/Frame, Radar-Opacity 0.7; alle Frames werden als eigene Tile-Layer vorgehalten und nur per Opacity umgeschaltet (kein Flackern), Karte wird beim Schliessen/Verlassen sauber abgebaut; Leaflet + Radar-Fetch bewusst erst beim Aufklappen (dynamischer Import, Wetter-Chunk bleibt schlank), Lade-/Fehlerzustand mit «Erneut versuchen», Quellenangabe RainViewer/OpenStreetMap, Abschnitt nur bei gewähltem Ort (key über Koordinaten setzt beim Ortswechsel zurück); 12 neue weather.radar\*-Schlüssel in DE/FR/IT/EN

## Erweiterungen (Nutzerwunsch 02.08.2026, Runde 10)

- [x] Zelt-Finder (/zeltfinder): Kompass-Peilung + Distanz zum Ziel – Ziel wahlweise gespeicherter Zeltplatz (tRPC spots.list, per ?spot=<id> aus dem Platz-Dossier vorausgewählt, Button «Zelt finden» im Dossier) oder lokal gemerkter Standort (localStorage campmesser.tentFinderTarget, funktioniert auch für Gäste ohne Login); eigene Position per watchPosition (highAccuracy) mit Genauigkeits-Anzeige; Distanz/Anfangs-Peilung als reine Funktionen distanceMeters/bearingDegrees in shared/geo.ts (Haversine bzw. Grosskreis, 9 Tests mit Referenzwerten Bern–Zürich/Genf und Äquator); grosser rotierter SVG-Pfeil (Rotation = Peilung − Geräte-Heading via bestehendem useDeviceHeading-Hook: webkitCompassHeading auf iOS inkl. requestPermission-Button «Kompass aktivieren», deviceorientationabsolute/alpha auf Android), Fallback ohne Kompass: Bewegungsrichtung aus position.coords.heading (mit Hinweis «nur solange du dich bewegst») bzw. reine Himmelsrichtungs-Angabe (compassDirection aus shared/solar.ts) mit Hinweis für stehende Nutzer; Distanz < 1 km in m, sonst km mit einer Nachkommastelle (Intl.NumberFormat je Sprache), «Du bist praktisch da» unter 25 m; Text-Alternative zum Pfeil (Richtung + Distanz), aria-Labels; Modul-Kachel (LocateFixed, Gruppe Planung, offline – Chunk wird vorgeladen, kein Server-Call nötig); Namespace tentFinder + spotDetail.tentFinderLink in DE/FR/IT/EN

- [x] QR-Code fürs Platz-Dossier-Teilen: die Teilen-Karte im Platz-Dossier zeigt zum Teil-Link (/platz/:token) denselben QR-Code wie die Packlisten (qrcode-Dependency, weisser Rahmen für Dark-Mode-Scanbarkeit, alt-Text mit Platzname); neue Schlüssel qrAlt/qrTitle/qrText im Namespace spotDetail in DE/FR/IT/EN
- [x] Theme-Option «Automatisch (System)»: dritte Design-Präferenz "auto" folgt prefers-color-scheme inkl. Live-Wechsel (matchMedia-Listener im ThemeProvider); Header-Toggle schaltet zyklisch hell → dunkel → auto (MonitorSmartphone-Icon, aria-Label je Zustand), Profil-Karte mit drittem Button; gespeicherte hell/dunkel-Werte bleiben gültig, Neu-Nutzer-Default bleibt hell («auto» ist Opt-in), kein Geräte-Sync (Theme war bisher nicht gesynct); reine Logik resolveTheme/isThemePreference in client/src/lib/themePreference.ts mit 4 Tests; neue Schlüssel shell.themeAuto und profile.themeAuto/themeSavedAuto in DE/FR/IT/EN
- [x] Trip-Countdown-Push: der Cron-Check (/api/push/check) meldet Push-Abonnent\*innen den am nächsten bevorstehenden geplanten Aufenthalt, sobald die Anreise 3 Tage entfernt ist («⛺ In 3 Tagen: <Ort/Titel>», bei verknüpfter Packliste mit «Packliste zu Y % erledigt» analog packing.progress); verpasst der Cron die 3-Tage-Schwelle, greift die Erinnerung auch noch 2 oder 1 Tag vorher – aber nur die erste erreichte Schwelle, Dedup über neues Feld lastTripKey «trip:<tripId>» (Migration 0021, max. eine Countdown-Nachricht pro Trip); Klick öffnet /tagebuch, eigener Notification-Tag; Push-Texte deutsch (Server kennt keine User-Sprache), Opt-in-Beschreibung bei den Zeltplätzen erwähnt den Countdown (DE/FR/IT/EN); buildTripAlert als reine Funktion mit 7 Tests (Schwellen 3/2/1, verpasster Cron, ohne/leere/unbekannte Packliste, nächster Trip zuerst, Dedup-Key)
- [x] Jahresrückblick im Reise-Tagebuch: neue Karte im Statistik-Bereich mit Jahr-Auswahl (Select über alle Jahre mit vergangenen Trips, Default = aktuellstes Jahr mit Daten, nur sichtbar wenn mindestens ein vergangener Trip existiert) und Kennzahl-Kacheln im Stil der bestehenden Statistik: Aufenthalte, Nächte gesamt, verschiedene Orte, Top-Platz (meiste Nächte, Trophy) und längster Aufenthalt am Stück (Ort + Nächte, Moon); reine Funktion computeYearReview in shared/trips.ts mit 4 Tests – bewusst einfach: ein Trip zählt komplett zum Jahr seines Startdatums, ein Silvester-Trip wird NICHT auf zwei Jahre aufgeteilt (im Test dokumentiert); neue trips-Schlüssel yearReview\* in DE/FR/IT/EN

## Erweiterungen (Nutzerwunsch 02.08.2026, Runde 9)

- [x] Passwort-Reset per E-Mail (SMTP): «Passwort vergessen?» verschickt einen Link `…/anmelden?reset=<token>` statt des bisherigen 6-stelligen In-Memory-Codes; Token = 32 Zufallsbytes (hex), in der DB nur der sha256-Hash (Tabelle passwordResetTokens, Migration 0020, Index userId + Unique tokenHash), 60 Min gültig, einmalig – beim Einlösen werden alle offenen Tokens des Kontos entwertet und die Person direkt angemeldet; auth.requestReset({email, lang}) meldet immer Erfolg (kein User-Enumeration-Leak), Rate-Limit 3/Stunde pro E-Mail+IP (allowAction in server/rateLimit.ts), ohne SMTP-Konfiguration saubere, im Client übersetzte Fehlermeldung; auth.performReset({token, newPassword}) ersetzt auth.resetPassword; Mail-Betreff/-Text als L4 in DE/FR/IT/EN (server/mailer.ts, nodemailer, Port 587 STARTTLS, mailConfigured/buildPasswordResetMail testbar); Link-Basis aus APP_URL (Fallback Request-Host bzw. campmesser.ch); Login-Seite: E-Mail-Formular mit neutraler Erfolgsmeldung, bei ?reset=<token> Formular «Neues Passwort setzen» (2× Eingabe, min. 8 Zeichen); env.hetzner.template + DEPLOYMENT-HETZNER.md (Hetzner-Postfach, APP_URL) ergänzt; 9 neue Tests (Token-Hashing/Ablauf, Mail-Texte, mailConfigured, allowAction)

- [x] Fotos im Reise-Tagebuch: pro Eintrag (vergangen und geplant) kleine Galerie mit Upload-Button (max. 12 Fotos, 5 MB), Thumbnails, Vollbild-Dialog mit Vor/Zurück-Navigation und Löschen mit Bestätigung; Bilder werden clientseitig per Canvas auf max. 1600 px verkleinert und als JPEG 0.85 hochgeladen (client/src/lib/imageResize.ts, reine Grössenlogik mit 6 Tests, entfernt nebenbei EXIF/GPS), serverseitig keine Transformation (kein sharp auf dem Webhosting); Ablage als Dateien unter uploads/trips/ (server/tripPhotoStorage.ts, kein S3, Verzeichnis in .gitignore und vom git-pull-Deploy unangetastet, Hinweis + Backup-Absatz in DEPLOYMENT-HETZNER.md, mkdir im Deploy-Skript); Tabelle tripPhotos (Migration 0019, Indizes userId/tripId, fileName unique); Upload als Raw-Body über POST /api/trips/:tripId/photos (gleiche Session-Prüfung wie tRPC, Besitz-Check, JPEG/PNG/WebP, HEIC wird mit eigener Meldung abgelehnt), private Auslieferung nur für Besitzer\*in über GET /api/trips/photos/:fileName (DB-Lookup, Cache private/max-age 1h); tRPC trips.photos.list/remove, beim Löschen eines Trips werden Fotos (DB + Dateien) mitgelöscht; neue trips-Schlüssel in DE/FR/IT/EN, alt-Texte und aria-Labels

- [x] OpenGraph-Vorschau für geteilte Links: der Server liefert für /liste/:token und /platz/:token bei bekanntem Teil-Token das SPA-HTML mit injizierten OG-/Twitter-Meta-Tags aus (og:title = Listen-/Platzname + «– CampMesser», og:description mit Eintragszahl bzw. Koordinaten, og:url/og:image absolut, twitter:card summary, Bild /icons/icon-512.png); Route vor dem SPA-Fallback in server/\_core/index.ts, HTML-Loader je Modus (Vite-Transform im Dev, dist-index.html in Produktion, vite.ts entsprechend aufgeteilt); Injektion per String-Replace vor </head>, Namen HTML-escaped (XSS); unbekannter Token oder DB-Fehler → normales SPA-HTML; reine Funktionen in server/\_core/og.ts mit 6 Tests
- [x] MHD-Push für die Kühlbox: der bestehende Cron-Check (/api/push/check) prüft zusätzlich die Kühlbox aller Push-Abonnent\*innen; läuft etwas heute oder morgen ab, kommt eine Push-Erinnerung («X Lebensmittel laufen bald ab: …», gekürzt auf 3 Namen + «und N weitere», Klick öffnet /kuehlbox); Dedup über neues Feld lastFoodKey «food:YYYY-MM-DD» (Migration 0018) – max. eine Erinnerung pro Tag und Abo, Unwetter-Dedup unverändert; eigener Notification-Tag im SW, damit sich Meldungen nicht ersetzen; Push-Texte deutsch (Server kennt keine User-Sprache); Opt-in-Beschreibung bei den Zeltplätzen erwähnt die MHD-Erinnerungen (DE/FR/IT/EN); buildFoodAlert als reine Funktion mit 5 Tests

- [x] Einkaufsliste (/einkauf): eigenes Modul mit abhakbarer Liste (offen oben, erledigt durchgestrichen unten), Schnell-Eingabe, «Erledigte entfernen» und «Liste leeren»; Tabelle shoppingItems (Migration 0016), tRPC-Router shopping (list/add/addMany/toggle/remove/removeChecked/clear); Rezept-Detail übernimmt Zutaten in der aktiven Sprache per Button auf die Liste (Toast mit Direktlink); Modul-Kachel + Namespace shopping in DE/FR/IT/EN
- [x] Wetter: UV-Index & Pollenflug – heutiger Max-UV (uv_index_max aus dem bestehenden Forecast-Abruf) mit WHO-Stufe als Farb-Badge und Schutzhinweis ab «hoch» (describeUvIndex/uvLevelForIndex in shared/weather.ts, L4, 4 Tests); Abschnitt «Pollenflug» über die Open-Meteo Air-Quality-API (6 Arten: Erle, Birke, Gräser, Beifuss, Olive, Ambrosia) mit Stufen-Badges pro Art (pollenLevel/parsePollenResponse in shared/pollen.ts, 8 Tests), eigenem Lade-/Fehler-/«keine Daten»-Zustand (Air-Quality-Ausfall bricht das Wetter nicht); neue weather-Schlüssel in DE/FR/IT/EN
- [x] Menüplan pro Trip (/menueplan/:tripId): Tage des Aufenthalts als Raster mit 4 Mahlzeiten-Slots (Morgen-/Mittag-/Abendessen, Znüni/Zvieri); pro Slot Rezept aus dem Rezeptbuch (statisch oder eigenes, Dialog mit Suche) oder Freitext, Slot leeren, Upsert pro Tag+Mahlzeit; Tabelle menuEntries (Migration 0017, Unique-Index trip/day/meal), Router menu (listByTrip/set/remove); Einstieg über «Menüplan»-Button bei geplanten Aufenthalten; Button «Zutaten der geplanten Rezepte auf die Einkaufsliste» (Duplikate zusammengefasst, aktive Sprache); reine Logik in shared/menuPlan.ts (tripDays/mergeIngredientLines, 10 Tests); Namespace menuPlan in DE/FR/IT/EN
- [x] PWA-Onboarding / Install-Hinweis: dezenter, abweisbarer Banner über der Bottom-Nav (client/src/components/InstallPrompt.tsx, im AppShell eingebunden), erscheint nur wenn nicht installiert (display-mode: standalone + navigator.standalone), nie abgewiesen (localStorage campmesser.installPromptDismissed) und erst ab dem 2. Besuch (Besuchszähler campmesser.installVisitCount) oder nach ~30 s Nutzung; Android/Desktop-Chrome: beforeinstallprompt wird früh auf Modul-Ebene abgefangen (Mini-Infobar unterdrückt), «Installieren»-Button ruft prompt() auf – danach nie wieder zeigen (auch bei appinstalled); iOS Safari (UserAgent + navigator.standalone-Eigenschaft, CriOS/FxiOS ausgenommen): Kurzanleitung «Teilen-Symbol → Zum Home-Bildschirm» mit lucide-Share-Icon; X-Button merkt sich die Entscheidung dauerhaft; role=region + aria-Labels, kein Fokus-Klau; reine Entscheidungslogik shouldShowInstallPrompt/detectIosSafari in client/src/lib/installPrompt.ts mit 11 Tests (server/installPrompt.test.ts); Namespace install in DE/FR/IT/EN
- [x] Gesamt-Verifikation Runde 9: prettier --check sauber, pnpm check fehlerfrei, 240 Vitest-Tests grün (1 skip), Produktions-Build ok, alle 7 Playwright-Tests grün (Smoke + axe-A11y, keine neuen Verstösse durch Install-Banner, Wetter-UV/Pollen oder Tagebuch-Fotos)

## Erweiterungen (Nutzerwunsch 02.08.2026, Runde 8)

- [x] Trip-Planer: Tagebuch-Einträge mit Zukunfts-Datum als «Geplante Aufenthalte» mit Countdown, optionaler Packlisten-Verknüpfung (packListId, Migration 0012) und Pack-Fortschritt; Startseiten-Widget «Nächster Trip»
- [x] Platz-Dossier per Link teilen: Teil-Token an campSpots (Migration 0013), öffentliche Seite /platz/:token mit Sonnenzeiten und 3-Tage-Wetter, Teilen-Karte im Dossier
- [x] Eigene Rezepte: Editor im Rezeptbuch (Tabelle customRecipes, Migration 0014), Anzeige mit Badge «Eigenes», Kühlbox-Vorschläge berücksichtigen eigene Rezepte
- [x] Wetter: 48-h-Niederschlagsgrafik (Menge + Wahrscheinlichkeit, zwei Achsen)
- [x] Unwetter-Push: Web Push (VAPID) für gespeicherte Zeltplätze – Opt-in bei den Favoriten, Tabelle pushSubscriptions (Migration 0015), Check-Endpoint /api/push/check für konsoleH-Cron, SW-Push-Handler; Doku in DEPLOYMENT-HETZNER.md
- [x] Accessibility: 3 axe-core-Checks (WCAG 2A/2AA) in der CI; gefundene Verstösse behoben (Zoom-Sperre entfernt, Kontrast Erste-Hilfe-Badge)
- [x] Mehrsprachigkeit DE/FR/IT/EN – komplett: Infrastruktur (shared/i18n.ts, LanguageProvider mit Sync, Sprachwahl im Header), alle Seiten über typgeprüfte Wörterbücher de/fr/it/en, alle Inhalts-Daten als L4, shared-Funktionen mit lang-Parameter, Datums-/Zahlformate via LOCALE_TAGS; Wörterbuch-Strukturtest in server/i18n.test.ts

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
