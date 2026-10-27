# Hinweise für Agents (ChatGPT, Claude web, Codex …)

Dieses Repo ist die **einzige Quelle** der Vitaltrainer-Website. Jeder Push auf `master`, der `src/`, `scripts/` oder `firebase.json` ändert, wird per GitHub Actions automatisch live auf Firebase Hosting deployt (https://daniel-vitaltrainer.web.app).

## Regeln

- Nur in `src/` arbeiten (`index.html`, `vitalos.html`, `impressum.html`, `datenschutz.html`, `styles.css`, `app.js`, `consent.js`, `firebase-analytics.js`, `assets/`). `dist/` ist generiert und nicht im Repo.
- **Nicht** auf einen anderen Stand (z. B. `Vitaltrainer/website/dist`) zurücksetzen. Immer vom aktuellen `master` ausgehen.
- Pfade absolut halten: `/styles.css`, `/app.js`, `/assets/...`, `/impressum.html`.
- Auf jeder Seite müssen bleiben: Fußzeile mit Impressum/Datenschutz, `<script type="module" src="/app.js">` und `<script type="module" src="/consent.js">` (Analytics lädt nur nach Einwilligung – nie direkt `firebase-analytics.js` einbinden).
- Kontaktformular (`#contact-form` + `iframe[name=contact-target]`) nicht entfernen; die Webapp-URL im `action` ist die GAS-Deployment-ID.
- Keine externen Ressourcen einbinden (Schriften sind selbst gehostet unter `/assets/fonts/`), keine Secrets/Keys committen.
- Vor dem Commit: `npm run check` (Link-/Anker-Check + Build) muss grün sein.
- Änderungen unter `gas/` werden per CI mit clasp deployt (`scripts/deploy-gas.sh`).

## Empfohlener Ablauf

Änderungen als Branch + Pull Request einreichen: der PR bekommt automatisch eine Preview-URL (Channel `pr-<nr>`, 7 Tage). Nach dem Merge auf `master` geht es live.
