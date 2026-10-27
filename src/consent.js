// Einwilligung für Firebase Analytics: ohne "Zustimmen" wird firebase-analytics.js nie geladen.
const KEY = "analytics-consent";
const MEASUREMENT_ID = "G-WF4MC0VMV8";

const read = () => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
const write = (value) => {
  try { localStorage.setItem(KEY, value); } catch { /* ohne Speicher fragen wir eben erneut */ }
};

const loadAnalytics = () => import("/firebase-analytics.js");

const revoke = () => {
  window[`ga-disable-${MEASUREMENT_ID}`] = true;
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name.startsWith("_ga")) document.cookie = `${name}=; Max-Age=0; path=/`;
  }
};

const decide = (value, banner) => {
  write(value);
  banner?.remove();
  if (value === "granted") loadAnalytics();
  else revoke();
};

const showBanner = () => {
  document.querySelector(".consent")?.remove();
  const banner = document.createElement("div");
  banner.className = "consent";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Datenschutz-Einstellung");
  banner.innerHTML =
    '<p>Ich messe, wie die Seite genutzt wird (Firebase Analytics) – nur mit deinem Okay. ' +
    '<a href="/datenschutz.html">Mehr dazu</a></p>' +
    '<div><button type="button" data-choice="denied">Ablehnen</button>' +
    '<button type="button" data-choice="granted">Zustimmen</button></div>';
  banner.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-choice]")?.dataset.choice;
    if (choice) decide(choice, banner);
  });
  document.body.append(banner);
};

document.querySelectorAll("[data-consent-open]").forEach((el) =>
  el.addEventListener("click", showBanner)
);

const stored = read();
if (stored === "granted") loadAnalytics();
else if (stored !== "denied") showBanner();
