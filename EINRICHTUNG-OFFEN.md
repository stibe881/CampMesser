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

## 4. SMTP + APP_URL in der Server-`.env` (Passwort-Reset-Mails)

In konsoleH ein Postfach anlegen (z. B. `no-reply@campmesser.ch`) und in der
`.env` auf dem Server ergänzen (Vorlage: `env.hetzner.template`):

```ini
SMTP_HOST=mail.your-server.de     # Hetzner-Mailserver laut konsoleH
SMTP_PORT=587                     # STARTTLS
SMTP_USER=no-reply@campmesser.ch
SMTP_PASS=<Postfach-Passwort>
SMTP_FROM=no-reply@campmesser.ch
APP_URL=https://campmesser.ch
```

Danach Passenger neu starten (`touch ~/campmesser/tmp/restart.txt`).
Ohne diese Werte meldet «Passwort vergessen?» sauber, dass der Versand
derzeit nicht verfügbar ist – die App läuft trotzdem.


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

## 7. Merge nach `main`

Der Feature-Branch `claude/projekt-laden-eb1rox` enthält alle neuen Runden
(Mehrsprachigkeit, Runde 9 + 10) und ist getestet. Sobald du bereit bist,
im Chat einfach **«merge»** schreiben – dann führe ich den Merge nach `main`
aus, was (bei eingerichteten Secrets aus Punkt 2) direkt das Auto-Deploy
anstösst. Beim ersten Deployment danach laufen die Migrationen 0016–0021
automatisch; vorher ein Backup (Punkt 1) ziehen.
