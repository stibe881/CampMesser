# Offene Features

Was noch gebaut wird, in der Reihenfolge der Abarbeitung. Fertige Features
stehen mit ihren technischen Entscheiden in `todo.md`; hier steht nur, was
noch aussteht.

Stand: 4. August 2026

---

## Bei dir – Voraussetzungen, damit Neues live geht

- [ ] **Deploy klemmt seit 3.8.2026, 22:20 Uhr.** Der Hetzner-Server weist den
      Deploy-Schlüssel ab («Permission denied (publickey)»). Bis 22:19 Uhr lief
      derselbe Schlüssel sauber – auf dem Server `~/.ssh/authorized_keys`
      prüfen (Rechte: `~/.ssh` = 700, `authorized_keys` = 600). Der öffentliche
      Schlüssel ist das Gegenstück zum GitHub-Secret `HETZNER_SSH_KEY`, siehe
      `DEPLOYMENT-HETZNER.md`.
- [ ] **Supabase-Werte in die Server-`.env`**, damit die Ausflüge aus der
      Ausflugfinder-App erscheinen – siehe `EINRICHTUNG-OFFEN.md`, Punkt 6.
- [ ] **12 Rezeptbilder.** Für die 12 später ergänzten Rezepte fehlt ein Foto.
      Die Prompts liegen bereit (im Chat geschickt); erzeugte Bilder in
      beliebigem Format schicken, sie werden auf 800×600 WebP gebracht und
      eingebunden.

---

## Runde 27 – 16 Punkte

### Geld

- [ ] **Reise-Budget mit Limite** (#256) – Warnung, wenn die Reisekasse das
      Budget sprengt
- [ ] **Ausgaben-Statistik über alle Reisen** (#257) – Kosten pro Jahr,
      Ø pro Nacht, teuerste Kategorie
- [ ] **Reisekasse als CSV exportieren** (#258) – für die Abrechnung daheim
- [ ] **Fahrtkosten automatisch** (#259) – Kilometer × Verbrauch × Spritpreis
      als Reisekasse-Eintrag

### Gesundheit & Sicherheit

- [ ] **Sonnencreme-Erinnerung** (#260) – Push zum Nachcremen nach UV-Index
- [ ] **Trink-Erinnerung an Hitzetagen** (#261) – aus Wetter und
      Trinkwasser-Rechner
- [ ] **Stechmücken-Index** (#262) – wetterbasiert: Wärme, Feuchte, Windstille
- [ ] **Feuerverbots-Übersicht nach Kanton** (#263) – Ergänzung zur
      Waldbrandgefahr

### Wissen

- [ ] **Wolken-Lexikon mit Wetterdeutung** (#264) – Wolkenart erkennen und
      wissen, was kommt
- [ ] **Zeltpflege-Ratgeber** (#265) – imprägnieren, flicken, Reissverschluss,
      Schimmel
- [ ] **Reparatur-Ratgeber Ausrüstung** (#266) – Matte flicken, Gestänge
      schienen, Kocher warten

### Familie & Abend

- [ ] **GPS-Schatzsuche** (#267) – Wegpunkte verstecken und suchen
- [ ] **Erzählwürfel** (#268) – Bilder würfeln und daraus Geschichten erfinden
- [ ] **Lagerfeuer-Liederbuch** (#269) – Texte und Akkorde, Rotlicht-tauglich
- [ ] **Ämtli-Plan im Camp** (#270) – Aufgaben verteilen, Kinder sammeln Punkte

---

## Runde 28 – 10 Punkte

### Karte & Wetter

- [ ] **Einkaufen in Platznähe** (#273) – Supermarkt, Bäckerei, Hofladen mit
      Öffnungszeiten aus OSM
- [ ] **Gewitter-Entfernung messen** (#274) – Blitz-Donner-Zähler mit Distanz
      und Trend «kommt näher»
- [ ] **Unwetter auf der Fahrtstrecke** (#275) – Warnungen entlang der Anreise,
      nicht nur am Ziel

### Ordnung

- [ ] **Packvorschlag aus vergangenen Reisen** (#277) – «letztes Mal am selben
      Platz dabei gehabt»

### Platz-Wissen

- [ ] **Eigene Platz-Bewertung** (#278) – Sanitär, Ruhe, Schatten,
      Kinderfreundlichkeit einzeln bewerten und vergleichen
- [ ] **Reservation ablegen** (#279) – Buchungsbestätigung als Foto oder PDF an
      der Reise, offline abrufbar

### Wandern

- [ ] **Höhenprofil im Track-Detail** (#280) – Diagramm zur aufgezeichneten
      Wanderung mit Zwischenzeiten
- [ ] **Route vorher zeichnen** (#281) – Wegpunkte setzen, Länge, Höhenmeter
      und Gehzeit schätzen
- [ ] **Wanderung per Link teilen** (#282) – Track für Mitreisende, im
      bestehenden Teil-Muster
- [ ] **Auto-Standort merken** (#283) – wo steht das Fahrzeug, mit
      Kompass-Peilung zurück

---

## Runde 29 – 15 Punkte

### Reise-Planung

- [ ] **Reise-Vorlagen** (#284) – «Wochenende», «Sommerferien» als Muster mit
      Packliste, Menüplan und Dauer
- [ ] **Beste Abfahrtszeit** (#285) – aus Check-in-Zeit und Fahrzeit rückwärts,
      mit Pausen für Kinder
- [ ] **Rückreise-Planung** (#286) – wann losfahren, um zur Wunschzeit daheim zu
      sein

### Küche & Vorrat

- [ ] **Wocheneinkauf aus dem Menüplan** (#288) – Zutaten aller Tage
      zusammengefasst und mengengerecht
- [ ] **Znüni- & Lunchbox-Planer** (#289) – was kommt für den Ausflug in den
      Rucksack
- [ ] **Feuerholz-Bedarf schätzen** (#287) – wie viel für wie viele Abende, je
      nach Feuerart

### Familie

- [ ] **Regentag-Ideen** (#290) – Beschäftigungen fürs Zelt und Vorzelt, nach
      Alter und Dauer
- [ ] **Notfall-Übung für Kinder** (#291) – spielerisch üben: was tun, wenn ich
      den Platz nicht mehr finde
- [ ] **Kinder-Reisepass** (#292) – Stempel sammeln für jeden besuchten Platz

### Natur

- [ ] **Bestimmungsschlüssel für Bäume** (#293) – Frage für Frage zur Art
- [ ] **Sternschnuppen-Protokoll** (#294) – Beobachtungsnacht mitzählen, Zeit
      und Richtung festhalten

### Konto & Daten

- [ ] **Papierkorb** (#295) – Gelöschtes 30 Tage lang wiederherstellen
- [ ] **Änderungsverlauf pro Reise** (#296) – wer hat wann was geändert, bei
      gemeinsamen Reisen

### Bedienung

- [ ] **Schnellzugriff-Leiste frei belegen** (#297) – die Knöpfe unten selbst
      bestimmen
- [ ] **«Heute»-Ansicht** (#298) – während einer laufenden Reise startet die App
      mit Wetter, Mahlzeiten und Aufgaben statt mit den Kacheln

---

## Nicht mehr vorschlagen (Entscheid des Nutzers)

Notfall-Profil im SOS · Abreise-Checkliste · Gasvorrats-Rechner ·
Daten-Export im Profil
