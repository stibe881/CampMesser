# CampMesser auf Hetzner Webhosting betreiben

Diese Anleitung beschreibt, wie die Anwendung **CampMesser** auf einem Hetzner-Webhosting-Paket mit aktivierter Node.js-Unterstützung installiert und betrieben wird. Sie richtet sich an ein Paket vom Typ **Webhosting L oder XL**, da Node.js erst ab dieser Stufe verfügbar ist [1].

## Voraussetzungen prüfen

Bevor du beginnst, sollten die folgenden Punkte erfüllt sein. Die Anwendung besteht aus einem Node-Server (Express), einer React-Oberfläche und einer MySQL-Datenbank; alle Bilder sind inzwischen fest in die Anwendung eingebaut, sodass keine externen Dienste mehr benötigt werden.

| Voraussetzung | Details |
| --- | --- |
| Hosting-Paket | Webhosting L oder XL mit Node.js-Unterstützung |
| SSH-Zugang | In konsoleH aktiviert, Zugangsdaten bekannt |
| MySQL-Datenbank | In konsoleH angelegt (Name, Benutzer, Passwort, Host) |
| Node.js-Version | 20 oder neuer |
| Domain | Eine Domain oder Subdomain, die ausschliesslich für CampMesser genutzt wird |

> **Wichtig:** Sobald du Node.js für eine Domain aktivierst, werden alle anderen Webanwendungen dieser Domain – etwa PHP oder statisches HTML – deaktiviert [1]. Verwende deshalb am besten eine eigene Subdomain wie `camp.deinedomain.ch`, wenn unter der Hauptdomain bereits eine Website läuft.

## Schritt 1: Datenbank anlegen

Melde dich in konsoleH an, öffne den Bereich für Datenbanken und lege eine neue MySQL-Datenbank an. Notiere dir Datenbankname, Benutzername, Passwort und Hostname. Aus diesen Angaben setzt sich später die Verbindungszeichenfolge zusammen:

```
mysql://BENUTZER:PASSWORT@HOST:3306/DATENBANKNAME
```

Enthält das Passwort Sonderzeichen wie `@`, `:` oder `/`, müssen diese URL-kodiert werden (`@` wird zu `%40`, `:` zu `%3A`, `/` zu `%2F`).

## Schritt 2: Code auf den Server bringen

Verbinde dich per SSH mit deinem Hosting-Account und lege die Anwendung im Heimatverzeichnis ab. Der Quellcode liegt öffentlich auf GitHub bereit:

```bash
ssh dein-benutzer@dein-host.your-server.de
cd ~
git clone https://github.com/stibe881/CampMesser.git campmesser
cd campmesser
```

Falls `git` nicht verfügbar ist, kannst du das Projekt alternativ als ZIP-Archiv herunterladen und per SFTP hochladen.

## Schritt 3: Node-Version festlegen und Abhängigkeiten installieren

Hetzner erlaubt es, die gewünschte Node-Version für den Account per Datei zu hinterlegen [1]. Anschliessend installierst du die Pakete und erzeugst den Produktions-Build:

```bash
echo 22 > ~/.nodeversion
cd ~/campmesser
npm install -g pnpm          # falls pnpm noch nicht vorhanden ist
pnpm install
pnpm build
```

Der Build erzeugt zwei Bestandteile: die Serverdatei `dist/index.js` sowie die fertige Weboberfläche inklusive aller Bilder unter `dist/public`. Der Build benötigt einige Minuten und etwa 1 GB Arbeitsspeicher.

## Schritt 4: Umgebungsvariablen definieren

Die Anwendung wird über Umgebungsvariablen konfiguriert. Zwingend erforderlich sind die Datenbankverbindung und ein zufälliges Sitzungsgeheimnis; die SMTP-Angaben sind optional und aktivieren den E-Mail-Versand der Passwort-Codes über deinen eigenen Mailserver.

| Variable | Pflicht | Bedeutung |
| --- | --- | --- |
| `DATABASE_URL` | ja | Verbindung zur MySQL-Datenbank, Format siehe Schritt 1 |
| `JWT_SECRET` | ja | Zufällige Zeichenkette zum Signieren der Anmelde-Sitzungen |
| `NODE_ENV` | ja | Muss auf `production` gesetzt werden |
| `PORT` | empfohlen | Port, auf dem der Server lauscht (Wert aus der konsoleH-Konfiguration) |
| `SMTP_HOST` | optional | Mailserver, z. B. `mail.deinedomain.ch` |
| `SMTP_PORT` | optional | Üblicherweise `587`, bei SSL `465` |
| `SMTP_USER` | optional | Postfachname |
| `SMTP_PASS` | optional | Postfach-Passwort |
| `SMTP_FROM` | optional | Absenderadresse, z. B. `noreply@deinedomain.ch` |

Ein sicheres Sitzungsgeheimnis erzeugst du direkt auf dem Server:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Für die Migration im nächsten Schritt legst du zusätzlich eine Datei `.env` im Projektverzeichnis an. Diese wird nur von den Kommandozeilen-Werkzeugen gelesen; im laufenden Betrieb kommen die Werte aus konsoleH.

```bash
cat > ~/campmesser/.env << 'EOF'
DATABASE_URL=mysql://benutzer:passwort@host:3306/datenbank
JWT_SECRET=hier-das-erzeugte-geheimnis-einsetzen
NODE_ENV=production
EOF
chmod 600 ~/campmesser/.env
```

## Schritt 5: Datenbankschema einspielen

Die Tabellenstruktur liegt als Migrationsdateien im Ordner `drizzle`. Sie wird mit einem einzigen Befehl angelegt:

```bash
cd ~/campmesser
pnpm drizzle-kit migrate
```

Sollte der Befehl in der Hosting-Umgebung nicht durchlaufen, kannst du die Dateien `drizzle/0000_*.sql` bis `drizzle/0006_*.sql` in aufsteigender Reihenfolge über phpMyAdmin in konsoleH einspielen. Achte dabei darauf, die in den Dateien enthaltenen Trennmarkierungen `--> statement-breakpoint` zu entfernen beziehungsweise die Anweisungen einzeln auszuführen.

## Schritt 6: Node.js in konsoleH aktivieren

Wähle in konsoleH die gewünschte Domain aus und öffne links **Services → Node.js configuration** [1]. Trage dort die folgenden Werte ein und speichere anschliessend:

| Feld | Wert |
| --- | --- |
| Working directory | `campmesser` |
| Script path | `dist/index.js` |
| Version | 22 (oder die installierte Version) |
| Log file | `campmesser/app.log` |
| Memory limit | mindestens 512 MB |
| Environment variables | `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` sowie optional die SMTP-Werte |

Nach dem Speichern aktivierst du die Anwendung über die Schaltfläche **Aktivieren**. Rufst du danach deine Domain im Browser auf, sollte die Startseite von CampMesser erscheinen.

### Hinweis zum Port

Die Anwendung liest den Port aus der Umgebungsvariablen `PORT` und verwendet ersatzweise 3000. Falls Hetzner einen bestimmten Port vorgibt, trage diesen in der konsoleH-Konfiguration als Umgebungsvariable `PORT` ein. Erscheint die Seite nicht, findest du im Logfile `campmesser/app.log` die tatsächlich verwendete Portnummer und mögliche Fehlermeldungen.

## Schritt 7: Funktion prüfen

Prüfe nach dem Start die folgenden Punkte: Die Startseite lädt inklusive Hintergrundbild, die Registrierung eines Testkontos funktioniert, eine Packliste lässt sich anlegen und wieder aufrufen (dies bestätigt die Datenbankverbindung), und die Wissens-Module zeigen ihre Bilder an. Bei Problemen hilft ein Blick ins Logfile:

```bash
tail -50 ~/campmesser/app.log
```

## Aktualisierungen einspielen

Neue Versionen holst du dir mit wenigen Befehlen. Anschliessend startest du die Anwendung in konsoleH einmal neu.

```bash
cd ~/campmesser
git pull
pnpm install
pnpm build
```

Zur Vereinfachung liegt dem Projekt das Skript `scripts/deploy-hetzner.sh` bei, das diese Schritte zusammenfasst.

## Häufige Stolpersteine

Bleibt die Seite weiss oder erscheint ein Serverfehler, liegt es meist an einer der folgenden Ursachen. Die Datenbank-Verbindungszeichenfolge enthält nicht kodierte Sonderzeichen, `NODE_ENV` wurde nicht auf `production` gesetzt (dann sucht der Server nach dem Entwicklungsmodus statt nach den gebauten Dateien), oder der Build wurde nach einer Änderung nicht erneut ausgeführt. Fehlen die Anmeldefunktionen, prüfe, ob `JWT_SECRET` gesetzt ist. Kommen keine Passwort-E-Mails an, fehlen die SMTP-Angaben; in diesem Fall wird der Code lediglich ins Logfile geschrieben.

## Alternative: Hetzner Cloud oder Manus-Hosting

Falls das Webhosting-Paket an Grenzen stösst – etwa beim Arbeitsspeicher während des Builds –, bieten sich zwei Alternativen an. Ein kleiner Cloud-Server bei Hetzner (etwa CX22 für rund 4 Euro monatlich) bietet volle Kontrolle mit Node.js, MySQL, Nginx und automatischem HTTPS-Zertifikat. Ebenso kannst du die Anwendung auf der Manus-Plattform belassen und dort lediglich deine eigene Domain verbinden; Datenbank, Zertifikate und Updates werden dann automatisch verwaltet.

## Referenzen

[1] [Node.js Configuration – Hetzner Docs](https://docs.hetzner.com/managed/administration-on-konsoleh/nodejs/)
