/** Build-time HTML, not a client-side virtual DOM. */
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const unitless = new Set([
  "opacity",
  "zIndex",
  "fontWeight",
  "lineHeight",
  "flex",
  "order",
]);
const voidTags = new Set([
  "img",
  "input",
  "br",
  "hr",
  "meta",
  "link",
  "source",
]);
export function html(type, props = {}) {
  if (typeof type === "function") return type(props);
  const render = (v) =>
    Array.isArray(v)
      ? v.map(render).join("")
      : v == null || v === false
        ? ""
        : typeof v === "object" && v.html !== undefined
          ? v.html
          : escapeHtml(v);
  const content =
    props.dangerouslySetInnerHTML?.__html ?? render(props.children);
  if (!type) return { html: content };
  const attrs = Object.entries(props)
    .filter(
      ([k, v]) =>
        !["children", "key", "ref", "dangerouslySetInnerHTML"].includes(k) &&
        v !== undefined &&
        v !== null &&
        v !== false,
    )
    .map(([k, v]) => {
      if (k === "style")
        v = Object.entries(v)
          .map(
            ([key, value]) =>
              `${key.replace(/[A-Z]/g, (x) => "-" + x.toLowerCase())}:${value}${typeof value === "number" && value !== 0 && !unitless.has(key) && !key.startsWith("--") ? "px" : ""}`,
          )
          .join(";");
      const name =
        {
          className: "class",
          htmlFor: "for",
          fetchPriority: "fetchpriority",
          tabIndex: "tabindex",
          playsInline: "playsinline",
          autoPlay: "autoplay",
          strokeWidth: "stroke-width",
          strokeMiterlimit: "stroke-miterlimit",
          strokeLinecap: "stroke-linecap",
          colorInterpolationFilters: "color-interpolation-filters",
        }[k] || k;
      return v === true ? ` ${name}` : ` ${name}="${escapeHtml(v)}"`;
    })
    .join("");
  return {
    html: `<${type}${attrs}>${voidTags.has(type) ? "" : content + `</${type}>`}`,
  };
}
export const markup = { jsx: html, jsxs: html, Fragment: "" };
