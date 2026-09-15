import { installLocalForm } from "./form.js";
import { installSceneAccessibility } from "./accessibility.js";
const query = new URLSearchParams(location.search);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const notice = document.querySelector("#experience-notice");
function reader(reason) {
  window.__pearStopped = true;
  root.classList.remove("is-enhanced");
  document.querySelector("#cinematic").setAttribute("aria-hidden", "true");
  root.style.overflow = "";
  document.querySelectorAll("video").forEach((v) => {
    v.pause();
    v.removeAttribute("src");
    v.load();
  });
  if (reason) {
    notice.textContent = reason;
    notice.hidden = false;
  }
}
installLocalForm();
if (
  !reduced.matches &&
  query.get("reader") !== "1" &&
  !navigator.connection?.saveData
) {
  try {
    const poster = document.querySelector(".boot");
    const hero = ["signal", "colossus", "reveal"].includes(query.get("hero"))
      ? query.get("hero")
      : "signal";
    poster.src = `/films/${hero}-poster.jpg`;
    poster.width = 1920;
    poster.height = 1080;
    document.querySelector(".reader-hero img").src = poster.src;
    document.querySelector(".reader-hero img").alt = {
      signal: "A painted figure holds a golden pear above a marble column.",
      colossus:
        "Painted figures tend a monumental golden pear on a marble pedestal.",
      reveal: "A painted figure draws back a curtain against a blue sky.",
    }[hero];
    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl")) throw new Error("WebGL unavailable");
    const { startScenes } = await import("./engine.js");
    root.classList.add("is-enhanced");
    document.querySelector("#cinematic").removeAttribute("aria-hidden");
    startScenes();
    installSceneAccessibility();
    const heroVideo = document.querySelector("video.src");
    setTimeout(() => {
      if (
        heroVideo.readyState < 2 &&
        !window.__pearStopped &&
        (window.__READOUT?.raw || 0) < 0.01
      )
        reader(
          "The film is taking too long to load. The complete site is available below.",
        );
    }, 8000);
    heroVideo.addEventListener("error", () =>
      reader("The film could not load. The complete site is available below."),
    );
    document.querySelectorAll("canvas").forEach((c) =>
      c.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        reader(
          "The visual renderer stopped. The complete site is available below.",
        );
      }),
    );
  } catch (error) {
    reader(
      "The visual experience is unavailable. The complete site is available below.",
    );
    console.error("Pear enhancement failed:", error.message);
  }
}
reduced.addEventListener("change", (e) => {
  if (e.matches) reader();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden)
    document.querySelectorAll("video").forEach((v) => v.pause());
});
let mediaErrors = 0;
window.addEventListener("pear:media-error", () => {
  mediaErrors++;
  if (mediaErrors === 3) {
    notice.replaceChildren();
    const link = document.createElement("a");
    link.href = "?reader=1";
    link.textContent =
      "Some imagery did not load. Read the complete site without motion →";
    notice.append(link);
    notice.hidden = false;
  }
});
