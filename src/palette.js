/** Canvas reads the same semantic palette as CSS; it does not own another theme. */
function resolved(name) {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  probe.hidden = true;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}
export const canvasPalette = {
  ink: resolved("--ink"),
  light: resolved("--on-dark"),
  inkRule: resolved("--rule-on-light"),
  lightRule: resolved("--rule-on-dark"),
};
export const inkChannels = canvasPalette.ink
  .match(/[\d.]+/g)
  .slice(0, 3)
  .map(Number);
export const lightChannels = canvasPalette.light
  .match(/[\d.]+/g)
  .slice(0, 3)
  .map(Number);
