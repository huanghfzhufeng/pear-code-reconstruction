import { readFile, writeFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import { format } from "prettier";
const generate = generateModule.default || generateModule;
const ast = parse(await readFile("src/engine.js", "utf8"), {
  sourceType: "module",
});
const drop = new Set([
  "LOAD_CONCURRENCY",
  "loadFeeds",
  "activeLoads",
  "mediaStats",
  "enqueueFeed",
  "pumpLoads",
  "PREFETCH_DISTANCE",
  "pendingScenes",
  "activateSceneLoads",
  "registerSceneLoader",
  "FRAME_WINDOW",
  "createFrameFeed",
  "progressiveFrameOrder",
  "createSequence",
  "disableWarmup",
  "warmNeighbours",
  "createReel",
  "Tn",
  "En",
  "Dn",
  "On",
  "kn",
  "An",
  "jn",
  "installLocalForm",
  "FAQ_DATA",
]);
const name = (n) =>
  t.isFunctionDeclaration(n)
    ? n.id.name
    : t.isVariableDeclaration(n)
      ? n.declarations[0].id.name
      : null;
const replacements = {
  initFaq: `function initFaq(){gn=document.querySelector('.faq');_n=gn.querySelector('.faq-lead');vn=_n.querySelector('line');yn=_n.querySelector('rect');bn=[...gn.querySelectorAll('.fq')];}`,
  initForm: `function initForm(){if(!Vn)return;Kn=[...Vn.querySelectorAll('.cf-f,.cf-cta')];Kn.forEach((field,index)=>{field.addEventListener('pointerenter',()=>{qn=index;});field.addEventListener('pointerleave',()=>{if(qn===index)qn=-1;});const input=field.querySelector('input,textarea');if(input)field.addEventListener('click',()=>input.focus());});installLocalForm();}`,
};
let settings = [],
  engine = [];
let passedConfig = false;
for (const node of ast.program.body) {
  const id = name(node);
  if (drop.has(id)) continue;
  if (id === "installNavigation") passedConfig = true;
  if (replacements[id]) {
    engine.push(parse(replacements[id]).program.body[0]);
    continue;
  }
  if (
    !passedConfig &&
    !t.isImportDeclaration(node) &&
    id !== "installPointer"
  ) {
    if (t.isVariableDeclaration(node) || t.isFunctionDeclaration(node))
      settings.push(t.exportNamedDeclaration(node));
    else settings.push(node);
  } else engine.push(node);
}
const settingNames = settings.flatMap((n) =>
  t.isExportNamedDeclaration(n) ? [name(n.declaration)] : [],
);
engine.unshift(
  t.importDeclaration(
    settingNames.map((n) =>
      t.importSpecifier(t.identifier(n), t.identifier(n)),
    ),
    t.stringLiteral("./scene-config.js"),
  ),
);
for (const [file, names] of [
  ["./data/faq.js", ["FAQ_DATA"]],
  ["./form.js", ["installLocalForm"]],
  [
    "./media-loader.js",
    ["mediaStats", "activateSceneLoads", "createSequence", "createReel"],
  ],
])
  engine.unshift(
    t.importDeclaration(
      names.map((n) => t.importSpecifier(t.identifier(n), t.identifier(n))),
      t.stringLiteral(file),
    ),
  );
settings.unshift(
  t.importDeclaration(
    [t.importSpecifier(t.identifier("FAQ_DATA"), t.identifier("FAQ_DATA"))],
    t.stringLiteral("./data/faq.js"),
  ),
);
const header =
  "/** Editable scene choreography, adapted from the captured Pear reference. See docs/IMPLEMENTATION.md. */\n";
await writeFile(
  "src/scene-config.js",
  header +
    (await format(generate(t.file(t.program(settings))).code, {
      parser: "babel",
    })),
);
await writeFile(
  "src/engine.js",
  header +
    (await format(generate(t.file(t.program(engine))).code, {
      parser: "babel",
    })),
);
console.log(
  "Scene settings, frame scheduling and local form behavior separated.",
);
