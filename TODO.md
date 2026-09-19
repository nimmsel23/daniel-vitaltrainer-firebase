# TODO

Offene Punkte aus dem Aufbau am 2026-09-19/20, nicht sicherheits- oder blockierend-kritisch, aber nicht vergessen.

## Rechtliches / Impressum

- [ ] Vollständige Postanschrift ins Impressum eintragen, sobald die Seite wirklich öffentlich beworben wird (aktuell nur "Wien, Österreich" + "auf Anfrage").
- [ ] Falls sich der AMS-/Erwerbsstatus ändert (Gewerbeanmeldung, echte Einkünfte über die Seite): Impressum-Abschnitt "Zweck dieser Website" entsprechend anpassen — aktuell explizit als unbezahltes Ausbildungsprojekt formuliert.

## Datenschutz / Cookies

- [ ] **Cookie-Consent-Banner fehlt.** Firebase Analytics setzt Cookies, ohne dass Besucher vorher zustimmen — nach DSGVO/ePrivacy in Österreich für nicht-essenzielle Analytics-Cookies eigentlich ein Opt-in-Banner nötig (nicht nur ein Datenschutz-Absatz mit Opt-out-Link). Aktuell nicht umgesetzt, im Datenschutztext ehrlich als "Widerspruch möglich" statt "Zustimmung nötig" formuliert — sollte nachgezogen werden, sobald die Seite echten Traffic bekommt.

## Kontaktformular / GAS

- [ ] Test-Mails im Postfach aufräumen (Betreff "Kontaktanfrage von Setup-Test...", 5 Stück in INBOX, 2026-09-19).
- [ ] Bei künftigen Code-Änderungen an `gas/contact-form/`: `clasp update-deployment -u nimmdaniel <deploymentId>` nutzen, nicht `create-deployment` (sonst ändert sich die Exec-URL und `index.html` zeigt ins Leere). Aktuelle Deployment-ID: siehe `clasp list-deployments -u nimmdaniel`.

## GCP / Service Account

- [ ] `~/.env/vitaltrainer-service-account.json` ist aktuell ungenutzt — vorgehalten für spätere Firestore-Rules/Admin-Zugriffe, falls weitere WebApps ins Projekt `daniel-vitaltrainer` kommen. Kein akuter Handlungsbedarf, nur nicht vergessen dass er existiert.

## Firebase-Ideen (nicht priorisiert, nur falls Bedarf entsteht)

- [ ] Kontaktanfragen zusätzlich in Firestore ablegen (Historie statt nur Mail-Inbox).
- [ ] Firebase Auth + Klienten-Bereich, falls digitale Trainingspläne/Fortschritt für echte Klienten gebraucht werden — eher an `~/vital`-Klienten-System andocken als parallel neu bauen.
- [ ] Kontaktformular ggf. auf Cloud Functions umziehen statt GAS, falls die Abhängigkeit vom zweiten Google-Account (`nimmdaniel`) und Apps-Script-Ökosystem stört.

## SEO (niedrige Priorität)

- [ ] OG/Twitter-Meta-Tags für Link-Previews.
- [ ] `robots.txt` / `sitemap.xml`.

## Repo

- [ ] Kein Git-Remote — nur lokales Backup. Remote (GitHub o.ä.) anlegen, falls das Repo nicht nur auf diesem Rechner existieren soll.
