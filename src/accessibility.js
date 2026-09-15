/** Make the cinematic layers expose the same active state to keyboard and AT. */
export function installSceneAccessibility() {
  const menu = document.querySelector(".menu"),
    panel = document.querySelector(".nvm");
  const observer = new MutationObserver(() => {
    if (menu.getAttribute("aria-expanded") === "true")
      panel.querySelector("a")?.focus({ preventScroll: true });
    else if (panel.contains(document.activeElement))
      menu.focus({ preventScroll: true });
  });
  observer.observe(menu, {
    attributes: true,
    attributeFilter: ["aria-expanded"],
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (menu.getAttribute("aria-expanded") !== "true" || event.key !== "Tab")
        return;
      const targets = [menu, ...panel.querySelectorAll("a")],
        i = targets.indexOf(document.activeElement);
      event.preventDefault();
      targets[
        (i + (event.shiftKey ? -1 : 1) + targets.length) % targets.length
      ].focus({ preventScroll: true });
    },
    true,
  );
  const layers = [
    ...document.querySelectorAll(
      ".faq,.fin-g,.pf-g,.ft,.col-head .bk,.col-stand .bk",
    ),
  ];
  const active = (element) => {
    for (let n = element; n && n.className !== "pin"; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (
        s.display === "none" ||
        s.visibility === "hidden" ||
        Number(s.opacity) < 0.025
      )
        return false;
    }
    return true;
  };
  const timer = setInterval(() => {
    if (window.__pearStopped) {
      clearInterval(timer);
      observer.disconnect();
      return;
    }
    for (const layer of layers) {
      const visible = active(layer);
      layer.setAttribute("aria-hidden", String(!visible));
      layer.inert = !visible;
    }
  }, 160);
}
