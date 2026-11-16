#!/usr/bin/env bash
# Sperrliste für alles, was öffentlich werden kann.
# Gleiche Prüfung wie in nimmsel23/Vitaltrainer (.github/scripts/public-denylist.sh).
# Klartextnamen kommen nur aus dem Secret PUBLIC_DENYLIST und werden nicht geloggt.
# Aufruf: public-denylist.sh DIR [DIR...]
set -euo pipefail

if [ -z "${DENYLIST:-}" ]; then
  echo "::error::Secret PUBLIC_DENYLIST fehlt – nichts wird veröffentlicht."
  exit 1
fi
if [ "$#" -lt 1 ]; then
  echo "::error::Keine Verzeichnisse für die Sperrliste angegeben."
  exit 1
fi

for d in "$@"; do
  if [ ! -d "$d" ]; then
    echo "::error::Sperrlisten-Pfad fehlt: $d"
    exit 1
  fi
done

hits=0
IFS=',' read -ra words <<< "$DENYLIST"
for w in "${words[@]}"; do
  w="$(printf '%s' "$w" | xargs)"
  [ -z "$w" ] && continue
  # -I: Schriften und Bilder nicht als Text scannen (sonst Zufallstreffer).
  # -q: der Klartextname darf nicht im Log stehen.
  if grep -rqIwiF -- "$w" "$@"; then
    hits=$((hits + 1))
  fi
done

if [ "$hits" -gt 0 ]; then
  echo "::error::$hits Klartextname(n) aus der Sperrliste – nichts wird veröffentlicht."
  exit 1
fi

echo "Sperrliste sauber (${#words[@]} Einträge, $# Pfad(e))."
