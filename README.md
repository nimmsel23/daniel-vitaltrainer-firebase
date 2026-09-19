# Daniel Vitaltraining – Firebase-Frontend

Die aktuelle Vitaltrainer-Website als eigenständiges Node-Projekt für Firebase Hosting.

## Voraussetzungen

- Node.js 20 oder neuer
- ein Firebase-Projekt
- Firebase CLI (`npm install -g firebase-tools`) oder Nutzung über `npx`

## Lokal starten

```bash
npm run dev
```

Danach ist die Seite unter `http://localhost:4173` erreichbar.

## Produktions-Build

```bash
npm run build
npm run preview
```

Der fertige Stand liegt anschließend in `dist/`.

## Firebase einmalig verbinden

```bash
firebase login
firebase use --add
```

Dabei das gewünschte Firebase-Projekt auswählen und als Alias `default` verwenden. Die erzeugte `.firebaserc` bleibt lokal und wird nicht mit veröffentlicht.

Alternativ kann `.firebaserc.example` kopiert, in `.firebaserc` umbenannt und die Projekt-ID eingetragen werden.

## Veröffentlichen

```bash
npm run deploy
```

## Aufbau

```text
src/
  index.html
  styles.css
  app.js
  assets/hero.png
scripts/
  build.mjs
  serve.mjs
firebase.json
package.json
```

Die Seite benötigt derzeit bewusst kein Firebase-Web-SDK: Sie ist eine schnelle statische Profilseite. Firestore, Authentication oder ein Kontaktformular können später gezielt ergänzt werden.
