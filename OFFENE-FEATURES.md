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

## Runde 29 – 11 Punkte

### Reise-Planung

### Küche & Vorrat

- [ ] **Wocheneinkauf aus dem Menüplan** (#288) – Zutaten aller Tage
      zusammengefasst und mengengerecht
- [ ] **Znüni- & Lunchbox-Planer** (#289) – was kommt für den Ausflug in den
      Rucksack

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
