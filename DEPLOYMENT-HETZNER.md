# CampMesser auf Hetzner Webhosting einrichten

Diese Anleitung führt Schritt für Schritt durch die Installation von **CampMesser** auf einem Hetzner-Webhosting-Paket mit Node.js. Sie ist konkret auf die Subdomain **camping.gross-ict.ch** und die Datenbank **camping** zugeschnitten, sodass sich alle Werte direkt übernehmen lassen.

Die Anwendung besteht aus einem Node-Server, der sowohl die Weboberfläche als auch die Programmschnittstelle ausliefert, sowie einer MySQL-Datenbank. Sämtliche Bilder sind fest in die Anwendung eingebaut, sodass keine externen Dienste benötigt werden.

> **Hinweis zur Domain:** Sobald Node.js für eine Domain aktiviert wird, deaktiviert Hetzner alle anderen Webanwendungen dieser Domain [1]. Da du dafür eine eigene Subdomain angelegt hast, ist das unproblematisch.

## Übersicht der benötigten Angaben

| Angabe | Wert |
| --- | --- |
| Subdomain | `camping.gross-ict.ch` |
| Datenbank | `camping` auf `ly8y.your-database.de` |
| Datenbank-Benutzer | `jqviwy_0` |
| Node.js-Version | 24 |
| Zielverzeichnis auf dem Server | `~/public_html/camping` |

## Schritt 1: Code per SSH auf den Server laden

Verbinde dich per SSH mit deinem Hosting-Account und lade das Projekt aus dem GitHub-Repository in das bestehende Verzeichnis der Subdomain. Da der Ordner `camping` bereits existiert, wird direkt in ihn hinein geklont.

```bash
cd ~/public_html/camping
git clone https://github.com/stibe881/CampMesser.git .
```

Ist der Ordner nicht leer, verschiebe die vorhandenen Dateien zuvor beiseite (`mkdir ~/alt-camping && mv ~/public_html/camping/* ~/alt-camping/`). Steht `git` nicht zur Verfügung, lade das Repository als ZIP-Archiv herunter und entpacke es per SFTP in den Ordner `camping`.

## Schritt 2: Node-Version festlegen und Anwendung bauen

Hetzner liest die gewünschte Node-Version aus einer Datei im Heimatverzeichnis [1]. Danach installierst du die Pakete und erzeugst den Produktions-Build, der die Serverdatei `dist/index.js` und die fertige Oberfläche unter `dist/public` enthält.

```bash
echo 24 > ~/.nodeversion
cd ~/public_html/camping
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
cd ~/public_html/camping
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
chmod 600 ~/public_html/camping/.env
```

Zur Erläuterung der Kodierung: Aus dem Passwort `k8,Ct=&*/28$` wird `k8%2CCt%3D%26*%2F28%24`, weil Komma, Gleichheitszeichen, kaufmännisches Und, Schrägstrich und Dollarzeichen in einer Verbindungsadresse eine Sonderbedeutung haben. Änderst du das Passwort später, müssen die neuen Sonderzeichen ebenfalls kodiert werden.

## Schritt 4: Datenbankstruktur anlegen

Die Tabellen werden aus den mitgelieferten Migrationsdateien erzeugt:

```bash
cd ~/public_html/camping
pnpm drizzle-kit migrate
```

Sollte der Befehl in der Hosting-Umgebung nicht durchlaufen, spiele ersatzweise die Dateien `drizzle/0000_*.sql` bis `drizzle/0006_*.sql` in aufsteigender Reihenfolge über phpMyAdmin in konsoleH ein. Die Markierungen `--> statement-breakpoint` trennen dabei die einzelnen Anweisungen und gehören nicht mit in die Eingabe.

## Schritt 5: Node.js in konsoleH konfigurieren

Öffne in konsoleH die Subdomain `camping.gross-ict.ch` und dort links **Services → Node.js Konfiguration**. Trage die folgenden Werte in das Formular ein:

| Feld im Formular | Einzutragender Wert |
| --- | --- |
| Skript-Pfad | `app.js` |
| Arbeitsverzeichnis | `public_html/camping` |
| Name der Log-Datei | `camping.log` |
| Arbeitsspeicher-Beschränkung | `512` |
| Version | `24` |
| Skript Parameter | leer lassen |

Die Datei `app.js` liegt bereits im Projekt. Sie liest deine `.env`-Datei ein und startet anschliessend den gebauten Server – genau in dem Format, das Hetzner erwartet. Das Arbeitsverzeichnis wird relativ zum Heimatverzeichnis angegeben, der Skript-Pfad wiederum relativ zum Arbeitsverzeichnis. Die Log-Datei landet direkt im Heimatverzeichnis.

### Umgebungsvariablen im Formular

Im Abschnitt **Umgebungsvariablen** trägst du zusätzlich die folgenden Schlüssel-Wert-Paare ein und bestätigst jedes einzeln mit **Hinzufügen**. Sie haben Vorrang vor der `.env`-Datei und stellen sicher, dass die Anwendung auch dann korrekt startet, wenn die Datei einmal fehlt.

| Schlüssel | Wert |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://jqviwy_0:k8%2CCt%3D%26*%2F28%24@ly8y.your-database.de:3306/camping` |
| `JWT_SECRET` | dasselbe Geheimnis wie in der `.env`-Datei |

Klicke danach auf **Aktivieren**. Rufst du nun `https://camping.gross-ict.ch` im Browser auf, sollte die Startseite von CampMesser erscheinen.

### Wenn die Seite nicht erscheint

Die Anwendung schreibt ihre Meldungen in die Datei `camping.log` in deinem Heimatverzeichnis. Ein Blick hinein zeigt in fast allen Fällen die Ursache:

```bash
tail -50 ~/camping.log
```

Meldet das Protokoll einen Portkonflikt, ergänze im Formular eine weitere Umgebungsvariable `PORT` mit der Portnummer, die Hetzner deinem Account zugewiesen hat. Ohne Vorgabe verwendet die Anwendung Port 3000 und weicht bei Belegung selbstständig auf den nächsten freien Port aus.

## Schritt 6: E-Mail-Versand für vergessene Passwörter

Damit Rücksetz-Codes per E-Mail zugestellt werden, hinterlege die Zugangsdaten eines Postfachs deiner Domain. Ohne diese Angaben funktioniert die Anmeldung normal weiter; der Code wird dann lediglich ins Protokoll geschrieben.

| Schlüssel | Beispielwert |
| --- | --- |
| `SMTP_HOST` | `mail.gross-ict.ch` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Postfachname |
| `SMTP_PASS` | Postfach-Passwort |
| `SMTP_FROM` | `noreply@gross-ict.ch` |

Diese Werte kannst du wahlweise in die `.env`-Datei schreiben oder als Umgebungsvariablen im konsoleH-Formular ergänzen.

## Schritt 7: Funktionsprüfung

Prüfe nach dem Start, ob die Startseite mitsamt Hintergrundbild lädt, ob sich ein Testkonto registrieren lässt und ob eine angelegte Packliste nach dem Neuladen erhalten bleibt. Der letzte Punkt bestätigt, dass die Datenbankverbindung steht. Öffne zusätzlich ein Wissens-Modul wie das Rezeptbuch, um die Bildauslieferung zu kontrollieren.

## Aktualisierungen einspielen

Neue Versionen holst du dir mit dem beiliegenden Skript. Anschliessend schaltest du die Anwendung in konsoleH einmal aus und wieder ein, damit der neue Stand geladen wird.

```bash
bash ~/public_html/camping/scripts/deploy-hetzner.sh
```

## Sicherheitshinweis

Das Datenbank-Passwort wurde während der Einrichtung im Klartext übermittelt. Wechsle es nach der Inbetriebnahme in konsoleH und trage den neuen Wert an zwei Stellen ein: in der Datei `~/public_html/camping/.env` und in der Umgebungsvariablen `DATABASE_URL` im Node.js-Formular. Die passende kodierte Zeichenfolge erhältst du auf dem Server mit:

```bash
node -e "console.log(encodeURIComponent('DEIN_NEUES_PASSWORT'))"
```

## Häufige Stolpersteine

Bleibt die Seite weiss, wurde meist der Build nicht ausgeführt oder `NODE_ENV` steht nicht auf `production`; in diesem Fall sucht der Server nach dem Entwicklungsmodus statt nach den gebauten Dateien. Erscheint eine Datenbankmeldung, prüfe die Kodierung des Passworts in der Verbindungszeichenfolge. Funktioniert die Anmeldung nicht, fehlt in der Regel `JWT_SECRET`. Nach jeder Änderung an der Konfiguration muss die Anwendung in konsoleH neu aktiviert werden.

## Alternative bei Engpässen

Stösst das Webhosting-Paket an Grenzen, etwa beim Arbeitsspeicher während des Builds, kannst du den Build auf einem anderen Rechner erzeugen und nur den fertigen Ordner `dist` per SFTP hochladen. Alternativ bietet ein kleiner Cloud-Server bei Hetzner volle Kontrolle, oder du belässt die Anwendung auf der Manus-Plattform und verbindest dort lediglich deine Subdomain.

## Referenzen

[1] [Node.js Configuration – Hetzner Docs](https://docs.hetzner.com/managed/administration-on-konsoleh/nodejs/)
