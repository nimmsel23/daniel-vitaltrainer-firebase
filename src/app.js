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
