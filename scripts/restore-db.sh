#!/usr/bin/env bash
# Spielt eine Sicherung zurück – oder prüft sie bloss (#353).
#
# WARUM ES DIESES SKRIPT GIBT: `backup-db.sh` schreibt seit #13 täglich
# einen Dump. Ob sich der je wieder einlesen liesse, wusste niemand. Eine
# Sicherung, die nie zurückgespielt wurde, ist eine Vermutung.
#
# ZWEI BETRIEBSARTEN:
#   bash scripts/restore-db.sh --check [DATEI]
#       Liest den Dump in eine WEGWERF-Datenbank (Name mit Zeitstempel),
#       zählt die Tabellen und löscht sie wieder. Rührt die echte
#       Datenbank NICHT an. Das ist die Probe für zwischendurch.
#
#   bash scripts/restore-db.sh --into DATENBANK [DATEI]
#       Spielt den Dump in die genannte Datenbank ein. Der Ernstfall.
#       Fragt einmal nach, weil dabei alles überschrieben wird.
#
# Ohne DATEI wird die neueste Sicherung aus BACKUP_DIR genommen.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/campmesser}"

MODE=""
TARGET_DB=""
FILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --check)
      MODE="check"
      shift
      ;;
    --into)
      MODE="into"
      TARGET_DB="${2:-}"
      if [ -z "$TARGET_DB" ]; then
        echo "Fehler: --into braucht einen Datenbanknamen" >&2
        exit 1
      fi
      shift 2
      ;;
    *)
      FILE="$1"
      shift
      ;;
  esac
done

if [ -z "$MODE" ]; then
  echo "Aufruf: restore-db.sh --check [DATEI] | --into DATENBANK [DATEI]" >&2
  exit 1
fi

if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Fehler: DATABASE_URL ist nicht gesetzt (fehlt die .env in $APP_DIR?)" >&2
  exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "Fehler: mysql nicht gefunden" >&2
  exit 1
fi

# Neueste Sicherung, falls keine Datei genannt wurde
if [ -z "$FILE" ]; then
  FILE="$(ls -1t "$BACKUP_DIR"/campmesser-*.sql.gz 2>/dev/null | head -1 || true)"
  if [ -z "$FILE" ]; then
    echo "Fehler: keine Sicherung in $BACKUP_DIR gefunden" >&2
    exit 1
  fi
fi

if [ ! -f "$FILE" ]; then
  echo "Fehler: $FILE gibt es nicht" >&2
  exit 1
fi

# Zugangsdaten wie im Backup-Skript über eine temporäre Optionsdatei –
# das Passwort taucht so weder in der Prozessliste noch im Verlauf auf.
CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
chmod 600 "$CNF"
node -e '
const u = new URL(process.env.DATABASE_URL);
const esc = s => s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
console.log("[client]");
console.log("host=" + u.hostname);
console.log("port=" + (u.port || "3306"));
console.log("user=\"" + esc(decodeURIComponent(u.username)) + "\"");
console.log("password=\"" + esc(decodeURIComponent(u.password)) + "\"");
' > "$CNF"

echo "Sicherung: $FILE ($(du -h "$FILE" | cut -f1))"

if [ "$MODE" = "check" ]; then
  PROBE="campmesser_probe_$(date +%Y%m%d%H%M%S)"
  echo "Probe-Datenbank: $PROBE"
  # Aufräumen auch dann, wenn das Einlesen scheitert – sonst bleibt bei
  # jedem Fehlversuch eine Datenbank liegen.
  cleanup() {
    mysql --defaults-extra-file="$CNF" \
      -e "DROP DATABASE IF EXISTS \`$PROBE\`;" >/dev/null 2>&1 || true
    rm -f "$CNF"
  }
  trap cleanup EXIT

  mysql --defaults-extra-file="$CNF" -e "CREATE DATABASE \`$PROBE\`;"
  gunzip -c "$FILE" | mysql --defaults-extra-file="$CNF" "$PROBE"

  TABLES="$(mysql --defaults-extra-file="$CNF" -N -B -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$PROBE';")"
  USERS="$(mysql --defaults-extra-file="$CNF" -N -B -e \
    "SELECT COUNT(*) FROM \`$PROBE\`.users;" 2>/dev/null || echo "?")"

  echo "Eingelesen: $TABLES Tabellen, $USERS Konten"
  # Eine leere Datenbank liesse sich auch fehlerfrei einlesen – deshalb
  # ist das Ergebnis erst mit Tabellen darin eine gute Nachricht.
  if [ "$TABLES" -lt 5 ]; then
    echo "FEHLER: zu wenige Tabellen – die Sicherung taugt nichts" >&2
    exit 1
  fi
  echo "Probe bestanden. Die Sicherung lässt sich zurückspielen."
  exit 0
fi

echo "ACHTUNG: Datenbank «$TARGET_DB» wird überschrieben."
read -r -p "Wirklich? Tippe den Datenbanknamen zur Bestätigung: " CONFIRM
if [ "$CONFIRM" != "$TARGET_DB" ]; then
  echo "Abgebrochen." >&2
  exit 1
fi

gunzip -c "$FILE" | mysql --defaults-extra-file="$CNF" "$TARGET_DB"
echo "Zurückgespielt nach «$TARGET_DB»."
