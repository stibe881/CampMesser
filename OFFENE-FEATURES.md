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
- [ ] **Google-Maps-Schlüssel in die Server-`.env`**, damit die Fahrzeiten die
      Verkehrslage kennen – siehe `EINRICHTUNG-OFFEN.md`, Punkt 7. Ohne
      Schlüssel rechnet die App weiter mit der Fahrzeit von OpenStreetMap;
      es fehlt nur der Stau.
- [ ] **Google-Maps-Karte: zweiter Schlüssel + Karten-Id** in die
      Server-`.env` – siehe `EINRICHTUNG-OFFEN.md`, Punkt 7b. NICHT
      derselbe Schlüssel wie für die Fahrzeiten: Dieser hier geht in den
      Browser und muss auf die Website eingeschränkt werden.
- [ ] **12 Rezeptbilder.** Für die 12 später ergänzten Rezepte fehlt ein Foto.
      Die Prompts liegen bereit (im Chat geschickt); erzeugte Bilder in
      beliebigem Format schicken, sie werden auf 800×600 WebP gebracht und
      eingebunden.

---

## Runde 29 – alle Punkte erledigt

Runde 29 ist abgearbeitet (#293 bis #298). Die nächste Runde beginnt
leer – Vorschläge kommen, wenn du sie willst.

---

## Nicht mehr vorschlagen (Entscheid des Nutzers)

Notfall-Profil im SOS · Abreise-Checkliste · Gasvorrats-Rechner ·
Daten-Export im Profil
