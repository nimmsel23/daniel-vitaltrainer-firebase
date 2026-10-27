#!/usr/bin/env bash
# LLM-Doctor (lokal): repariert den roten Sync-PR `sync/gpt`, wenn `npm run check` dort rot ist.
# Kette: claude (Haiku) -> codex -> agy (Antigravity). Jeder Versuch läuft in einem frischen Klon,
# darf nur src/ ändern, und das Ergebnis muss `npm run check` bestehen, bevor gepusht wird.
#
#   scripts/doctor.sh             Normalbetrieb (PR suchen, klonen, reparieren, pushen, kommentieren)
#   scripts/doctor.sh --dir DIR   nur ein vorhandenes Git-Verzeichnis reparieren (Test, kein Push/PR)
set -uo pipefail

repo="nimmsel23/daniel-vitaltrainer-firebase"
branch="sync/gpt"
max_doctor_commits=3
state_dir="${XDG_STATE_HOME:-$HOME/.local/state}/web-doctor"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/web-doctor.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

log() { printf '[doctor] %s\n' "$*"; }
notify() { command -v notify-send >/dev/null && notify-send -a web-doctor "$1" "${2:-}" || true; }

# gh-Token statt SSH-Agent: läuft auch unter systemd ohne SSH_AUTH_SOCK
git_gh() { git -c credential.helper='!gh auth git-credential' "$@"; }

check() { (cd "$1" && npm run --silent check) >"$2" 2>&1; }

only_src_changed() {
  local bad
  bad="$(git -C "$1" ls-files -m -o -d --exclude-standard | sort -u | grep -v '^src/' || true)"
  [ -z "$bad" ] || { log "Änderungen außerhalb src/ verworfen: $bad"; return 1; }
}

run_claude() {
  printf '%s' "$2" | (cd "$1" && timeout 900 claude -p --model claude-haiku-5-5 --permission-mode acceptEdits \
    --allowedTools "Read,Edit(src/**),Write(src/**),Bash(npm run check)" --max-turns 30)
}
run_codex() { (cd "$1" && timeout 900 codex exec --sandbox workspace-write "$2"); }
run_agy()   { (cd "$1" && timeout 900 agy -p "$2" --mode accept-edits --sandbox); }

# repair DIR -> setzt $fixed_by bei Erfolg; Änderungen bleiben unversioniert in DIR
repair() {
  local dir="$1" ex prompt
  fixed_by=""
  prompt="Der Check (npm run check) dieses Repos ist rot. Lies zuerst AGENTS.md.
Ausgabe des Checks:
$(head -c 6000 "$tmp/before.log")

Aufgabe: Behebe die Fehler nur durch Änderungen in src/. Die inhaltlichen Änderungen aus dem Sync (Texte, Angebot, Design) bleiben erhalten; fehlende Pflichtbausteine (Kontaktformular samt GAS-URL, /app.js und /consent.js, Impressum-/Datenschutz-Links, selbst gehostete Fonts unter /assets/fonts/) stellst du so wieder her, wie sie in 'git show origin/main:src/<datei>' stehen. Ändere nichts außerhalb von src/. Prüfe mit 'npm run check', bis es grün ist, und fasse kurz zusammen, was du geändert hast."

  for ex in claude codex agy; do
    command -v "$ex" >/dev/null || { log "$ex nicht installiert"; continue; }
    git -C "$dir" reset -q --hard HEAD && git -C "$dir" clean -fdq
    log "Versuch mit $ex"
    "run_$ex" "$dir" "$prompt" >"$tmp/$ex.log" 2>&1 || log "$ex beendet mit Exit $?"
    only_src_changed "$dir" || continue
    [ -n "$(git -C "$dir" status --porcelain)" ] || { log "$ex hat nichts geändert"; continue; }
    if check "$dir" "$tmp/after.log"; then fixed_by="$ex"; return 0; fi
    log "$ex: Check weiterhin rot"
  done
  return 1
}

if [ "${1:-}" = "--dir" ]; then
  dir="${2:?Verzeichnis fehlt}"
  check "$dir" "$tmp/before.log" && { log "Check ist grün."; exit 0; }
  if repair "$dir"; then log "repariert von $fixed_by"; git -C "$dir" status --short; exit 0; fi
  log "nicht reparierbar"; exit 1
fi

# --- Normalbetrieb
pr_json="$(gh pr list -R "$repo" --head "$branch" --state open --json number,headRefOid,statusCheckRollup --jq '.[0] // empty')"
[ -n "$pr_json" ] || { log "kein offener Sync-PR"; exit 0; }
pr="$(jq -r .number <<<"$pr_json")"; head_sha="$(jq -r .headRefOid <<<"$pr_json")"
failed="$(jq '[.statusCheckRollup[]? | select(.conclusion == "FAILURE")] | length' <<<"$pr_json")"
[ "$failed" -gt 0 ] || { log "PR #$pr: kein roter Check"; exit 0; }

mkdir -p "$state_dir"
[ "$(cat "$state_dir/failed-sha" 2>/dev/null)" = "$head_sha" ] && { log "PR #$pr: dieser Stand wurde schon erfolglos versucht"; exit 0; }

work="$tmp/work"
git_gh clone -q --depth 50 --branch "$branch" "https://github.com/$repo.git" "$work" || { log "Klon fehlgeschlagen"; exit 1; }
git_gh -C "$work" fetch -q --depth 50 origin main
n="$(git -C "$work" log origin/main..HEAD --author=llm-doctor --oneline | wc -l)"
[ "$n" -lt "$max_doctor_commits" ] || { log "PR #$pr: schon $n Doctor-Commits, braucht einen Menschen"; exit 0; }

check "$work" "$tmp/before.log" && { log "lokal grün (CI evtl. nur flackernd)"; exit 0; }

if repair "$work"; then
  git -C "$work" add -A src
  git -C "$work" -c user.name=llm-doctor -c user.email=llm-doctor@users.noreply.github.com \
    commit -q -m "Doctor ($fixed_by): Check repariert

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
  git_gh -C "$work" push -q origin "$branch" || { log "Push fehlgeschlagen"; exit 1; }
  gh pr comment "$pr" -R "$repo" --body "LLM-Doctor ($fixed_by) hat den Check repariert und gepusht. Bitte Diff und Preview prüfen, bevor du mergst." >/dev/null
  notify "Sync-PR #$pr repariert" "$fixed_by – bitte prüfen und mergen"
  log "PR #$pr repariert von $fixed_by"
else
  printf '%s' "$head_sha" >"$state_dir/failed-sha"
  gh pr comment "$pr" -R "$repo" --body "LLM-Doctor konnte den Check nicht reparieren (claude, codex, agy). Bitte von Hand ansehen." >/dev/null
  notify "Sync-PR #$pr: Doctor ratlos" "bitte von Hand ansehen"
  log "PR #$pr nicht reparierbar"
  exit 1
fi
