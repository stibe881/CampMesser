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

## 5. Web-Push (Unwetter, MHD, Trip-Countdown)

Falls noch nicht geschehen (Details in `DEPLOYMENT-HETZNER.md`):

1. VAPID-Schlüssel erzeugen: `pnpm exec web-push generate-vapid-keys`
2. In der `.env`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT=mailto:stefan.gross@stibe.me`, `CRON_SECRET=<zufällig>`
3. konsoleH-Cronjob (stündlich oder alle 30 min):
   ```
   curl -fsS "https://campmesser.ch/api/push/check?secret=<CRON_SECRET>" >/dev/null
   ```

## 6. Merge nach `main`

Der Feature-Branch `claude/projekt-laden-eb1rox` enthält alle neuen Runden
(Mehrsprachigkeit, Runde 9 + 10) und ist getestet. Sobald du bereit bist,
im Chat einfach **«merge»** schreiben – dann führe ich den Merge nach `main`
aus, was (bei eingerichteten Secrets aus Punkt 2) direkt das Auto-Deploy
anstösst. Beim ersten Deployment danach laufen die Migrationen 0016–0021
automatisch; vorher ein Backup (Punkt 1) ziehen.
