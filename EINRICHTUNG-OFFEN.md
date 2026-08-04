# Offene Einrichtungsschritte (Checkliste)

Diese Datei fasst alle manuellen Schritte zusammen, die noch auf dem Server
bzw. bei GitHub zu erledigen sind. Details stehen jeweils in
`DEPLOYMENT-HETZNER.md`. Nach Erledigung: Haken setzen oder Datei löschen.

## 1. Datenbank-Backup einrichten

1. Per SSH auf dem Hetzner-Webspace einloggen und einmalig testen:
   ```bash
   bash ~/campmesser/scripts/backup-db.sh
   ```
   Das Skript legt einen komprimierten Dump unter `~/backups/` ab und
   behält die letzten 14 Stände.
2. In **konsoleH → Cronjobs** einen täglichen Job anlegen (z. B. 03:30):
   ```
   bash /home/<benutzer>/campmesser/scripts/backup-db.sh
   ```
3. **Neu:** Das Verzeichnis `~/campmesser/uploads/` (Trip-Fotos) wird vom
   Datenbank-Dump NICHT abgedeckt – regelmässig per SFTP/tar mitsichern.

## 2. GitHub-Secrets für das Auto-Deploy

Das Workflow-File `.github/workflows/deploy.yml` deployt bei jedem Push auf
`main` automatisch – aber nur, wenn diese Secrets existieren
(GitHub → Repo **stibe881/CampMesser** → Settings → Secrets and variables →
Actions → «New repository secret»):

| Secret            | Wert                                                     |
| ----------------- | -------------------------------------------------------- |
| `HETZNER_HOST`    | SSH-Host des Webspace (z. B. `wpXXX.webhosting.systems`) |
| `HETZNER_USER`    | SSH-Benutzername                                         |
| `HETZNER_SSH_KEY` | privater SSH-Schlüssel (kompletter Inhalt, PEM/OpenSSH)  |

Schlüsselpaar erzeugen (falls noch keines existiert):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/campmesser-deploy -C "deploy@campmesser"
# Public Key auf dem Server eintragen:
ssh-copy-id -i ~/.ssh/campmesser-deploy.pub <user>@<host>
# Privater Schlüssel (Inhalt von ~/.ssh/campmesser-deploy) → Secret HETZNER_SSH_KEY
```

## 3. Uptime-Überwachung

Einen kostenlosen Uptime-Dienst (z. B. UptimeRobot, Better Stack) auf

```
https://campmesser.ch/api/health
```

zeigen lassen (HTTP-Check, erwartet Status 200; bei DB-Problemen liefert der
Endpoint 503 und der Dienst alarmiert per E-Mail/Push). Intervall 5 Minuten
reicht.

## 6. Ausflugfinder-Anbindung (Ausflüge auf Karte und im Platz-Dossier)

CampMesser zeigt die Ausflugsziele aus deiner eigenen **Ausflugfinder**-App –
als eigene Pin-Ebene «Ausflüge» auf der Karte und als Abschnitt «Ausflüge in
der Nähe» im Platz-Dossier. Der Abruf läuft **ausschliesslich serverseitig**
(tRPC-Router `excursions`, Zwischenspeicher 12 Minuten): Der Zugriffsschlüssel
steht in der `.env` auf dem Server und landet **nie im Browser-Bundle**.

Dafür in der Server-`.env` ergänzen (Vorlage: `env.hetzner.template`):

```ini
AUSFLUGFINDER_SUPABASE_URL=https://iopejcjkmuievlaclecn.supabase.co
AUSFLUGFINDER_SUPABASE_ANON_KEY=<anon public key aus dem Supabase-Dashboard>
```

Den Schlüssel findest du im **Supabase-Dashboard → Project Settings → API**
unter «Project API keys» → `anon` `public`. Er steht bewusst **nirgends im
Repository** – bitte direkt auf dem Server eintragen und die `.env` weiterhin
mit `chmod 600` schützen. Danach Passenger neu starten
(`touch ~/campmesser/tmp/restart.txt`).

Zur Kontrolle: Nach dem Neustart erscheint auf `/karte` der Ebenen-Chip
«Ausflüge»; ohne die beiden Werte bleibt der ganze Bereich unsichtbar (kein
Fehlerzustand, keine leere Liste).

Angezeigt werden **alle** Einträge der Tabelle `ausfluege` – bewusst ohne
Filter auf `status`. Die Texte der Ausflüge sind deine eigenen Daten und
erscheinen unverändert auf Deutsch; übersetzt sind nur die Beschriftungen
rundherum.

Für die lokale Entwicklung dieselben zwei Zeilen in eine `.env` im
Projektverzeichnis legen (`dotenv` liest sie beim Start).

## 7. Fahrzeiten mit Verkehr (Google Maps)

Fahrzeiten kommen neu aus der **Google Routes API** – dort, und nur dort, ist
die Verkehrslage der Mehrwert gegenüber OpenStreetMap. Alle Wege, Strecken und
Karten-Linien bleiben bei OSM/OSRM (siehe unten, «Warum nur die Zeit»).

**Was du tun musst:**

1. In der [Google Cloud Console](https://console.cloud.google.com/) ein
   Projekt anlegen (oder ein bestehendes nehmen) und ein
   **Abrechnungskonto** hinterlegen – ohne das antwortet die API nicht,
   auch nicht im kostenlosen Kontingent.
2. Unter **APIs & Services → Library** die **Routes API** aktivieren.
   NICHT die alte Directions API – die ist abgelöst.
3. Unter **Credentials** einen API-Schlüssel erzeugen und ihn einschränken:
   unter «API restrictions» auf die **Routes API** begrenzen. Eine
   Referrer-Sperre ist NICHT nötig und hier auch falsch – der Schlüssel wird
   ausschliesslich vom Server benutzt, nie vom Browser. Wenn du magst, eine
   IP-Beschränkung auf die Hetzner-Adresse setzen.
4. Den Schlüssel in die Server-`.env` legen:

```
GOOGLE_MAPS_API_KEY=<API-Schlüssel aus der Google Cloud Console>
```

5. Passenger neu starten (`touch ~/campmesser/tmp/restart.txt`).

Der Schlüssel steht **nirgends im Repository** und kommt auch nicht ins
Browser-Bundle – der Abruf läuft nur serverseitig (`server/driveTime.ts`).
Die `.env` weiterhin mit `chmod 600` schützen.

**Zur Kontrolle:** Im Platz-Dossier unter «Beste Abfahrtszeit» steht in der
Fussnote neu «Verkehrs-Prognose von Google». Ohne Schlüssel steht dort wie
bisher «Routenberechnung über die Strasse (OpenStreetMap)» – kein
Fehlerzustand, nur die Fahrzeit ohne Verkehr.

**Kosten:** Pro Aufruf wird eine Route abgerechnet. Der Abruf erfolgt nur auf
Anforderung (Abschnitt aufklappen), wird zehn Minuten zwischengespeichert und
holt bewusst nur zwei Felder (Dauer und Strecke). Bei deiner Nutzung sollte
das im kostenlosen Monatskontingent bleiben; ein Ausgabenlimit in der Cloud
Console ist trotzdem eine gute Idee.

**Warum nur die Zeit und nicht auch die Karte:** Die Nutzungsbedingungen von
Google untersagen es, ihre Inhalte zusammen mit einer fremden Karte zu
zeigen. CampMesser zeichnet auf Leaflet mit OpenStreetMap-Kacheln – eine von
Google berechnete Linie gehörte dort nicht hin. Für Wanderwege ist OSM ohnehin
die bessere Quelle: Das Schweizer Wanderwegnetz ist dort samt SAC-Skala
erfasst, während Google viele dieser Pfade gar nicht kennt.

## 7b. Google-Maps-Karte (zweiter Schlüssel!)

Die Karten der App sollen Google Maps zeigen. Dafür braucht es **einen
zweiten Schlüssel** – nicht denselben wie für die Fahrzeiten. Der Grund ist
wichtig: Der Fahrzeiten-Schlüssel (Punkt 7) wird nur vom Server benutzt und
verlässt ihn nie. Der Karten-Schlüssel MUSS dagegen in den Browser, sonst
lädt keine Google-Karte. Er ist deshalb kein Geheimnis, sondern wird über
die **Herkunfts-Sperre** geschützt.

**Was du tun musst:**

1. In der Google Cloud Console (dasselbe Projekt wie in Punkt 7) unter
   **APIs & Services → Library** die **Maps JavaScript API** aktivieren.
2. Unter **Credentials** einen **zweiten** API-Schlüssel erzeugen. Diesen
   einschränken auf:
   - **Application restrictions → Websites**: `https://campmesser.ch/*`
     (und, falls du lokal entwickelst, `http://localhost:*/*`)
   - **API restrictions**: nur **Maps JavaScript API**
3. Unter **Google Maps Platform → Map Management** eine **Karten-Id**
   (Map ID) anlegen, Kartentyp «JavaScript». Ohne sie gibt es keine
   HTML-Pins, und die App bleibt bei OpenStreetMap.
4. Beides in die Server-`.env`:

```
GOOGLE_MAPS_BROWSER_KEY=<zweiter Schlüssel, auf die Website eingeschränkt>
GOOGLE_MAPS_MAP_ID=<Karten-Id aus Map Management>
```

5. Passenger neu starten (`touch ~/campmesser/tmp/restart.txt`).

**Kosten:** Die Maps JavaScript API rechnet pro **Kartenaufruf** ab – jedes
Öffnen einer Karte zählt. Bei deiner Nutzung sollte das im kostenlosen
Monatskontingent bleiben; ein Ausgabenlimit ist trotzdem sinnvoll.

**Was mit OpenStreetMap bleibt, und warum:**

- **Offline-Pakete (#217).** Sie speichern Kartenkacheln für einen Platz.
  Google-Kacheln darf man nicht speichern – ohne Netz zeichnet deshalb
  weiterhin OpenStreetMap.
- **Das Regenradar.** Es blendet zehn Radarbilder überblendend ineinander;
  das geht mit Kachel-Ebenen, wie Leaflet sie bietet, und mit Googles
  Auflagen nicht gleich gut. Die Karte darunter ist dort nur Hintergrund.
- **Kein Schlüssel eingerichtet.** Dann bleibt alles, wie es ist.

## 8. Merge nach `main`

Der Feature-Branch `claude/projekt-laden-eb1rox` enthält alle neuen Runden
(Mehrsprachigkeit, Runde 9 + 10) und ist getestet. Sobald du bereit bist,
im Chat einfach **«merge»** schreiben – dann führe ich den Merge nach `main`
aus, was (bei eingerichteten Secrets aus Punkt 2) direkt das Auto-Deploy
anstösst. Beim ersten Deployment danach laufen die Migrationen 0016–0021
automatisch; vorher ein Backup (Punkt 1) ziehen.
