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
git pull --ff-only

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

echo ""
echo "Fertig. Starte die Anwendung jetzt in konsoleH unter"
echo "Services -> Node.js configuration neu (Deaktivieren, dann Aktivieren)."
