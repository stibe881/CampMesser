#!/usr/bin/env bash
# Aktualisiert CampMesser auf einem Hetzner-Webhosting-Account.
# Aufruf per SSH:  bash ~/public_html/camping/scripts/deploy-hetzner.sh
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

if command -v pnpm >/dev/null 2>&1; then
  PKG="pnpm"
else
  echo "==> pnpm nicht gefunden, verwende npm"
  PKG="npm"
fi

echo "==> Neueste Version holen"
# Wichtig: Das Deployment läuft über git pull und baut in-place – das
# unversionierte uploads/-Verzeichnis (Tagebuch-, Rezept- und Zeltplatz-Fotos,
# in .gitignore) bleibt dabei unangetastet. Falls je auf rsync o. Ä. umgestellt
# wird: uploads/ zwingend ausnehmen (rsync --exclude 'uploads/').
git pull --ff-only

echo "==> Upload-Verzeichnisse sicherstellen"
mkdir -p uploads/trips uploads/recipes uploads/spots

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

echo "==> Anwendung neu starten (Passenger)"
# Phusion Passenger lädt die App neu, sobald tmp/restart.txt berührt wird –
# der manuelle Neustart über konsoleH entfällt damit in der Regel.
mkdir -p tmp
touch tmp/restart.txt

echo ""
echo "Fertig. Die Anwendung wird beim nächsten Aufruf automatisch neu geladen."
echo "Falls nicht: in konsoleH unter Services -> Node.js configuration"
echo "einmal deaktivieren und wieder aktivieren."
