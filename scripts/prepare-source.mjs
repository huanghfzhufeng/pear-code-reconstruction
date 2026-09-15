// One-time, reproducible extraction of the captured scene mathematics.
// The browser never loads the captured bundle or React; this produces editable ES modules.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
import { format } from "prettier";
const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;
const source = await readFile(".reference/engine.js", "utf8");
const ast = parse(source, { sourceType: "module" });
const names = {
  d: "clamp",
  f: "smoothstep",
  p: "smootherstep",
  m: "easeOutQuart",
  h: "inverseSmoothstep",
  g: "contrastEase",
  _: "EASINGS",
  v: "readout",
  y: "platePosition",
  b: "pointer",
  x: "installPointer",
  ee: "paperLighting",
  S: "entranceClock",
  C: "reducedMotion",
  te: "coarsePointer",
  w: "HERO_VARIANTS",
  T: "MODEL_LENGTH",
  E: "WORK_LENGTH",
  ne: "CODA_LENGTH",
  re: "TERMS_LENGTH",
  ie: "GRAFT_LENGTH",
  ae: "FAQ_LENGTH",
  oe: "FLIGHT_LENGTH",
  se: "FORM_LENGTH",
  ce: "FOOTER_LENGTH",
  D: "HERO_RING_END",
  O: "REEL_END",
  k: "tear",
  A: "overlayExit",
  le: "tearOrigin",
  ue: "escape",
  j: "pushIn",
  M: "getTearIntersection",
  N: "paper",
  de: "closingBurn",
  fe: "PLAN_DURATION",
  pe: "PLAN_PLAYBACK",
  me: "PLAN_RETREAT",
  he: "PLAN_REVEAL",
  ge: "TERMS_INK_START",
  _e: "TERMS_SPLIT_START",
  ve: "GRAFT_PAUSE",
  ye: "GRAFT_EARLY_RATE",
  be: "graftTime",
  xe: "CODA_CROSSFADE",
  Se: "PAPER_START",
  P: "TERMS_ZOOM",
  Ce: "TERMS_EXIT_START",
  we: "TERMS_EXIT_DURATION",
  F: "FAQ_START",
  Te: "FAQ_DATA",
  Ee: "FAQ_ANCHORS",
  De: "FAQ_PLATE_SIZE",
  I: "formMotion",
  Oe: "FORM_FIELDS",
  ke: "STAR_POSITIONS",
  Ae: "ORBIT_GEOMETRY",
  je: "FOOTER_HOLD",
  Me: "MOBILE_TIMELINE",
  Ne: "toSceneProgress",
  Pe: "toScrollProgress",
  Fe: "footerTransition",
  Ie: "SECONDARY_EFFECTS",
  Le: "SECONDARY_STARTS",
  Re: "BEAT_LABELS",
  ze: "OVERLAY_LEFT",
  Be: "OVERLAY_RIGHT",
  Ve: "WORK_STAGE_HEIGHT",
  He: "BRIDGE_FRAME_ENDS",
  Ue: "mobileGraft",
  We: "mobileCoda",
  Ge: "mobileScaffold",
  Ke: "mobilePlan",
  qe: "MOBILE_TERMS_ZOOM",
  Je: "SIGNATURE_START",
  Ye: "mobileFlight",
  Xe: "mobileSignature",
  Ze: "mobileTerms",
  Qe: "mobileForm",
  $e: "WORK_BEATS",
  et: "WORK_DESIGN_WIDTH",
  tt: "WORK_DESIGN_HEIGHT",
  nt: "WORK_PANEL_STOPS",
  rt: "WORK_TICK_SPACING",
  it: "heroParameter",
  at: "selectedHero",
  L: "scrollState",
  ot: "lastProgrammaticScroll",
  st: "markProgrammaticScroll",
  R: "scrollRange",
  ct: "installNavigation",
  lt: "installApplyLinks",
  ut: "installMenu",
  dt: "LOAD_CONCURRENCY",
  ft: "loadFeeds",
  pt: "activeLoads",
  mt: "mediaStats",
  ht: "enqueueFeed",
  gt: "pumpLoads",
  _t: "PREFETCH_DISTANCE",
  vt: "pendingScenes",
  yt: "activateSceneLoads",
  bt: "registerSceneLoader",
  xt: "FRAME_WINDOW",
  St: "createFrameFeed",
  Ct: "progressiveFrameOrder",
  wt: "createSequence",
  Tt: "disableWarmup",
  Et: "warmNeighbours",
  Dt: "createReel",
  Ot: "STAGE_VERTEX",
  kt: "stageFragment",
  At: "FOOTER_VERTEX",
  jt: "FOOTER_FRAGMENT",
  Mt: "STAGE_UNIFORMS",
  Nt: "createStageRenderer",
  Yt: "initSampledGrid",
  Qt: "gridPalette",
  $t: "renderSampledGrid",
  cn: "splitHeadline",
  ln: "splitParagraph",
  un: "initOverlay",
  dn: "measureOverlay",
  fn: "startEntrance",
  pn: "renderHeadline",
  mn: "renderOverlay",
  xn: "initFaq",
  Cn: "renderFaq",
  wn: "exitFaq",
  Mn: "installLocalForm",
  dr: "drawFrame",
  Cr: "seedExitMotion",
  wr: "initFlight",
  Tr: "initForm",
  Er: "flightFraming",
  Dr: "renderFlight",
  Ar: "renderOrbits",
  Mr: "renderStars",
  Fr: "renderForm",
  Ir: "createFooterRenderer",
  Rr: "renderFooterTransition",
  zr: "renderFooterText",
  Br: "renderFooter",
  li: "initTerms",
  ui: "renderTerms",
  di: "renderSignature",
  Ci: "initWork",
  Ti: "renderWork",
  Ei: "exitWork",
  Oi: "initRail",
  ki: "renderRail",
  Hi: "profileStep",
  Ui: "profileFrame",
  Gi: "startScenes",
  Ni: "debugOptions",
  Wi: "started",
};
traverse(ast, {
  Program(p) {
    for (const [old, next] of Object.entries(names))
      if (p.scope.hasBinding(old)) p.scope.rename(old, next);
  },
});
// Split declarations so settings and shaders have their own source files.
ast.program.body = ast.program.body.flatMap((n) =>
  t.isVariableDeclaration(n)
    ? n.declarations.map((d) => t.variableDeclaration(n.kind, [d]))
    : [n],
);
const shaderNames = new Set([
  "STAGE_VERTEX",
  "stageFragment",
  "FOOTER_VERTEX",
  "FOOTER_FRAGMENT",
  "STAGE_UNIFORMS",
]);
const shaders = [],
  engine = [];
for (const n of ast.program.body) {
  if (t.isVariableDeclaration(n) && shaderNames.has(n.declarations[0].id.name))
    shaders.push(t.exportNamedDeclaration(n));
  else engine.push(n);
}
engine.unshift(
  t.importDeclaration(
    [...shaderNames].map((n) =>
      t.importSpecifier(t.identifier(n), t.identifier(n)),
    ),
    t.stringLiteral("./shaders/stage.js"),
  ),
);
engine.push(
  t.exportNamedDeclaration(null, [
    t.exportSpecifier(t.identifier("startScenes"), t.identifier("startScenes")),
  ]),
);
const header =
  "/**\n * Pear scene reconstruction, adapted from the live reference captured 2026-09-15.\n * Original visual direction and mathematical treatments: Pear AS.\n * This editable source is an internal technical study; no captured runtime is shipped.\n * Reference SHA and modifications are recorded in docs/IMPLEMENTATION.md.\n */\n";
await mkdir("src/shaders", { recursive: true });
await mkdir("src/components", { recursive: true });
await mkdir("src/data", { recursive: true });
await mkdir("src/styles", { recursive: true });
await writeFile(
  "src/shaders/stage.js",
  header +
    (await format(generate(t.file(t.program(shaders))).code, {
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
// Retain the exact vector paths and layout skeleton as build-time functions.
const all = await readFile(".reference/readable.js", "utf8");
let markup = all.slice(
  all.indexOf("function qi()"),
  all.lastIndexOf("(0, u.createRoot)"),
);
const ma = parse(markup, { sourceType: "module" });
traverse(ma, {
  CallExpression(p) {
    const c = p.node.callee;
    if (t.isSequenceExpression(c)) {
      const m = c.expressions.at(-1);
      if (
        t.isMemberExpression(m) &&
        m.object.name === "l" &&
        m.property.name === "useEffect"
      )
        p.replaceWith(t.numericLiteral(0));
    }
  },
  Program(p) {
    for (const [a, b] of Object.entries({
      qi: "SceneSurfaces",
      Xi: "Signature",
      Qi: "FaqShell",
      $i: "FlightSurfaces",
      aa: "Footer",
      oa: "Application",
      sa: "Terms",
      ca: "Work",
      la: "Menu",
      da: "Overlay",
      fa: "Scene",
      pa: "renderScene",
      V: "markup",
      at: "hero",
      Te: "FAQ_DATA",
    }))
      if (p.scope.hasBinding(a)) p.scope.rename(a, b);
  },
});
// Unbound imports are intentionally explicit.
let markupCode = generate(ma)
  .code.replaceAll("V.jsx", "markup.jsx")
  .replaceAll("V.jsxs", "markup.jsxs")
  .replaceAll("V.Fragment", "markup.Fragment")
  .replaceAll("at.poster", "hero.poster")
  .replaceAll("Te.map", "FAQ_DATA.map");
const faqDecl = ast.program.body.find(
  (n) => t.isVariableDeclaration(n) && n.declarations[0].id.name === "FAQ_DATA",
);
await writeFile(
  "src/data/faq.js",
  await format(generate(t.exportNamedDeclaration(faqDecl)).code, {
    parser: "babel",
  }),
);
await writeFile(
  "src/components/scene.js",
  header +
    'import {markup} from "./html.js";\nimport {FAQ_DATA} from "../data/faq.js";\nconst hero={poster:"/films/signal-poster.jpg"};\n' +
    (await format(markupCode + "\nexport {renderScene};", { parser: "babel" })),
);
console.log(
  "Extracted editable scene code, procedural shaders, and build-time markup; React runtime omitted.",
);
