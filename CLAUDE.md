# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A standalone, dependency-free static site (Daniel's Vitaltrainer profile page) deployed to Firebase Hosting. No framework, no bundler, no npm dependencies — just hand-written `index.html`/`styles.css`/`app.js` and two Node scripts that copy/serve those files.

## Commands

```bash
npm run dev      # serve src/ live at http://localhost:4173
npm run build    # copy src/ -> dist-firebase/, verify required files exist
npm run preview  # serve the built dist-firebase/ at http://localhost:4173
npm run deploy   # build, then firebase-tools deploy --only hosting
```

There is no lint or test command/config in this repo — don't invent one.

### Firebase project selection

`.firebaserc` is gitignored (local-only) and holds the `default` project alias. If it's missing, either run `firebase use --add` or copy `.firebaserc.example` to `.firebaserc` and fill in the project ID.

Multiple Google accounts are usable side by side via the Firebase CLI without touching global login state:

```bash
npx firebase-tools login:list                    # see which accounts are authenticated
npx firebase-tools login:add                      # add another account without logging out
npx firebase-tools deploy --only hosting --account <email>   # target a specific account per command
```

This repo's Firebase project (`daniel-vitaltrainer`) is managed under the `nimmdaniel@gmail.com` account, not the account that's usually logged in by default — always pass `--account nimmdaniel@gmail.com` explicitly for `firebase`/`firebase-tools` commands here rather than relying on whichever account happens to be active.

### Contact form (GAS)

`gas/contact-form/` is a clasp-managed Apps Script project (account `nimmdaniel`, i.e. `clasp <cmd> -u nimmdaniel`), linked to the same GCP project as Firebase (`daniel-vitaltrainer`). `Code.gs` exposes `doPost` (sends the submitted fields via `MailApp.sendEmail` straight to `nimmdaniel@gmail.com`, no storage) and `doGet` (friendly plain-text response instead of a Google error). The deployed web app URL is hardcoded as the `<form action>` in `src/index.html` — after pushing code changes, redeploy with `clasp update-deployment -u nimmdaniel <deploymentId>` (see `gas/contact-form/.clasp.json` / `clasp list-deployments -u nimmdaniel` for the current deployment id) rather than creating a new deployment, so the URL in `index.html` keeps working.

A GCP-linked (non-default) Apps Script project needs its OAuth consent screen published (`Testing` → `In production`) before anonymous `ANYONE_ANONYMOUS` web app access works — expect a propagation delay of several minutes after any such change, surfacing as a Google Drive-style "Zugriff verweigert" page instead of the script's actual response.

### CI (laptopfreies Deployen)

- Keine lokalen Git-Hooks: Prüfungen und Deploys laufen in der CI (`check.yml`, `deploy*.yml`). Secrets/Keys deshalb nie committen – es gibt keine lokale Sperre und im Free-Plan keinen GitHub-Push-Schutz für private Repos.
- `scripts/deploy-gas.sh` (von `deploy-gas.yml` genutzt, auch lokal aufrufbar): `clasp push` + `update-deployment`; die Deployment-ID wird aus der Webapp-URL in `src/index.html` gelesen.
- `.github/workflows/`: `deploy.yml` (Push auf `main` mit Änderungen in `src/`, `scripts/`, `firebase.json` → Firebase Hosting live), `deploy-gas.yml` (Änderungen in `gas/` → clasp), `preview.yml` (PR → Preview-Channel `pr-<n>`, 7 Tage).
- `check.yml` (jeder PR/Push: Syntax + `npm run check` = Link-/Anker-Check + Build) und `deploy.yml`/`preview.yml` führen vor dem Deploy `npm run check` aus. Branch-Schutz auf `main` ist im Free-Plan für private Repos nicht verfügbar (403) – nur mit GitHub Pro oder öffentlichem Repo möglich.
- `sync-from-gpt.yml` (täglich + manuell): `Vitaltrainer/website/dist` (ChatGPT web arbeitet dort) ist eine 1:1-Kopie von `src/`; weicht sie ab, wird `src/` per `rsync` aktualisiert und PR `sync/gpt` geöffnet. `scripts/check-invariants.mjs` (Teil von `npm run check`) fängt verlorene Pflichtbausteine ab. Braucht Secret `SYNC_TOKEN` (fine-grained PAT: Vitaltrainer Contents:read; dieses Repo Contents+Pull requests:write).
- `automerge.yml`: nach grünem `Check` mergen sich PRs von `sync/gpt` und `dependabot/*` selbst (Squash, mit `SYNC_TOKEN`, damit `deploy.yml` anspringt). Rote PRs bleiben liegen. Heißt: ChatGPT-Stand geht nach dem täglichen Sync ohne Review live, abgesichert nur durch `npm run check` (Invarianten, Links, Build).
- LLM-Doctor (lokal, `scripts/doctor.sh`, Timer `web-doctor.timer` Mo 07:00, Units in `ops/systemd/` nach `~/.config/systemd/user/` verlinkt): repariert einen roten `sync/gpt`-PR mit Kette claude (Haiku) → codex → agy; schreibt nur in `src/`, pusht erst nach grünem `npm run check`. Test: `scripts/doctor.sh --dir <klon>`. Skill: `~/Vitaltraining/skills/vitaltrainer-web-pipeline/`.
- Repo-Secrets: `FIREBASE_SERVICE_ACCOUNT` (JSON-Key eines dedizierten Deploy-Service-Accounts, nicht der Admin-SDK-Key) und `CLASPRC_JSON` (nur der `nimmdaniel`-Eintrag aus `~/.clasprc.json`).

### Service account (future Firestore/admin use)

A Firebase Admin service account key for `daniel-vitaltrainer` lives at `~/.env/vitaltrainer-service-account.json` (referenced from `~/.env/vitaltrainer.env`, following this machine's convention of centralizing service-account keys under `~/.env/` rather than inside any repo — see e.g. `core4.env`/`core4-service-account.json`). Not currently used by any code here; kept for when Firestore rules or another webapp gets added to this GCP project. Never place a copy of this key inside the repo itself.

## Architecture

- `src/` is the only source of truth — `index.html`, `styles.css`, `app.js`, `assets/hero.png`.
- `scripts/build.mjs` does a straight recursive copy of `src/` into `dist-firebase/`, then asserts that `index.html`, `styles.css`, `app.js`, and `assets/hero.png` exist in the output. There is no transformation, minification, or bundling step.
- Fonts (DM Sans, Manrope) sind selbst gehostet: variable `woff2` (Subset latin) in `src/assets/fonts/`, `@font-face` am Anfang von `styles.css`. Keine Verbindung zu Google Fonts – so lassen, sonst wird eine Einwilligung/Erwähnung in `datenschutz.html` nötig.
- `scripts/serve.mjs` is a minimal static file server (no dependencies) used for both `dev` (serves `src/`) and `preview` (serves `dist-firebase/`); it resolves paths against its root directory and rejects any path that escapes it.
- `firebase.json` points Hosting at `dist-firebase/`, sets long-lived cache headers for images/fonts, and sets baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) on all responses.
- `app.js` only handles the mobile nav toggle (hamburger button + closing the menu on link click) and the contact form's hidden-iframe submit flow — no Firestore or Auth wired in yet.
- `src/firebase-analytics.js` initializes Firebase Analytics via the Firebase JS SDK loaded straight from `gstatic.com` (no npm dependency, no bundler) — pinned to an exact version (check current with `npm view firebase version` before bumping). `firebaseConfig` there is not a secret (client-side Firebase config is meant to be public); loaded only after consent: `src/consent.js` (on every page) shows the banner and dynamically imports it on "Zustimmen" (choice in `localStorage` key `analytics-consent`). Analytics use is disclosed in `datenschutz.html` — keep that in sync if this changes.
