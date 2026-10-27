#!/usr/bin/env bash
# GAS-Kontaktformular deployen: clasp push + update-deployment.
# Genutzt vom pre-push-Hook (lokal) und von .github/workflows/deploy-gas.yml (CI).
# Die Deployment-ID steht als Webapp-URL in src/index.html (einzige Quelle der Wahrheit).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
user="${CLASP_USER:-nimmdaniel}"

deployment_id="$(grep -oP 'script\.google\.com/macros/s/\K[^/]+(?=/exec)' "$root/src/index.html" | head -n1)"
[ -n "$deployment_id" ] || { echo "deploy-gas: keine Deployment-ID in src/index.html" >&2; exit 1; }

command -v clasp >/dev/null || { echo "deploy-gas: clasp nicht im PATH" >&2; exit 1; }

echo "deploy-gas: push + update-deployment ($deployment_id, user $user)"
cd "$root/gas/contact-form"
clasp push -f -u "$user"
clasp update-deployment -u "$user" -d "${DEPLOY_NOTE:-deploy-gas $(git rev-parse --short HEAD)}" "$deployment_id"
