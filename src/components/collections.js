import { CONTENT } from "../data/site.js";
import { FAQ_DATA } from "../data/faq.js";
import { escapeHtml as esc } from "./html.js";
const raw = (html) => ({ html });
const lines = (values) =>
  values.map((text) => `<span class="ln"><i>${esc(text)}</i></span>`).join("");
const STAR =
  "M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z";
const star = (position) =>
  `<span class="st ${position}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}"/></svg></span>`;
const termsLayout = [
  { head: 540, lead: 545, detail: 315 },
  { head: 614, lead: 595, detail: 338 },
];
export function Terms() {
  return raw(
    `<div class="fin">${CONTENT.terms.map((item, i) => `<div class="fin-g" data-f="${i}"><div class="fin-top"><div class="fin-soak"><h2 class="fin-h" style="width:${termsLayout[i].head}px">${lines(item.titleLines)}</h2></div></div><div class="fin-bot"><div class="fin-soak"><p class="fin-l" style="width:${termsLayout[i].lead}px">${esc(item.lead)}</p><div class="fin-row"><span class="fin-chip"><b>${esc(CONTENT.disclosureLabel)}</b></span><p class="fin-s" style="width:${termsLayout[i].detail}px">${esc(item.disclosure)}</p></div></div></div></div>`).join("")}</div>`,
  );
}
export function Work() {
  return raw(
    `<div class="pf"><div class="pf-in"><svg class="pf-lines" viewBox="0 0 1328 3515" fill="none" aria-hidden="true"><g class="pf-ticks"></g></svg><i class="pf-head"><b></b></i></div><div class="pf-fix">${CONTENT.work.map((item, i) => `<div class="pf-g pf-g--fix" data-g="${i}" style="width:${i === 2 ? 384 : 360}px;--gap:${[14, 13, 17][i]}px"><span class="pf-chip" style="width:${i === 2 ? 104 : 168}px"><b>${esc(item.label)}</b></span><h2 class="pf-h" style="width:${i === 2 ? 384 : 280}px">${lines(item.titleLines)}</h2><p class="pf-b" style="${i === 2 ? "width:360px;" : ""}margin-top:${[26, 25, 27][i]}px">${esc(item.body)}</p></div>`).join("")}</div></div>`,
  );
}
export function Menu() {
  return raw(
    `<nav class="nvm" id="nvm" aria-label="Chapters menu" aria-hidden="true" inert>${CONTENT.chapters.map((c, i) => `<a href="#${c.id}" data-at="${c.at}"><b>Ch. ${i + 1}</b><em>${esc(c.label)}</em></a>`).join("")}</nav>`,
  );
}
export function FaqShell() {
  return raw(
    `<section class="faq" aria-label="Asked before"><svg class="faq-lead" fill="none" aria-hidden="true"><line x1="0" y1="0" x2="0" y2="0"/><rect width="8" height="8" x="-99" y="-99"/></svg>${FAQ_DATA.map(([q, , a]) => `<article class="fq"><span class="fr"></span>${star("a")}${star("b")}<h3>${esc(q)}</h3><p>${esc(a)}</p></article>`).join("")}</section>`,
  );
}
export const FIELD_SPEC = [
  {
    name: "name",
    key: "name",
    label: "Your name",
    type: "text",
    limit: 100,
    geometry: [452, 148, 236, 62],
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0",
  },
  {
    name: "email",
    key: "email",
    label: "Work email",
    type: "email",
    limit: 254,
    geometry: [712, 148, 236, 62],
    icon: "M2.5 6.5h19v11h-19zM2.5 7l9.5 6.5L21.5 7",
  },
  {
    name: "message",
    key: "grow",
    label: "What do you want to grow?",
    type: "area",
    limit: 5000,
    geometry: [452, 226, 496, 226],
    icon: "M3 5.5h18v11H9l-5 4v-4H3z",
  },
];
export function formMarkup({ cinematic = false, prefix = "application" } = {}) {
  return `<form class="${cinematic ? "cf-in" : "reader-form"}" data-local-form action="/api/apply" method="post" aria-label="Local review application">${FIELD_SPEC.map(
    (f) => {
      const id = `${prefix}-${f.key}`;
      const [left, top, width, height] = f.geometry;
      return `<div class="${cinematic ? "cf-f" + (f.type === "area" ? "" : " pill") : "reader-field"}"${cinematic ? ` style="left:${left}px;top:${top}px;width:${width}px;height:${height}px"` : ""}><label class="${cinematic ? "sr-only" : ""}" for="${id}">${esc(f.label)}</label>${cinematic ? `<span class="rim"></span><span class="rim2"></span><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${f.icon}"/></svg></span>` : ""}${f.type === "area" ? `<textarea id="${id}" name="${f.name}" data-k="${f.key}" rows="4" maxlength="${f.limit}" required placeholder="${esc(f.label)}"></textarea>` : `<input id="${id}" name="${f.name}" data-k="${f.key}" type="${f.type}" autocomplete="${f.type === "email" ? "email" : "name"}" maxlength="${f.limit}" required placeholder="${esc(f.label)}">`}</div>`;
    },
  ).join(
    "",
  )}<button class="${cinematic ? "cf-cta" : "reader-submit"}" type="submit" disabled${cinematic ? ' style="left:452px;top:486px;width:262px;height:40px"' : ""}>${esc(CONTENT.application.submit)}</button><p class="form-status" role="status" aria-live="polite"></p><noscript><p>To submit to the local review inbox, enable JavaScript. No application has been sent.</p></noscript></form>`;
}
export function Application() {
  return raw(
    `<section class="cf" aria-label="Application" aria-hidden="true" inert><svg class="cf-orb" fill="none" aria-hidden="true"><ellipse/><ellipse/><ellipse/></svg><div class="cf-gl" aria-hidden="true"></div><div class="cf-lead"><b>${esc(CONTENT.application.label)}</b><p>${esc(CONTENT.application.intro)}</p></div>${formMarkup({ cinematic: true })}</section>`,
  );
}
export function readerMarkup() {
  return `<main class="reader" id="readable"><header class="reader-hero"><img src="/films/signal-poster.jpg" width="1920" height="1080" alt="A painted figure holds a golden pear above a marble column."/><div><p class="reader-eyebrow">Pear · internal reconstruction</p><h1>${esc(CONTENT.hero.title)}</h1><p>${esc(CONTENT.hero.subtitle.join(" "))}</p><a class="reader-submit" href="#reader-application">${esc(CONTENT.hero.cta)} →</a></div></header><nav class="reader-nav" aria-label="Chapters">${CONTENT.chapters.map((c) => `<a href="#reader-${c.id}">${esc(c.label)}</a>`).join("")}</nav><section id="reader-model"><p class="reader-eyebrow">01 · The Model</p><h2>We build it. We rank it.</h2><p class="reader-lead">${esc(CONTENT.hero.intro)}</p>${CONTENT.beats.map((b) => `<h3>${esc(b.titleLines.join(" "))}</h3><p>${esc(b.description)}</p>`).join("")}</section><section id="reader-work"><p class="reader-eyebrow">02 · The Work</p>${CONTENT.work.map((c) => `<h2>${esc(c.titleLines.join(" "))}</h2><p>${esc(c.body)}</p>`).join("")}</section><section id="reader-terms"><p class="reader-eyebrow">03 · The Terms</p>${CONTENT.terms.map((c) => `<h2>${esc(c.titleLines.join(" "))}</h2><p class="reader-lead">${esc(c.lead)}</p><p>${esc(c.disclosure)}</p>`).join("")}</section><section id="reader-questions"><p class="reader-eyebrow">04 · Questions</p><h2>Asked before signing</h2>${FAQ_DATA.map(([q, , a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section><section id="reader-application"><p class="reader-eyebrow">${esc(CONTENT.application.label)}</p><h2>Tell us where you want to grow.</h2><p>${esc(CONTENT.application.intro)}</p>${formMarkup({ prefix: "reader" })}</section><footer><p>${esc(CONTENT.footer.lines.join(" "))}</p><p>${esc(CONTENT.footer.company)}</p><p>${esc(CONTENT.footer.email)}</p><a href="/review/">复刻对照与文档</a></footer></main>`;
}
