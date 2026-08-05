#!/usr/bin/env bash
# Aktualisiert CampMesser auf einem Hetzner-Webhosting-Account.
# Aufruf per SSH:  bash ~/campmesser/scripts/deploy-hetzner.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Verzeichnis: $APP_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  echo "==> Umgebungsvariablen aus .env geladen"
fi

# Bei nicht-interaktiven SSH-Sitzungen (GitHub Actions) fehlt das npm-
# Globalverzeichnis im PATH – hier ergänzen, damit `pnpm` gefunden wird.
NPM_GLOBAL_BIN="$(npm config get prefix 2>/dev/null)/bin"
if [ -d "$NPM_GLOBAL_BIN" ]; then
  export PATH="$NPM_GLOBAL_BIN:$PATH"
fi

if command -v pnpm >/dev/null 2>&1; then
  PKG="pnpm"
else
  echo "==> pnpm nicht gefunden, verwende npm"
  PKG="npm"
fi

echo "==> Neueste Version holen"
# Wichtig: Das Deployment läuft über git pull und baut in-place – das
# unversionierte uploads/-Verzeichnis (Tagebuch-, Rezept-, Zeltplatz- und
# Inventar-Fotos sowie Inventar-Belege, in .gitignore) bleibt dabei unangetastet. Falls je auf rsync
# o. Ä. umgestellt wird: uploads/ zwingend ausnehmen (rsync --exclude 'uploads/').
git pull --ff-only

echo "==> Upload-Verzeichnisse sicherstellen"
mkdir -p uploads/trips uploads/recipes uploads/spots uploads/inventory uploads/receipts uploads/sightings

echo "==> Abhängigkeiten installieren"
$PKG install

echo "==> Datenbank-Migrationen anwenden"
if [ -n "${DATABASE_URL:-}" ]; then
  $PKG exec drizzle-kit migrate || echo "!! Migration fehlgeschlagen – bitte SQL-Dateien manuell prüfen"
else
  echo "!! DATABASE_URL nicht gesetzt – Migration übersprungen"
fi

echo "==> Produktions-Build erstellen"
$PKG run build

echo "==> Anwendung neu starten (konsoleH-Node.js-Dienst)"
# CampMesser läuft als Node.js-Dienst von konsoleH über app.js – Phusion
# Passenger ist hier nicht im Spiel, ein `touch tmp/restart.txt` bewirkt darum
# gar nichts. Der Dienst startet neu, sobald der laufende Prozess beendet ist;
# konsoleH zieht ihn beim nächsten HTTP-Aufruf wieder hoch. Damit dabei nie ein
# Prozess einer anderen Domain auf demselben Account getroffen wird, kommen nur
# Node-Prozesse in Frage, deren Arbeitsverzeichnis dieses App-Verzeichnis ist
# und deren Kommandozeile auf app.js oder dist/index.js zeigt.
app_processes() {
  local pid cwd cmd
  for pid in $(pgrep -u "$(id -u)" node 2>/dev/null || true); do
    cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
    [ "$cwd" = "$APP_DIR" ] || continue
    cmd="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
    case "$cmd" in
      *app.js* | *dist/index.js*) echo "$pid" ;;
    esac
  done
}

RESTART_PIDS="$(app_processes | tr '\n' ' ')"
if [ -n "${RESTART_PIDS// /}" ]; then
  echo "    laufende Prozesse: $RESTART_PIDS"
  # shellcheck disable=SC2086
  kill $RESTART_PIDS 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    [ -z "$(app_processes)" ] && break
    sleep 1
  done
  LEFTOVER="$(app_processes | tr '\n' ' ')"
  if [ -n "${LEFTOVER// /}" ]; then
    echo "    hartnäckige Prozesse: $LEFTOVER"
    # shellcheck disable=SC2086
    kill -9 $LEFTOVER 2>/dev/null || true
  fi
else
  echo "    kein laufender Prozess gefunden – konsoleH startet beim ersten Aufruf"
fi

HEALTH_URL="${PUBLIC_URL:-${APP_URL:-https://campmesser.ch}}/api/health"
echo "==> Anwendung aufwecken und prüfen: $HEALTH_URL"
HEALTH=""
for _ in 1 2 3 4 5 6 7 8 9 10; do
  HEALTH="$(curl -fsS --max-time 20 "$HEALTH_URL" 2>/dev/null || true)"
  [ -n "$HEALTH" ] && break
  sleep 3
done

echo ""
if [ -n "$HEALTH" ]; then
  echo "Fertig. Health-Antwort: $HEALTH"
  echo "Die dort gemeldete version muss dem soeben gebauten Commit entsprechen"
  echo "($(cat dist/version.json 2>/dev/null || echo 'dist/version.json fehlt'))."
else
  echo "Fertig, aber der Health-Endpoint hat nicht geantwortet."
  echo "In konsoleH unter Einstellungen -> Node.js Konfiguration den Dienst"
  echo "einmal deaktivieren und wieder aktivieren."
fi
