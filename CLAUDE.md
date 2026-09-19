# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A standalone, dependency-free static site (Daniel's Vitaltrainer profile page) deployed to Firebase Hosting. No framework, no bundler, no npm dependencies — just hand-written `index.html`/`styles.css`/`app.js` and two Node scripts that copy/serve those files.

## Commands

```bash
npm run dev      # serve src/ live at http://localhost:4173
npm run build    # copy src/ -> dist/, verify required files exist
npm run preview  # serve the built dist/ at http://localhost:4173
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

## Architecture

- `src/` is the only source of truth — `index.html`, `styles.css`, `app.js`, `assets/hero.png`.
- `scripts/build.mjs` does a straight recursive copy of `src/` into `dist/`, then asserts that `index.html`, `styles.css`, `app.js`, and `assets/hero.png` exist in the output. There is no transformation, minification, or bundling step.
- `scripts/serve.mjs` is a minimal static file server (no dependencies) used for both `dev` (serves `src/`) and `preview` (serves `dist/`); it resolves paths against its root directory and rejects any path that escapes it.
- `firebase.json` points Hosting at `dist/`, sets long-lived cache headers for images/fonts, and sets baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) on all responses.
- `app.js` only handles the mobile nav toggle (hamburger button + closing the menu on link click) — there is intentionally no Firebase Web SDK, Firestore, or Auth wired in yet.
