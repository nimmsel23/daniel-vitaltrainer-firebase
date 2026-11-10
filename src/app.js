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

/** Hash-Ziele nach Layout (Fonts/Bilder) ansteuern — sonst landet #angebot oft unter der Nav. */
function scrollToHash(behavior = "smooth") {
  const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior, block: "start" });
}

window.addEventListener("hashchange", () => scrollToHash("smooth"));
window.addEventListener("load", () => {
  if (location.hash) {
    requestAnimationFrame(() => scrollToHash("auto"));
  }
});

const contactForm = document.querySelector("#contact-form");
const contactTarget = document.querySelector('iframe[name="contact-target"]');
const contactStatus = contactForm?.querySelector(".contact-form-status");

if (contactForm && contactTarget && contactStatus) {
  let submitted = false;

  contactForm.addEventListener("submit", () => {
    submitted = true;
    contactStatus.hidden = true;
    const button = contactForm.querySelector("button[type=submit]");
    if (button) button.disabled = true;
  });

  contactTarget.addEventListener("load", () => {
    if (!submitted) return;
    submitted = false;
    contactStatus.hidden = false;
    contactStatus.textContent = "Danke! Deine Nachricht ist bei mir angekommen – ich melde mich zeitnah.";
    contactForm.reset();
    const button = contactForm.querySelector("button[type=submit]");
    if (button) button.disabled = false;
  });
}
