const button = document.querySelector(".menu");
const navigation = document.querySelector("nav");

button?.addEventListener("click", () => {
  const isOpen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isOpen));
  navigation?.classList.toggle("open");
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
  });
});

// Conversion-Events (laufen nur, wenn Analytics per Einwilligung geladen wurde)
const track = (name, params = {}) => {
  if (window.vtTrack) window.vtTrack(name, params);
  else if (localStorage.getItem("analytics-consent") === "granted") (window.vtTrackQueue ||= []).push([name, params]);
};

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href") || "";
  if (href.startsWith("tel:")) track("contact_click", { method: "phone" });
  else if (href.startsWith("mailto:")) track("contact_click", { method: "email" });
  if (link.dataset.cta) track("cta_click", { cta: link.dataset.cta });
  const topic = link.dataset.topic;
  const message = document.querySelector('#contact-form textarea[name="message"]');
  if (topic && message && !message.value.trim()) {
    message.value = `Ich interessiere mich für: ${topic}\nMein Ziel: \nZeitlich passt mir: `;
    track("select_offer", { topic });
  }
});

const contactForm = document.getElementById("contact-form");
contactForm?.addEventListener("focusin", () => track("contact_form_start"), { once: true });
// Für den Newsletter ist die E-Mail Pflicht, sonst nicht.
contactForm?.newsletter?.addEventListener("change", () => {
  contactForm.email.required = contactForm.newsletter.checked;
});
// Herkunft der Anfrage ohne Cookies: UTM-Quelle oder verweisende Website, sonst "direkt".
const requestSource = () => {
  const utm = new URLSearchParams(location.search).get("utm_source");
  if (utm) return utm;
  try {
    const ref = new URL(document.referrer).hostname;
    if (ref && ref !== location.hostname) return ref.replace(/^www\./, "");
  } catch { /* kein Referrer */ }
  return "direkt";
};
contactForm?.addEventListener("submit", () => {
  if (contactForm.src) contactForm.src.value = requestSource();
  if (contactForm.page) contactForm.page.value = location.pathname;
  track("generate_lead", { form: "kontakt", newsletter: contactForm.newsletter?.checked ? "ja" : "nein" });
});

const pricing = document.querySelector("#dienstleistungsangebot, .service-pricing");
if (pricing && "IntersectionObserver" in window) {
  const seen = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { track("view_pricing"); seen.disconnect(); }
  }, { threshold: 0.4 });
  seen.observe(pricing);
}
