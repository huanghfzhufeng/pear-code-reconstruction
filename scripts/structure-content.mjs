// One-time migration from the captured layout into data-driven components.
import { readFile, writeFile } from "node:fs/promises";
import { parseFragment } from "parse5";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import { format } from "prettier";
import { renderScene } from "../src/components/scene.js";
const traverse = traverseModule.default || traverseModule,
  generate = generateModule.default || generateModule;
const dom = parseFragment(renderScene().html);
const cls = (n, c) =>
  (n.attrs?.find((x) => x.name === "class")?.value || "")
    .split(" ")
    .includes(c);
const all = (n, c) => [
  ...(cls(n, c) ? [n] : []),
  ...(n.childNodes || []).flatMap((x) => all(x, c)),
];
const one = (n, c) => all(n, c)[0];
const text = (n) =>
  n?.nodeName === "#text" ? n.value : (n?.childNodes || []).map(text).join("");
const lines = (n) => all(n, "ln").map((n) => text(n).trim());
const heads = all(one(dom, "col-head"), "bk"),
  stands = all(one(dom, "col-stand"), "stand");
const data = {
  hero: {
    title: text(one(heads[0], "ln")),
    subtitle: lines(one(heads[0], "subhead")),
    cta: "Request Partnership",
    intro: text(stands[0]),
  },
  beats: heads
    .slice(1)
    .map((n, i) => ({
      titleLines: lines(n),
      description: text(stands[i + 1]),
    })),
  work: all(dom, "pf-g").map((n) => ({
    label: text(one(n, "pf-chip")),
    titleLines: lines(one(n, "pf-h")),
    body: text(one(n, "pf-b")),
  })),
  terms: all(dom, "fin-g").map((n) => ({
    titleLines: lines(one(n, "fin-h")),
    lead: text(one(n, "fin-l")),
    disclosure: text(one(n, "fin-s")),
  })),
  disclosureLabel: "Full disclosure",
  application: {
    label: "The application",
    intro: text(one(dom, "cf-lead").childNodes.find((n) => n.tagName === "p")),
    submit: "Send the application",
  },
  footer: {
    lines: lines(one(dom, "ft-tag")),
    company: text(all(dom, "ft-meta")[0]),
    email: text(all(dom, "ft-meta")[1]),
  },
  chapters: [
    { id: "model", label: "The Model", at: 0.012 },
    { id: "work", label: "The Work", at: 0.232 },
    { id: "terms", label: "The Terms", at: 0.4 },
    { id: "questions", label: "Questions", at: 0.628 },
  ],
  beatLabels: [
    "At your service",
    "Custom software",
    "Search and links",
    "Revenue share",
  ],
};
await writeFile(
  "src/data/site.js",
  await format("export const CONTENT = " + JSON.stringify(data) + ";", {
    parser: "babel",
  }),
);
const strings = new Map();
function collect(x, path = []) {
  if (typeof x === "string" && x.length > 3) strings.set(x, path);
  else if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) collect(v, [...path, k]);
}
collect(data);
let ast = parse(await readFile("src/components/scene.js", "utf8"), {
  sourceType: "module",
});
const drop = new Set(["Terms", "Work", "Menu", "Application", "FaqShell"]);
ast.program.body = ast.program.body.filter(
  (n) => !t.isFunctionDeclaration(n) || !drop.has(n.id.name),
);
ast.program.body.unshift(
  t.importDeclaration(
    [...drop].map((n) => t.importSpecifier(t.identifier(n), t.identifier(n))),
    t.stringLiteral("./collections.js"),
  ),
  t.importDeclaration(
    [t.importSpecifier(t.identifier("CONTENT"), t.identifier("CONTENT"))],
    t.stringLiteral("../data/site.js"),
  ),
);
const member = (path) =>
  path.reduce(
    (n, k) =>
      t.memberExpression(
        n,
        /^\d+$/.test(k) ? t.numericLiteral(Number(k)) : t.identifier(k),
        /^\d+$/.test(k),
      ),
    t.identifier("CONTENT"),
  );
traverse(ast, {
  TemplateLiteral(p) {
    if (p.node.expressions.length) return;
    const value = p.node.quasis[0].value.cooked;
    const path = strings.get(value);
    if (path) p.replaceWith(member(path));
  },
});
await writeFile(
  "src/components/scene.js",
  await format(generate(ast).code, { parser: "babel" }),
);
console.log(
  "Content separated:",
  data.work.length,
  "service panels,",
  data.terms.length,
  "terms panels,",
  data.chapters.length,
  "chapters.",
);
