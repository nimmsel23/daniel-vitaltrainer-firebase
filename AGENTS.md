# Hinweise für Agents (ChatGPT, Claude web, Codex …)

Dieses Repo ist die **Deploy-Quelle** der Vitaltrainer-Website auf Firebase (`daniel-vitaltrainer.web.app` / `vitalos.at`). ChatGPT committed Pakete ins Vault `Vitaltrainer/website/`; der Sync/Build importiert sie.

## Pakete (Vault → hier)

| Vault (`nimmsel23/Vitaltrainer`) | Ziel in diesem Repo | Live-Pfad |
|---|---|---|
| `website/landingpage/dist` | `src/landingpage/` | `/landingpage/` |
| `website/vitalos-public/dist` | `src/vitalos/` (+ `src/vitalos.html`) | `/vitalos/`, `/vitalos.html` |
| `website/dist` | Shared Assets **und** Trainer-Kern `index.html`, `impressum.html`, `datenschutz.html` | `/`, `/impressum.html`, `/datenschutz.html` |
| `website/dist/vitalos.html` | wird **nicht** übernommen (kommt aus `vitalos-public`) | — |

`href="/vitalos.html"` in der Trainer-`index.html` wird beim Sync auf `href="/vitalos/"` umgeschrieben. Fehlt im Vault-Datenschutz der Abschnitt „Übermittlung in die USA“, setzt `.github/scripts/apply-legal-floor.mjs` ihn wieder ein. Der Sync-Job bricht ab, wenn der Abschnitt danach fehlt.

`npm run build` / `npm run import:gpt` zieht die Pakete automatisch, wenn sie als Nachbarn liegen (`../landingpage`, `../vitalos-public`) oder via `GPT_PACKAGES_ROOT`. CI: `sync-from-gpt.yml` täglich um 05:00 UTC oder von Hand (`workflow_dispatch`). Der PR `sync/gpt` wird von `automerge.yml` gemerged, sobald Check grün ist (`SYNC_TOKEN`, damit `deploy.yml` läuft).

## Regeln

- Trainer-Core nur in `src/`: `index.html`, `impressum.html`, `datenschutz.html`, `6pack.html`, `styles.css`, `app.js`, `consent.js`, `firebase-analytics.js`, `assets/`. **Kein** One-Pager-Mix in `index.html` (gehört nach `landingpage/`).
- `src/landingpage/` und `src/vitalos/` nicht von Hand gegen den Vault-Stand „zurücksetzen“ — Sync/Import ist SOT für diese Bäume.
- Pfade absolut halten: `/styles.css`, `/app.js`, `/assets/...`, `/impressum.html`.
- Auf **Core-Seiten** müssen bleiben: Fußzeile mit Impressum/Datenschutz, `<script type="module" src="/app.js">` und `<script type="module" src="/consent.js">`.
- Kontaktformular (`#contact-form`, gleiche GAS-`action`-URL) nicht entfernen; Double-Opt-in ohne iframe. Die Webapp-URL im `action` ist die GAS-Deployment-ID (`update-deployment`, nicht neu anlegen).
- Keine externen Ressourcen in Core-Seiten (Schriften unter `/assets/fonts/`), keine Secrets/Keys committen.
- Vor dem Commit: `npm run check` muss grün sein.
- Änderungen unter `gas/` werden per CI mit clasp deployt (`scripts/deploy-gas.sh`).

## Empfohlener Ablauf

Änderungen als Branch + Pull Request einreichen: der PR bekommt automatisch eine Preview-URL (Channel `pr-<nr>`, 7 Tage). Nach dem Merge auf `main` geht es live.
