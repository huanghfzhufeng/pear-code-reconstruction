import { CONTENT } from "./data/site.js";
import { paper } from "./data/paper.js";
export { paper };
/** Editable scene choreography, adapted from the captured Pear reference. See docs/IMPLEMENTATION.md. */
import { FAQ_DATA } from "./data/faq.js";
export const clamp = (e2, t2, n2) => Math.min(Math.max(e2, t2), n2);
export const smoothstep = (e2) => e2 * e2 * (3 - 2 * e2);
export const smootherstep = (e2) => e2 * e2 * e2 * (e2 * (e2 * 6 - 15) + 10);
export const easeOutQuart = (e2) => 1 - (1 - e2) ** 4;
export const inverseSmoothstep = (e2) =>
  0.5 - Math.sin(Math.asin(1 - 2 * clamp(e2, 0, 1)) / 3);
export const contrastEase = (e2, t2) => {
  if (t2 <= 1.001) return e2;
  let n2 = e2 ** +t2;
  return n2 / (n2 + (1 - e2) ** t2);
};
export const EASINGS = [
  {
    n: `smooth`,
    f: (e2) => e2 * e2 * (3 - 2 * e2),
  },
  {
    n: `smoother`,
    f: (e2) => e2 * e2 * e2 * (e2 * (e2 * 6 - 15) + 10),
  },
  {
    n: `out-quart`,
    f: (e2) => 1 - (1 - e2) ** 4,
  },
  {
    n: `out-expo`,
    f: (e2) => (e2 >= 1 ? 1 : 1 - 2 ** (-9 * e2)),
  },
  {
    n: `out-back`,
    f: (e2) => {
      let t2 = 1 - e2;
      return 1 - t2 * t2 * t2 * (2.7 * t2 - 1.7);
    },
  },
  {
    n: `in-out`,
    f: (e2) => (e2 < 0.5 ? 4 * e2 * e2 * e2 : 1 - (-2 * e2 + 2) ** 3 / 2),
  },
  {
    n: `linear`,
    f: (e2) => e2,
  },
];
export const readout = {
  plan: 0,
  p: 0,
  g: 0,
  off: 0,
  lockEnd: 0,
  push: 0,
  burn: 0,
  coda: 0,
  end: 0,
  ink: 0,
  pan: 0,
};
window.__READOUT = readout;
export var platePosition = {
  x: 0,
};
export var pointer = {
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
};
export var paperLighting = {
  lit: false,
};
export var entranceClock = {
  t0: -1,
};
export var reducedMotion = matchMedia(
  `(prefers-reduced-motion: reduce)`,
).matches;
export var coarsePointer = matchMedia(`(pointer: coarse)`).matches;
export var HERO_VARIANTS = [
  {
    id: `signal`,
    src: `/films/signal.mp4`,
    poster: `/films/signal-poster.jpg`,
    origin: [0.707, 0.926],
    pos: [0.72, 0.72, 1],
    bridge: `v28`,
  },
  {
    id: `colossus`,
    src: `/films/colossus.mp4`,
    poster: `/films/colossus-poster.jpg`,
    origin: [0.732, 0.54],
    pos: [0.72, 0.6, 1],
    bridge: `v51`,
  },
  {
    id: `reveal`,
    src: `/films/reveal.mp4`,
    poster: `/films/reveal-poster.jpg`,
    origin: [0.84, 0.63],
    pos: [0.72, 0.62, 1],
    bridge: `v61`,
  },
];
export var MODEL_LENGTH = 1200 / 5350;
export var WORK_LENGTH = 600 / 5350;
export var CODA_LENGTH = 300 / 5350;
export var TERMS_LENGTH = 900 / 5350;
export var GRAFT_LENGTH = 300 / 5350;
export var FAQ_LENGTH = 600 / 5350;
export var FLIGHT_LENGTH = 500 / 5350;
export var FORM_LENGTH = 250 / 5350;
export var FOOTER_LENGTH = 700 / 5350;
export var HERO_RING_END = 0.04;
export var REEL_END = 0.76;
export var tear = {
  at: 0.775,
  len: 0.14,
  x: 0.48,
  y: 0.57,
  ax: 2.35,
  ay: 1.1,
  noise: 0.295,
  grain: 0.125,
  dither: 0.052,
  hash: 0.15,
  char: 0,
  charW: 0.31,
  glowW: 0.0104,
  glowH: 5,
  split: 0.4,
  e0: -0.16,
  e1: 1.3,
  fx: 1,
  fxAt: 0,
  fxLen: 0.75,
  zoom: 0,
  zoomPan: 0.34,
  zoomAt: 0.25,
  shape: 1,
  dx: 20,
  dy: 75,
  seam: 0.85,
  seamW: 0.2,
  seamH: 0.62,
  seamSoft: 0.055,
  reelZ: 0.6,
  zAt: 0.8,
  zLin: 0.38,
};
export var overlayExit = {
  over: 0.1,
  len: 0.105,
  w: 6.45,
  h: 15.7,
  hold: 0.45,
  fade: 0.55,
  ret: 0.26,
  retLen: 0.82,
  e: 0,
  auto: 0,
  lead: -0.04,
  ease: 2.25,
};
export var tearOrigin = {
  x: 0.48,
  y: 0.57,
};
export var escape = {
  driftX: 0.03,
  driftY: -0.018,
  mblur: 0.012,
  edgeBl: 0.01,
  edgeAt: 0.55,
};
export var pushIn = {
  zoom: 2,
  at: 0.59,
  lin: 0.96,
  spin: 0.13,
  part: 0.05,
  lag: 0.58,
};
export var getTearIntersection = () => {
  let e2 = (overlayExit.w / 100) * tear.ax,
    t2 = (overlayExit.h / 100) * tear.ay;
  return clamp(
    ((tear.shape === 2
      ? e2 + t2
      : tear.shape === 0
        ? Math.hypot(e2, t2)
        : tear.shape === 3
          ? (e2 ** 4 + t2 ** 4) ** 0.25
          : Math.max(e2, t2)) -
      tear.e0) /
      Math.max(1e-4, tear.e1 - tear.e0),
    0,
    1,
  );
};

export var closingBurn = {
  noise: 0.06,
  grain: 0.17,
  dither: 0.01,
  hash: 0.1,
  charW: 0.055,
  charBack: 1.5,
  char: 0.62,
  glowW: 0.01,
};
export var PLAN_DURATION = 420 / 5350;
export var PLAN_PLAYBACK = 1.26;
export var PLAN_RETREAT = [0.4, 0.3];
export var PLAN_REVEAL = 0.425;
export var TERMS_INK_START = 0.72;
export var TERMS_SPLIT_START = (420 * 1) / 900;
export var GRAFT_PAUSE = 0.45;
export var GRAFT_EARLY_RATE = 0.12;
export var graftTime = (e2) =>
  e2 < 0.45
    ? (e2 / GRAFT_PAUSE) * GRAFT_EARLY_RATE
    : GRAFT_EARLY_RATE +
      ((e2 - GRAFT_PAUSE) / (1 - GRAFT_PAUSE)) * (1 - GRAFT_EARLY_RATE);
export var CODA_CROSSFADE = 0.1;
export var PAPER_START = 0.42;
export var TERMS_ZOOM = 1.62;
export var TERMS_EXIT_START = 0.26;
export var TERMS_EXIT_DURATION = 0.24;
export var FAQ_START = 0.62;
export var FAQ_ANCHORS = [
  [0.26, 0.534],
  [0.709, 0.354],
  [0.259, 0.907],
  [0.718, 0.815],
  [0.27, 0.236],
];
export var FAQ_PLATE_SIZE = [1920, 1080];
export var formMotion = {
  at: 0.69,
  span: 0.3,
  stagger: 0.18,
  each: 0.34,
  blur: 9.5,
  fill: 0.1,
  rim: 0.41,
  bev: 2.5,
  bev2: 0.35,
  spec: 0.4,
  sat: 1.1,
  px: -8,
  py: -128,
  scale: 0.95,
  hold: 0.35,
  run: 0.65,
  ease: 0,
  rx: 6,
  ry: 9,
  rz: 1.6,
  rxIn: 9,
  ryIn: 22,
  rzIn: 4,
  persp: 1700,
  ins: 0.475,
  insB: 6,
  insY: 1,
  pop: 64,
  push: 26,
  bgScale: 1,
  bgX: 0,
  bgY: 50,
};
export var FORM_FIELDS = [
  [
    `name`,
    `Your name`,
    `text`,
    452,
    148,
    236,
    62,
    `M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20a7.5 7.5 0 0115 0`,
  ],
  [
    `email`,
    `Work email`,
    `email`,
    712,
    148,
    236,
    62,
    `M2.5 6.5h19v11h-19zM2.5 7l9.5 6.5L21.5 7`,
  ],
  [
    `grow`,
    `What do you want to grow?`,
    `area`,
    452,
    226,
    496,
    226,
    `M3 5.5h18v11H9l-5 4v-4H3z`,
  ],
];
export var STAR_POSITIONS = [
  [0.3802, 0.1662, 2],
  [0.6047, 0.1131, 2],
  [0.434, 0.4782, 1],
  [0.3876, 0.3921, 1],
  [0.3392, 0.5292, 1],
  [0.2582, 0.256, 1],
  [0.4235, 0.3413, 1],
  [0.7883, 0.2255, 1],
  [0.5515, 0.2254, 1],
  [0.4043, 0.2556, 1],
  [0.5566, 0.1053, 1],
  [0.6594, 0.2556, 1],
  [0.7957, 0.1049, 1],
  [0.491, 0.3812, 1],
  [0.8971, 0.2551, 1],
  [0.7497, 0.5906, 1],
  [0.5081, 0.5907, 1],
];
export var ORBIT_GEOMETRY = [
  [0.56, 0.36, 0.18, 0.105, -14],
  [0.545, 0.395, 0.245, 0.15, 9],
  [0.59, 0.345, 0.135, 0.195, -32],
];
export var FOOTER_HOLD = 0.62;
export var MOBILE_TIMELINE = (() => {
  let e2 = PLAN_DURATION * PLAN_PLAYBACK,
    t2 = [
      [HERO_RING_END * MODEL_LENGTH, HERO_RING_END * MODEL_LENGTH],
      [(REEL_END - HERO_RING_END) * MODEL_LENGTH, 0.19149532710280373],
      [(1 - REEL_END) * MODEL_LENGTH, (1 - REEL_END) * MODEL_LENGTH],
      [WORK_LENGTH, WORK_LENGTH],
      [CODA_LENGTH, CODA_LENGTH],
      [e2, e2 - 8e-3],
      [0.12538317757009346, 0.11438317757009346],
      [FAQ_LENGTH, FAQ_LENGTH - 3e-3],
      [FLIGHT_LENGTH, FLIGHT_LENGTH - 8e-3],
      [FORM_LENGTH, FORM_LENGTH],
      [FOOTER_HOLD * FOOTER_LENGTH, FOOTER_HOLD * FOOTER_LENGTH],
    ],
    n2 = [
      [(0.8 - FOOTER_HOLD) * FOOTER_LENGTH, 5e-3],
      [0.2 * FOOTER_LENGTH, 0.012],
    ],
    r2 = 0.983 / t2.reduce((e3, t3) => e3 + t3[1], 0),
    i2 = [[0, 0]],
    a2 = 0,
    o2 = 0;
  for (let [e3, n3] of t2) ((o2 += e3), (a2 += n3 * r2), i2.push([a2, o2]));
  for (let [e3, t3] of n2) ((o2 += e3), (a2 += t3), i2.push([a2, o2]));
  return ((i2[i2.length - 1] = [1, 1]), i2);
})();
export function toSceneProgress(e2, t2) {
  if (!t2) return e2;
  for (let t3 = 1; t3 < MOBILE_TIMELINE.length; t3++)
    if (e2 <= MOBILE_TIMELINE[t3][0])
      return (
        MOBILE_TIMELINE[t3 - 1][1] +
        ((e2 - MOBILE_TIMELINE[t3 - 1][0]) *
          (MOBILE_TIMELINE[t3][1] - MOBILE_TIMELINE[t3 - 1][1])) /
          (MOBILE_TIMELINE[t3][0] - MOBILE_TIMELINE[t3 - 1][0])
      );
  return 1;
}
export function toScrollProgress(e2, t2) {
  if (!t2) return e2;
  for (let t3 = 1; t3 < MOBILE_TIMELINE.length; t3++)
    if (e2 <= MOBILE_TIMELINE[t3][1])
      return (
        MOBILE_TIMELINE[t3 - 1][0] +
        ((e2 - MOBILE_TIMELINE[t3 - 1][1]) *
          (MOBILE_TIMELINE[t3][0] - MOBILE_TIMELINE[t3 - 1][0])) /
          (MOBILE_TIMELINE[t3][1] - MOBILE_TIMELINE[t3 - 1][1])
      );
  return 1;
}
export var footerTransition = {
  mode: 1,
  at: 0.74,
  span: 0.18,
  noise: 74,
  scaleB: 1.018,
  radius: 0.9,
  width: 0.35,
};
export var SECONDARY_EFFECTS = [0, 1, 4, 9, 10];
export var SECONDARY_STARTS = [0.955, 0.757, 0.714, 0.533, 0.515];
export const BEAT_LABELS = CONTENT.beatLabels;
export var OVERLAY_LEFT = 23.7;
export var OVERLAY_RIGHT = 85.6;
export var WORK_STAGE_HEIGHT = 1450;
export var BRIDGE_FRAME_ENDS = {
  v28: 100,
  v51: 85,
  v61: 90,
};
export var mobileGraft = {
  x: 0,
  from: 0,
  ramp: 0.12,
};
export var mobileCoda = {
  x: 0,
  y: 0,
  z: 1,
};
export var mobileScaffold = {
  x: 5,
  y: -440,
  z: 2.5,
  at: 0,
  span: 1,
};
export var mobilePlan = {
  x: 0.5,
  y: 0.735,
  s: 0.78,
  join: 0.655,
};
export var MOBILE_TERMS_ZOOM = 1.45;
export var SIGNATURE_START = 0.718;
export var mobileFlight = {
  x: 20,
  from: 0,
  span: 1,
};
export var mobileSignature = {
  at: 0.12,
  span: 0.6,
};
export var mobileTerms = {
  w: 0.905,
  x: 0,
  y: 0,
};
export var mobileForm = {
  k: 3,
};
export var WORK_BEATS = [0, 0.3, 0.6];
export var WORK_DESIGN_WIDTH = 1328;
export var WORK_DESIGN_HEIGHT = 3515;
export var WORK_PANEL_STOPS = [0, 1180, 2050];
export var WORK_TICK_SPACING = WORK_DESIGN_HEIGHT / 34;
export var heroParameter = (
  new URLSearchParams(location.search).get(`hero`) || ``
).toLowerCase();
export var selectedHero =
  HERO_VARIANTS.find((e2) => e2.id === heroParameter) || HERO_VARIANTS[0];
selectedHero = {
  ...selectedHero,
  src: matchMedia("(max-width: 820px)").matches
    ? selectedHero.src.replace("/films/", "/films/mobile/")
    : selectedHero.src,
};
export var scrollState = {
  target: scrollY,
  current: scrollY,
  velocity: 0,
  on: !reducedMotion && !coarsePointer,
};
export var lastProgrammaticScroll = -1;
export var markProgrammaticScroll = (e2) => {
  lastProgrammaticScroll = e2;
};
export var scrollRange = () =>
  document.documentElement.scrollHeight - innerHeight;
