#!/usr/bin/env bash
# Sichert die CampMesser-Datenbank per mysqldump mit Rotation.
# Aufruf (z. B. täglich per Cronjob in konsoleH):
#   bash ~/campmesser/scripts/backup-db.sh
# Optional per Umgebungsvariablen: BACKUP_DIR (Ziel), KEEP (Anzahl Sicherungen)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/campmesser}"
KEEP="${KEEP:-14}"

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

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "Fehler: mysqldump nicht gefunden" >&2
  exit 1
fi

# Zugangsdaten aus der DATABASE_URL in eine temporäre MySQL-Optionsdatei
# schreiben: Node übernimmt das URL-Decoding (z. B. %40 im Passwort), und das
# Passwort taucht so weder in der Prozessliste noch im Verlauf auf.
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
DB_NAME="$(node -e 'console.log(new URL(process.env.DATABASE_URL).pathname.replace(/^\//, ""))')"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/campmesser-$STAMP.sql.gz"

# --single-transaction: konsistenter Stand ohne Tabellen-Sperren (InnoDB)
# --no-tablespaces: nötig, weil Webhosting-Nutzer kein PROCESS-Privileg haben
mysqldump --defaults-extra-file="$CNF" \
  --single-transaction --quick --no-tablespaces \
  "$DB_NAME" | gzip > "$FILE"

echo "Backup erstellt: $FILE ($(du -h "$FILE" | cut -f1))"

# Rotation: nur die neuesten $KEEP Sicherungen behalten
ls -1t "$BACKUP_DIR"/campmesser-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm --
echo "Rotation: maximal $KEEP Sicherungen in $BACKUP_DIR"
