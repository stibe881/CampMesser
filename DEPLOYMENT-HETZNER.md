# CampMesser auf Hetzner Webhosting einrichten

Diese Anleitung führt Schritt für Schritt durch die Installation von **CampMesser** auf einem Hetzner-Webhosting-Paket mit Node.js. Sie ist konkret auf die Domain **campmesser.ch** und die Datenbank **camping** zugeschnitten, sodass sich alle Werte direkt übernehmen lassen.

Die Anwendung besteht aus einem Node-Server, der sowohl die Weboberfläche als auch die Programmschnittstelle ausliefert, sowie einer MySQL-Datenbank. Sämtliche Bilder sind fest in die Anwendung eingebaut, sodass keine externen Dienste benötigt werden.

> **Wichtig – aus der Praxis gelernt:** Node.js wirkt bei Hetzner auf die **gesamte Domain**, nicht nur auf eine einzelne Subdomain. Ein erster Versuch mit `camping.gross-ict.ch` hat die komplette Website unter `gross-ict.ch` lahmgelegt (503 Service Unavailable), bis Node.js wieder deaktiviert wurde. Deshalb wird CampMesser jetzt unter der eigenständigen Domain **campmesser.ch** betrieben, wo keine andere Website betroffen ist [1].

## Übersicht der benötigten Angaben

| Angabe                         | Wert                                     |
| ------------------------------ | ---------------------------------------- |
| Domain                         | `campmesser.ch`                          |
| Datenbank                      | `camping` auf `ly8y.your-database.de`    |
| Datenbank-Benutzer             | `jqviwy_0`                               |
| Node.js-Version                | 24                                       |
| Zielverzeichnis auf dem Server | `~/campmesser` (ausserhalb des Webspace) |

## Schritt 1: Code auf den Server laden

Das Projekt liegt bereits unter `~/campmesser` in deinem Heimatverzeichnis. Das ist die richtige Stelle: Läge es innerhalb von `public_html`, würde Apache den Quellcode als Dateien ausliefern – ein Sicherheitsrisiko, das bei einem früheren Versuch tatsächlich aufgetreten ist.

Ist das Verzeichnis noch nicht vorhanden, lege es so an:

```bash
cd ~
git clone https://github.com/stibe881/CampMesser.git campmesser
cd campmesser
```

Ist es bereits vorhanden, hole nur den neuesten Stand mit `cd ~/campmesser && git pull`.

## Schritt 2: Node-Version festlegen und Anwendung bauen

Hetzner liest die gewünschte Node-Version aus einer Datei im Heimatverzeichnis [1]. Danach installierst du die Pakete und erzeugst den Produktions-Build, der die Serverdatei `dist/index.js` und die fertige Oberfläche unter `dist/public` enthält.

```bash
echo 24 > ~/.nodeversion
cd ~/campmesser
npm install -g pnpm
pnpm install
pnpm build
```

Der Build dauert einige Minuten. Bricht er wegen Arbeitsspeichers ab, hilft in der Regel der Aufruf `NODE_OPTIONS=--max-old-space-size=1024 pnpm build`.

## Schritt 3: Konfigurationsdatei anlegen

Die Zugangsdaten legst du in einer Datei `.env` im Projektverzeichnis ab. Das Datenbank-Passwort enthält Sonderzeichen und muss deshalb kodiert in der Verbindungszeichenfolge stehen; die untenstehende Zeile enthält bereits die korrekt kodierte Fassung.

Erzeuge zunächst ein zufälliges Sitzungsgeheimnis und notiere dir die Ausgabe:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Lege anschliessend die Datei an und setze die Ausgabe bei `JWT_SECRET` ein:

```bash
cd ~/campmesser
nano .env
```

Inhalt der Datei:

```
NODE_ENV=production
DATABASE_URL=mysql://jqviwy_0:k8%2CCt%3D%26*%2F28%24@ly8y.your-database.de:3306/camping
JWT_SECRET=HIER_DAS_ERZEUGTE_GEHEIMNIS_EINSETZEN
```

Schütze die Datei anschliessend vor fremdem Zugriff:

```bash
chmod 600 ~/campmesser/.env
```

Zur Erläuterung der Kodierung: Aus dem Passwort `k8,Ct=&*/28$` wird `k8%2CCt%3D%26*%2F28%24`, weil Komma, Gleichheitszeichen, kaufmännisches Und, Schrägstrich und Dollarzeichen in einer Verbindungsadresse eine Sonderbedeutung haben. Änderst du das Passwort später, müssen die neuen Sonderzeichen ebenfalls kodiert werden.

## Schritt 4: Datenbankstruktur anlegen

Die Tabellen werden aus den mitgelieferten Migrationsdateien erzeugt:

```bash
cd ~/campmesser
pnpm drizzle-kit migrate
```

Wurde die Migration bereits einmal erfolgreich ausgeführt, meldet der Befehl schlicht, dass nichts zu tun ist.

Sollte der Befehl in der Hosting-Umgebung nicht durchlaufen, spiele ersatzweise die Dateien `drizzle/0000_*.sql` bis `drizzle/0006_*.sql` in aufsteigender Reihenfolge über phpMyAdmin in konsoleH ein. Die Markierungen `--> statement-breakpoint` trennen dabei die einzelnen Anweisungen und gehören nicht mit in die Eingabe.

## Schritt 5: Node.js in konsoleH konfigurieren

Öffne in konsoleH die Domain `campmesser.ch` – **nicht** `gross-ict.ch` – und dort links **Einstellungen → Node.js Konfiguration**. Trage die folgenden Werte in das Formular ein:

| Feld im Formular             | Einzutragender Wert |
| ---------------------------- | ------------------- |
| Skript-Pfad                  | `app.js`            |
| Arbeitsverzeichnis           | `campmesser`        |
| Name der Log-Datei           | `campmesser.log`    |
| Arbeitsspeicher-Beschränkung | `512`               |
| Version                      | `24`                |
| Skript Parameter             | leer lassen         |

Die Datei `app.js` liegt bereits im Projekt. Sie liest deine `.env`-Datei ein und startet anschliessend den gebauten Server – genau in dem Format, das Hetzner erwartet. Das Arbeitsverzeichnis wird relativ zum Heimatverzeichnis angegeben, der Skript-Pfad wiederum relativ zum Arbeitsverzeichnis. Die Log-Datei landet direkt im Heimatverzeichnis.

Lehnt konsoleH das Speichern mit «Skript konnte nicht gefunden werden» ab, prüfe zuerst per SSH, ob die Datei existiert: `ls -la ~/campmesser/app.js`. Hilft das nicht, trage im Feld Arbeitsverzeichnis den vollständigen Pfad `/usr/home/jqviwy/campmesser` ein.

### Umgebungsvariablen im Formular

Im Abschnitt **Umgebungsvariablen** trägst du zusätzlich die folgenden Schlüssel-Wert-Paare ein und bestätigst jedes einzeln mit **Hinzufügen**. Sie haben Vorrang vor der `.env`-Datei und stellen sicher, dass die Anwendung auch dann korrekt startet, wenn die Datei einmal fehlt.

| Schlüssel      | Wert                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| `NODE_ENV`     | `production`                                                                 |
| `DATABASE_URL` | `mysql://jqviwy_0:k8%2CCt%3D%26*%2F28%24@ly8y.your-database.de:3306/camping` |
| `JWT_SECRET`   | dasselbe Geheimnis wie in der `.env`-Datei                                   |

Klicke danach auf **Aktivieren**. Rufst du nun `https://camping.gross-ict.ch` im Browser auf, sollte die Startseite von CampMesser erscheinen.

### Wenn die Seite nicht erscheint

Die Anwendung schreibt ihre Meldungen in die Datei `campmesser.log` in deinem Heimatverzeichnis. Ein Blick hinein zeigt in fast allen Fällen die Ursache:

```bash
tail -50 ~/campmesser.log
```

Meldet das Protokoll einen Portkonflikt, ergänze im Formular eine weitere Umgebungsvariable `PORT` mit der Portnummer, die Hetzner deinem Account zugewiesen hat. Ohne Vorgabe verwendet die Anwendung Port 3000 und weicht bei Belegung selbstständig auf den nächsten freien Port aus.

## Schritt 6: E-Mail-Versand für vergessene Passwörter

Damit Rücksetz-Codes per E-Mail zugestellt werden, hinterlege die Zugangsdaten eines Postfachs deiner Domain. Ohne diese Angaben funktioniert die Anmeldung normal weiter; der Code wird dann lediglich ins Protokoll geschrieben.

| Schlüssel   | Beispielwert            |
| ----------- | ----------------------- |
| `SMTP_HOST` | `mail.campmesser.ch`    |
| `SMTP_PORT` | `587`                   |
| `SMTP_USER` | Postfachname            |
| `SMTP_PASS` | Postfach-Passwort       |
| `SMTP_FROM` | `noreply@campmesser.ch` |

Diese Werte kannst du wahlweise in die `.env`-Datei schreiben oder als Umgebungsvariablen im konsoleH-Formular ergänzen.

## Schritt 7: Funktionsprüfung

Prüfe nach dem Start, ob die Startseite mitsamt Hintergrundbild lädt, ob sich ein Testkonto registrieren lässt und ob eine angelegte Packliste nach dem Neuladen erhalten bleibt. Der letzte Punkt bestätigt, dass die Datenbankverbindung steht. Öffne zusätzlich ein Wissens-Modul wie das Rezeptbuch, um die Bildauslieferung zu kontrollieren.

## Aktualisierungen einspielen

Neue Versionen holst du dir mit dem beiliegenden Skript. Anschliessend schaltest du die Anwendung in konsoleH einmal aus und wieder ein, damit der neue Stand geladen wird.

```bash
bash ~/campmesser/scripts/deploy-hetzner.sh
```

## Automatisches Deployment (GitHub Actions)

Jeder Push auf `main` kann die Live-Seite automatisch aktualisieren: Der Workflow `.github/workflows/deploy.yml` prüft erst TypeScript, Tests und Build und führt dann per SSH das Deploy-Skript auf dem Server aus. Das Skript berührt am Ende `tmp/restart.txt`, worauf Passenger die Anwendung neu lädt – der manuelle konsoleH-Neustart entfällt.

Einmalige Einrichtung:

1. Deploy-Schlüssel erzeugen (lokal, ohne Passphrase): `ssh-keygen -t ed25519 -f campmesser-deploy -C "github-deploy"`
2. Den öffentlichen Schlüssel (`campmesser-deploy.pub`) auf dem Server an `~/.ssh/authorized_keys` anhängen (SSH-Zugang vorher in konsoleH aktivieren).
3. Im GitHub-Repo unter **Settings → Secrets and variables → Actions** anlegen:
   - `HETZNER_HOST` – Server-Hostname (z. B. `wpXXX.webpack.hosteurope.de` bzw. dein Hetzner-Host)
   - `HETZNER_USER` – SSH-Benutzername
   - `HETZNER_SSH_KEY` – Inhalt der privaten Schlüsseldatei `campmesser-deploy`
   - optional `HETZNER_PORT` (Standard 22) und `HETZNER_APP_DIR` (Standard `campmesser`, relativ zum Home-Verzeichnis)

Solange die Secrets fehlen, überspringt der Workflow das Deployment mit einem Hinweis – CI (Check/Tests/Build) läuft trotzdem. Manuell auslösen geht über **Actions → Deploy → Run workflow**.

## Überwachung (Health-Check)

Die Anwendung bietet unter `/api/health` einen Health-Endpoint: HTTP 200 mit `{"status":"ok"}`, wenn Prozess und Datenbank erreichbar sind, sonst 503. Richte einen kostenlosen Uptime-Dienst (z. B. UptimeRobot oder Better Stack) auf `https://campmesser.ch/api/health` ein, damit du bei einem Ausfall per E-Mail gewarnt wirst, statt ihn zufällig zu bemerken.

## Datenbank-Backup

Die App speichert echte Nutzerdaten (Konten, Packlisten, Tagebuch, Einstellungen) – richte deshalb ein regelmässiges Backup ein. Das beiliegende Skript erzeugt einen komprimierten `mysqldump` und behält automatisch die letzten 14 Sicherungen:

```bash
bash ~/campmesser/scripts/backup-db.sh
```

Die Sicherungen landen unter `~/backups/campmesser/` (anpassbar über die Variable `BACKUP_DIR`, die Anzahl über `KEEP`). Für den automatischen Lauf legst du in konsoleH unter **Services → Cronjobs** einen täglichen Job an, z. B. um 03:30 Uhr:

```
bash /usr/home/DEIN_LOGIN/campmesser/scripts/backup-db.sh
```

Wiederherstellen lässt sich eine Sicherung so (Achtung: überschreibt den aktuellen Stand):

```bash
gunzip < ~/backups/campmesser/campmesser-JJJJMMTT-HHMMSS.sql.gz | \
  mysql --host=DB_HOST --user=DB_USER -p DB_NAME
```

Lade die Sicherungen gelegentlich zusätzlich auf einen anderen Rechner herunter – ein Backup auf demselben Server schützt nicht vor dem Verlust des Accounts selbst.

## Sicherheitshinweis

Das Datenbank-Passwort und das Sitzungsgeheimnis wurden während der Einrichtung im Klartext übermittelt. Wechsle beide nach der Inbetriebnahme: das Datenbank-Passwort in konsoleH, das Sitzungsgeheimnis durch einen neu erzeugten Wert. Trage sie anschliessend in `~/campmesser/.env` ein. Die passende kodierte Zeichenfolge für ein neues Datenbank-Passwort erhältst du auf dem Server mit:

```bash
node -e "console.log(encodeURIComponent('DEIN_NEUES_PASSWORT'))"
```

## Häufige Stolpersteine

Bleibt die Seite weiss, wurde meist der Build nicht ausgeführt oder `NODE_ENV` steht nicht auf `production`; in diesem Fall sucht der Server nach dem Entwicklungsmodus statt nach den gebauten Dateien. Erscheint eine Datenbankmeldung, prüfe die Kodierung des Passworts in der Verbindungszeichenfolge. Funktioniert die Anmeldung nicht, fehlt in der Regel `JWT_SECRET`. Nach jeder Änderung an der Konfiguration muss die Anwendung in konsoleH neu aktiviert werden.

## Alternative bei Engpässen

Stösst das Webhosting-Paket an Grenzen, etwa beim Arbeitsspeicher während des Builds, kannst du den Build auf einem anderen Rechner erzeugen und nur den fertigen Ordner `dist` per SFTP hochladen. Alternativ bietet ein kleiner Cloud-Server bei Hetzner volle Kontrolle, oder du belässt die Anwendung auf der Manus-Plattform und verbindest dort lediglich deine Subdomain.

## Referenzen

[1] [Node.js Configuration – Hetzner Docs](https://docs.hetzner.com/managed/administration-on-konsoleh/nodejs/)
