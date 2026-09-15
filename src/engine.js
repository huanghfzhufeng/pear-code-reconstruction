import { canvasPalette, inkChannels, lightChannels } from "./palette.js";
/** Editable scene choreography, adapted from the captured Pear reference. See docs/IMPLEMENTATION.md. */
import {
  mediaStats,
  activateSceneLoads,
  createSequence,
  createReel,
} from "./media-loader.js";
import { installLocalForm } from "./form.js";
import { FAQ_DATA } from "./data/faq.js";
import {
  clamp,
  smoothstep,
  smootherstep,
  easeOutQuart,
  inverseSmoothstep,
  contrastEase,
  EASINGS,
  readout,
  platePosition,
  pointer,
  paperLighting,
  entranceClock,
  reducedMotion,
  coarsePointer,
  HERO_VARIANTS,
  MODEL_LENGTH,
  WORK_LENGTH,
  CODA_LENGTH,
  TERMS_LENGTH,
  GRAFT_LENGTH,
  FAQ_LENGTH,
  FLIGHT_LENGTH,
  FORM_LENGTH,
  FOOTER_LENGTH,
  HERO_RING_END,
  REEL_END,
  tear,
  overlayExit,
  tearOrigin,
  escape,
  pushIn,
  getTearIntersection,
  paper,
  closingBurn,
  PLAN_DURATION,
  PLAN_PLAYBACK,
  PLAN_RETREAT,
  PLAN_REVEAL,
  TERMS_INK_START,
  TERMS_SPLIT_START,
  GRAFT_PAUSE,
  GRAFT_EARLY_RATE,
  graftTime,
  CODA_CROSSFADE,
  PAPER_START,
  TERMS_ZOOM,
  TERMS_EXIT_START,
  TERMS_EXIT_DURATION,
  FAQ_START,
  FAQ_ANCHORS,
  FAQ_PLATE_SIZE,
  formMotion,
  FORM_FIELDS,
  STAR_POSITIONS,
  ORBIT_GEOMETRY,
  FOOTER_HOLD,
  MOBILE_TIMELINE,
  toSceneProgress,
  toScrollProgress,
  footerTransition,
  SECONDARY_EFFECTS,
  SECONDARY_STARTS,
  BEAT_LABELS,
  OVERLAY_LEFT,
  OVERLAY_RIGHT,
  WORK_STAGE_HEIGHT,
  BRIDGE_FRAME_ENDS,
  mobileGraft,
  mobileCoda,
  mobileScaffold,
  mobilePlan,
  MOBILE_TERMS_ZOOM,
  SIGNATURE_START,
  mobileFlight,
  mobileSignature,
  mobileTerms,
  mobileForm,
  WORK_BEATS,
  WORK_DESIGN_WIDTH,
  WORK_DESIGN_HEIGHT,
  WORK_PANEL_STOPS,
  WORK_TICK_SPACING,
  heroParameter,
  selectedHero,
  scrollState,
  lastProgrammaticScroll,
  markProgrammaticScroll,
  scrollRange,
} from "./scene-config.js";
/**
 * Pear scene reconstruction, adapted from the live reference captured 2026-09-15.
 * Original visual direction and mathematical treatments: Pear AS.
 * This editable source is an internal technical study; no captured runtime is shipped.
 * Reference SHA and modifications are recorded in docs/IMPLEMENTATION.md.
 */
import {
  STAGE_VERTEX,
  stageFragment,
  FOOTER_VERTEX,
  FOOTER_FRAGMENT,
  STAGE_UNIFORMS,
} from "./shaders/stage.js";
function installPointer() {
  addEventListener(
    `pointermove`,
    (e2) => {
      ((pointer.tx = (e2.clientX / innerWidth - 0.5) * 2),
        (pointer.ty = (e2.clientY / innerHeight - 0.5) * 2));
    },
    {
      passive: true,
    },
  );
}
function installNavigation() {
  (installMenu(),
    installApplyLinks(),
    scrollState.on &&
      (addEventListener(
        `wheel`,
        (e2) => {
          if (e2.ctrlKey) return;
          e2.preventDefault();
          let t2 =
            e2.deltaMode === 1 ? 16 : e2.deltaMode === 2 ? innerHeight : 1;
          scrollState.target = clamp(
            scrollState.target + e2.deltaY * t2,
            0,
            scrollRange(),
          );
        },
        {
          passive: false,
        },
      ),
      addEventListener(`keydown`, (e2) => {
        let t2 = e2.target;
        if (
          t2 &&
          (t2.isContentEditable ||
            t2.tagName === `INPUT` ||
            t2.tagName === `TEXTAREA` ||
            t2.tagName === `SELECT` ||
            ((e2.key === " " || e2.key === "Enter") &&
              t2.closest("button,a,summary")))
        )
          return;
        let n2 = {
          ArrowDown: 90,
          ArrowUp: -90,
          PageDown: innerHeight * 0.9,
          PageUp: -innerHeight * 0.9,
          " ": innerHeight * 0.9,
          Home: -1e7,
          End: 1e7,
        }[e2.key];
        n2 !== void 0 &&
          (e2.preventDefault(),
          (scrollState.target = clamp(
            scrollState.target + n2,
            0,
            scrollRange(),
          )));
      }),
      addEventListener(
        `scroll`,
        () => {
          Math.abs(scrollY - lastProgrammaticScroll) > 2 &&
            (scrollState.target = scrollState.current = scrollY);
        },
        {
          passive: true,
        },
      )));
}
function installApplyLinks() {
  for (let e2 of document.querySelectorAll(`.ov .apply, .ov .cta`))
    e2.addEventListener(`click`, (e3) => {
      e3.preventDefault();
      window.__releasePearBoot?.();
      let t2 = clamp(
        toScrollProgress(
          1 - FOOTER_LENGTH - FORM_LENGTH * 0.7,
          innerWidth <= 720,
        ) * scrollRange(),
        0,
        scrollRange(),
      );
      (markProgrammaticScroll(t2),
        scrollTo(0, t2),
        (scrollState.target = scrollState.current = t2));
    });
}
function installMenu() {
  let e2 = document.querySelector(`.ov .menu`),
    t2 = document.getElementById(`nvm`);
  if (!e2 || !t2) return;
  let n2 = false;
  function r2(r3) {
    ((n2 = r3),
      document.body.classList.toggle(`nav-open`, r3),
      t2.setAttribute(`aria-hidden`, r3 ? `false` : `true`),
      (t2.inert = !r3),
      e2.setAttribute(`aria-expanded`, r3 ? `true` : `false`),
      e2.setAttribute(`aria-label`, r3 ? `Close` : `Menu`),
      (t2.style.pointerEvents = r3 ? `auto` : `none`),
      (document.documentElement.style.overflow = r3 ? `hidden` : ``),
      r3 && (scrollState.target = scrollState.current));
    let i3 = document.querySelector(`.nvs`),
      a2 = (e3, t3, n3) => e3 && e3.style.setProperty(t3, n3, `important`);
    (a2(i3, `opacity`, r3 ? `1` : `0`),
      a2(t2, `opacity`, r3 ? `1` : `0`),
      a2(t2, `visibility`, r3 ? `visible` : `hidden`),
      t2.querySelectorAll(`a`).forEach((e3, t3) => {
        ((e3.style.transitionDelay = r3
          ? (0.05 + t3 * 0.07).toFixed(2) + `s`
          : `0s`),
          a2(e3, `opacity`, r3 ? `1` : `0`));
      }));
  }
  (r2(false),
    e2.addEventListener(`click`, (e3) => {
      (e3.preventDefault(), r2(!n2));
    }),
    addEventListener(`keydown`, (e3) => {
      e3.key === `Escape` && n2
        ? r2(false)
        : n2 &&
          /^(Arrow|Page|Home|End|Space| )/.test(e3.key) &&
          e3.preventDefault();
    }));
  let i2 = (e3) => {
    n2 &&
      (e3.preventDefault(),
      e3.stopPropagation(),
      e3.stopImmediatePropagation && e3.stopImmediatePropagation(),
      (scrollState.target = scrollState.current));
  };
  (addEventListener(`wheel`, i2, {
    passive: false,
    capture: true,
  }),
    addEventListener(`touchmove`, i2, {
      passive: false,
      capture: true,
    }),
    t2.addEventListener(`click`, (e3) => {
      e3.target === t2 && r2(false);
    }));
  for (let e3 of t2.querySelectorAll(`a`))
    e3.addEventListener(`click`, (t3) => {
      window.__releasePearBoot?.();
      (t3.preventDefault(),
        (scrollState.target = clamp(
          parseFloat(e3.dataset.at || `0`) * scrollRange(),
          0,
          scrollRange(),
        )),
        scrollState.on ||
          (markProgrammaticScroll(scrollState.target),
          scrollTo(0, scrollState.target),
          (scrollState.current = scrollState.target)),
        r2(false));
    });
}
function createStageRenderer(e2) {
  let t2 = document.querySelector(`.gl`),
    n2 = t2.getContext(`webgl`, {
      alpha: false,
      antialias: false,
      depth: false,
    }),
    r2 = !!n2.getExtension(`OES_standard_derivatives`),
    i2 = (e3, t3) => {
      let r3 = n2.createShader(e3);
      return (
        n2.shaderSource(r3, t3),
        n2.compileShader(r3),
        n2.getShaderParameter(r3, n2.COMPILE_STATUS)
          ? r3
          : (console.warn(n2.getShaderInfoLog(r3)), null)
      );
    },
    a2 = n2.createProgram();
  (n2.attachShader(a2, i2(n2.VERTEX_SHADER, STAGE_VERTEX)),
    n2.attachShader(
      a2,
      i2(n2.FRAGMENT_SHADER, stageFragment(r2, innerWidth <= 720)),
    ),
    n2.linkProgram(a2),
    n2.getProgramParameter(a2, n2.LINK_STATUS) ||
      console.warn(n2.getProgramInfoLog(a2)),
    n2.useProgram(a2));
  let o2 = n2.createBuffer();
  (n2.bindBuffer(n2.ARRAY_BUFFER, o2),
    n2.bufferData(
      n2.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      n2.STATIC_DRAW,
    ));
  let s2 = n2.getAttribLocation(a2, `aPos`);
  (n2.enableVertexAttribArray(s2),
    n2.vertexAttribPointer(s2, 2, n2.FLOAT, false, 0, 0));
  function c2(e3) {
    let t3 = n2.createTexture();
    return (
      n2.activeTexture(n2.TEXTURE0 + e3),
      n2.bindTexture(n2.TEXTURE_2D, t3),
      n2.pixelStorei(n2.UNPACK_FLIP_Y_WEBGL, true),
      n2.texParameteri(n2.TEXTURE_2D, n2.TEXTURE_WRAP_S, n2.CLAMP_TO_EDGE),
      n2.texParameteri(n2.TEXTURE_2D, n2.TEXTURE_WRAP_T, n2.CLAMP_TO_EDGE),
      n2.texParameteri(n2.TEXTURE_2D, n2.TEXTURE_MIN_FILTER, n2.LINEAR),
      n2.texParameteri(n2.TEXTURE_2D, n2.TEXTURE_MAG_FILTER, n2.LINEAR),
      n2.texImage2D(
        n2.TEXTURE_2D,
        0,
        n2.RGBA,
        1,
        1,
        0,
        n2.RGBA,
        n2.UNSIGNED_BYTE,
        new Uint8Array([11, 10, 9, 255]),
      ),
      t3
    );
  }
  let l2 = {
      A: c2(0),
      B: c2(1),
      C: c2(2),
      E: c2(3),
      G: c2(4),
      P: c2(5),
    },
    u2 = {};
  for (let e3 of STAGE_UNIFORMS) u2[e3] = n2.getUniformLocation(a2, e3);
  (n2.uniform1i(n2.getUniformLocation(a2, `uA`), 0),
    n2.uniform1i(n2.getUniformLocation(a2, `uB`), 1),
    n2.uniform1i(n2.getUniformLocation(a2, `uC`), 2),
    n2.uniform1i(n2.getUniformLocation(a2, `uE`), 3),
    n2.uniform1i(n2.getUniformLocation(a2, `uG`), 4),
    n2.uniform1i(n2.getUniformLocation(a2, `uP`), 5));
  let d2 = (e3, t3, r3) => {
      (n2.activeTexture(n2.TEXTURE0 + e3), n2.bindTexture(n2.TEXTURE_2D, t3));
      let i3 = r3.videoWidth || r3.naturalWidth || r3.width,
        a3 = r3.videoHeight || r3.naturalHeight || r3.height;
      t3._w === i3 && t3._h === a3
        ? n2.texSubImage2D(
            n2.TEXTURE_2D,
            0,
            0,
            0,
            n2.RGBA,
            n2.UNSIGNED_BYTE,
            r3,
          )
        : (n2.texImage2D(
            n2.TEXTURE_2D,
            0,
            n2.RGBA,
            n2.RGBA,
            n2.UNSIGNED_BYTE,
            r3,
          ),
          (t3._w = i3),
          (t3._h = a3));
    },
    f2 = new Image();
  return (
    (f2.onload = () => {
      (d2(2, l2.C, f2),
        n2.uniform2f(u2.uResC, f2.naturalWidth, f2.naturalHeight));
    }),
    (f2.src = `/art/scaffold_expand.jpg`),
    n2.uniform1f(u2.uDot, 7),
    n2.uniform1f(u2.uBlk, 11),
    n2.uniform1f(u2.uScale, 3.2),
    n2.uniform1f(u2.uAsc, 9),
    n2.uniform1f(u2.uHeat, 1),
    n2.uniform2f(u2.uOrigin, e2.origin[0], e2.origin[1]),
    n2.uniform1f(u2.uGlow, 0.62),
    {
      gl: n2,
      canvas: t2,
      tex: l2,
      u: u2,
      upload: d2,
      plate: f2,
    }
  );
}
var Pt = 320;
var Ft = new Path2D(
  `M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z`,
);
var It;
var Lt;
var Rt;
var zt;
var Bt = 0;
var Vt = null;
var Ht = 0;
var Ut;
var Wt;
var Gt;
var Kt;
var qt;
var Jt = () => Ht;
function initSampledGrid() {
  ((It = document.querySelector(`.ov .lines`)),
    It &&
      ((Lt = It.getContext(`2d`)),
      (Rt = document.createElement(`canvas`)),
      (zt = Rt.getContext(`2d`, {
        willReadFrequently: true,
      })),
      (Ut = document.querySelector(`.ov .gv:not(.gv--r)`)),
      (Wt = document.querySelector(`.ov .gv--r`)),
      (Gt = document.querySelector(`.ov .gh[data-out="u"]`)),
      (Kt = document.querySelector(`.ov .gh[data-out="d"]`)),
      (qt = [...document.querySelectorAll(`.ov .gx:not(.gx--lock)`)])));
}
var Xt = (e2) => 1 - (1 - clamp(e2, 0, 1)) ** 3;
var Zt = [
  [0, 0, 2.6],
  [0.4, 1, 0.78],
  [0.62, 0.15, 1.14],
  [1, 1, 1],
];
function gridPalette(e2) {
  for (let t2 = 1; t2 < Zt.length; t2++)
    if (e2 <= Zt[t2][0]) {
      let [n2, r2, i2] = Zt[t2 - 1],
        [a2, o2, s2] = Zt[t2],
        c2 = (e2 - n2) / (a2 - n2);
      return {
        a: r2 + (o2 - r2) * c2,
        s: i2 + (s2 - i2) * c2,
      };
    }
  return {
    a: 1,
    s: 1,
  };
}
function renderSampledGrid(e2, t2, n2, r2, i2, a2) {
  if (!It) return;
  let o2 = 1 - clamp(t2 / 0.08, 0, 1),
    s2 = e2.readyState >= 2 && e2.videoWidth,
    c2 = a2 && a2.el && a2.el.complete && a2.el.naturalWidth,
    l2 = s2 ? e2 : c2 ? a2.el : null;
  if (((Ht = l2 ? o2 : 0), Ht <= 1e-3)) {
    It.style.opacity !== `0` &&
      ((It.style.opacity = `0`), Lt.clearRect(0, 0, It.width, It.height));
    return;
  }
  It.style.opacity = Ht.toFixed(3);
  let u2 = l2.videoWidth || l2.naturalWidth,
    f2 = l2.videoHeight || l2.naturalHeight,
    p2 = Math.min(devicePixelRatio || 1, 2),
    m2 = Math.round(innerWidth * p2),
    h2 = Math.round(innerHeight * p2);
  (It.width !== m2 || It.height !== h2) && ((It.width = m2), (It.height = h2));
  let g2 = m2 / innerWidth,
    _2 =
      entranceClock.t0 < 0
        ? -1
        : reducedMotion
          ? 10
          : (n2 - entranceClock.t0) / 1e3;
  if ((Lt.clearRect(0, 0, m2, h2), _2 < 0)) return;
  let v2 = document.querySelector(`.ov`).classList.contains(`on-light`),
    y2 = v2 ? canvasPalette.inkRule : canvasPalette.lightRule,
    b2 = v2 ? canvasPalette.ink : canvasPalette.light;
  Lt.fillStyle = y2;
  let x2 = (e3, t3, n3) => {
    if (!e3) return;
    let r3 = e3.getBoundingClientRect();
    if (!r3.width && !r3.height) return;
    let i3 = Xt((_2 - t3) / 1.15);
    i3 <= 0 ||
      (n3
        ? Lt.fillRect(r3.left * g2, r3.top * g2, g2, r3.height * g2 * i3)
        : Lt.fillRect(r3.left * g2, r3.top * g2, r3.width * g2 * i3, g2));
  };
  if (
    (x2(Ut, 0.2, true),
    x2(Wt, 0.3, true),
    x2(Gt, 0.25, false),
    x2(Kt, 0.4, false),
    (Lt.fillStyle = b2),
    qt.forEach((e3, t3) => {
      let n3 = e3.getBoundingClientRect();
      if (!n3.width) return;
      let r3 = clamp((_2 - (t3 ? 1.18 : 1.05)) / 0.72, 0, 1);
      if (r3 <= 0) return;
      let { a: i3, s: a3 } = gridPalette(r3),
        o3 = n3.width * g2 * a3,
        s3 = (n3.left + n3.width / 2) * g2,
        c3 = (n3.top + n3.height / 2) * g2;
      ((Lt.globalAlpha = i3),
        Lt.setTransform(o3 / 24, 0, 0, o3 / 24, s3 - o3 / 2, c3 - o3 / 2),
        Lt.fill(Ft),
        Lt.setTransform(1, 0, 0, 1, 0, 0),
        (Lt.globalAlpha = 1));
    }),
    n2 - Bt > 40 || l2 !== Vt)
  ) {
    ((Bt = n2), (Vt = l2));
    let e3 = Pt,
      t3 = Math.max(1, Math.round((Pt * f2) / u2));
    (Rt.width !== e3 || Rt.height !== t3) &&
      ((Rt.width = e3), (Rt.height = t3));
    try {
      zt.drawImage(l2, 0, 0, e3, t3);
      let n3 = zt.getImageData(0, 0, e3, t3),
        r3 = n3.data;
      for (let e4 = 0; e4 < r3.length; e4 += 4) {
        let t4 = (r3[e4 + 2] - Math.max(r3[e4], r3[e4 + 1]) - 8) / 34;
        r3[e4 + 3] = t4 <= 0 ? 0 : t4 >= 1 ? 255 : Math.round(t4 * 255);
      }
      zt.putImageData(n3, 0, 0);
    } catch {
      return;
    }
  }
  let ee2 = Math.max(m2 / u2, h2 / f2),
    te2 = u2 * ee2,
    w2 = f2 * ee2,
    T2 = (m2 - te2) / 2 - (r2 || 0) * te2,
    E2 = (h2 - w2) / 2;
  {
    let e3 = (i2 || 1) * (a2 ? 1.06 - 0.06 * a2.p : 1),
      t3 = m2 / 2,
      n3 = h2 / 2;
    ((T2 = t3 + (T2 - t3) * e3),
      (E2 = n3 + (E2 - n3) * e3),
      (te2 *= e3),
      (w2 *= e3));
  }
  ((Lt.globalCompositeOperation = `destination-in`),
    Lt.drawImage(Rt, T2, E2, te2, w2),
    (Lt.globalCompositeOperation = `source-over`));
}
var en;
var tn;
var nn;
var rn = [];
var an = [];
var on = -1;
var sn = -1;
function splitHeadline(e2) {
  let t2 = [],
    n2 = [];
  return (
    [...e2.childNodes].forEach((e3) => {
      if (e3.nodeType !== 3) return;
      let r2 = document.createDocumentFragment();
      (e3.nodeValue.split(/(\s+)/).forEach((e4) => {
        if (!e4) return;
        if (/^\s+$/.test(e4)) {
          r2.appendChild(document.createTextNode(e4));
          return;
        }
        let i2 = document.createElement(`span`);
        i2.className = `wd`;
        for (let t3 of e4) {
          let e5 = document.createElement(`span`);
          ((e5.className = `ch`),
            (e5.textContent = t3),
            (e5.dataset.c = t3),
            i2.appendChild(e5),
            n2.push(e5));
        }
        (t2.push(i2), r2.appendChild(i2));
      }),
        e3.parentNode.replaceChild(r2, e3));
    }),
    {
      words: t2,
      chars: n2,
    }
  );
}
function splitParagraph(e2) {
  let t2 = e2.textContent;
  e2.textContent = ``;
  let n2 = [];
  return (
    t2.split(/(\s+)/).forEach((t3) => {
      if (!t3) return;
      if (/^\s+$/.test(t3)) {
        e2.appendChild(document.createTextNode(t3));
        return;
      }
      let r2 = document.createElement(`span`);
      r2.className = `wd`;
      for (let e3 of t3) {
        let t4 = document.createElement(`span`);
        ((t4.className = `ch`),
          (t4.textContent = e3),
          r2.appendChild(t4),
          n2.push(t4));
      }
      e2.appendChild(r2);
    }),
    n2
  );
}
function initOverlay() {
  ((en = document.querySelector(`.ov`)),
    (tn = document.querySelector(`.ov .fill`)),
    (nn = document.querySelector(`.ov .tag`)),
    (rn = [
      [0, 0.045],
      [0.26, 0.4],
      [0.44, 0.55],
      [0.56, 0.65],
    ].map(([e2, t2], n2) => {
      let r2 = [...document.querySelectorAll(`.bk[data-beat="${n2}"]`)];
      return {
        a: e2,
        b: t2,
        els: r2,
        lines: r2.flatMap((e3) => [...e3.querySelectorAll(`.ln i`)]),
        stand: r2.map((e3) => e3.querySelector(`.stand`)).filter(Boolean),
        chars: r2.flatMap((e3) =>
          [...e3.querySelectorAll(`.stand`)].flatMap(splitParagraph),
        ),
        heads: [...r2.flatMap((e3) => [...e3.querySelectorAll(`.ln i`)])].map(
          (e3) => ({
            i: e3,
            ...splitHeadline(e3),
          }),
        ),
        shown: false,
      };
    })),
    (an = [...document.querySelectorAll(`.ov [data-out]`)].map((e2) => ({
      el: e2,
      role: e2.dataset.out,
      base: parseFloat(getComputedStyle(e2).opacity) || 1,
      x0: 0,
      y0: 0,
    }))),
    addEventListener(`resize`, measureOverlay),
    requestAnimationFrame(measureOverlay));
}
function measureOverlay() {
  for (let e2 of an) {
    e2.el.style.transform = ``;
    let t2 = e2.el.getBoundingClientRect();
    ((e2.x0 = t2.left + t2.width / 2),
      (e2.y0 = t2.top + t2.height / 2),
      e2.el.classList.contains(`gv--r`) &&
        ((e2.el.style.top = ``),
        (e2.top0 = e2.el.getBoundingClientRect().top)));
  }
}
function startEntrance(e2, t2) {
  (en.classList.add(`go`), (sn = e2 + t2), (entranceClock.t0 = e2));
}
function renderHeadline(e2, t2) {
  e2.heads.forEach((e3, n2) => {
    let r2 = easeOutQuart(clamp((t2 - n2 * 0.115) / 0.6, 0, 1));
    e3.i.style.transform = `translate(var(--exitX, 0px), calc(${((1 - r2) * 175).toFixed(2)}% + var(--exitY, 0px)))`;
  });
}
function renderOverlay(e2, t2) {
  let n2 = readout.pan,
    r2 = false;
  for (let n3 of rn) {
    let i2 = n3.b - n3.a,
      a2 = clamp((e2 - n3.a) / i2, 0, 1),
      o2 = e2 > n3.a - 0.02 && e2 < n3.b + 0.02;
    if (
      (o2 !== n3.shown &&
        ((n3.shown = o2),
        n3.els.forEach((e3) => {
          e3.style.visibility = o2 ? `visible` : `hidden`;
        })),
      !o2)
    )
      continue;
    r2 = true;
    let s2 = n3 === rn[0],
      c2 = s2
        ? smoothstep(clamp((1 - a2) / 0.28, 0, 1))
        : Math.min(
            smoothstep(clamp(a2 / 0.16, 0, 1)),
            smoothstep(clamp((1 - a2) / 0.2, 0, 1)),
          );
    if (s2) {
      let e3 = 1 - c2,
        t3 = e3 * e3;
      (n3.els.forEach((e4) => {
        e4.style.opacity = c2.toFixed(3);
      }),
        n3.heads.forEach((e4, n4) => {
          let r3 = t3 * (1 + n4 * 0.16);
          (e4.i.style.setProperty(`--exitX`, `${(-r3 * 54).toFixed(2)}px`),
            e4.i.style.setProperty(`--exitY`, `${(-r3 * 7).toFixed(2)}px`));
        }),
        n3.els.forEach((n4) => {
          ((n4.style.transform = `translate3d(${(-t3 * 86).toFixed(1)}px,${(-t3 * 14).toFixed(1)}px,0) scale(${(1 - t3 * 0.04).toFixed(4)})`),
            (n4.style.filter =
              e3 > 0.02 ? `blur(${(t3 * 5).toFixed(2)}px)` : ``));
        }));
    } else
      n3.els.forEach((e3) => {
        ((e3.style.opacity = c2.toFixed(3)),
          (e3.style.transform = ``),
          (e3.style.filter = ``));
      });
    let l2 = s2
      ? sn < 0
        ? 0
        : clamp((t2 - sn) / WORK_STAGE_HEIGHT, 0, 1)
      : clamp((a2 - 0.03) / 0.3, 0, 1);
    if ((renderHeadline(n3, l2), s2)) {
      let e3 = easeOutQuart(clamp((l2 - 0.34) / 0.3, 0, 1)),
        t3 = easeOutQuart(clamp((l2 - 0.52) / 0.22, 0, 1));
      n3.els.forEach((n4) => {
        let r3 = n4.querySelector(`.cta`);
        if (!r3) return;
        ((r3.style.opacity = e3.toFixed(3)),
          (r3.style.transform = `translateY(${((1 - e3) * 14).toFixed(1)}px)`));
        let i3 = r3.querySelector(`.flood`);
        i3 &&
          (i3.style.clipPath = `inset(${((1 - t3) * 100).toFixed(2)}% 0 0 0)`);
      });
    }
    if (nn) {
      let e3 = rn.indexOf(n3);
      e3 !== on &&
        ((on = e3), (nn.textContent = BEAT_LABELS[e3] || BEAT_LABELS[0]));
      let t3 = easeOutQuart(clamp((l2 - (s2 ? 0.8 : 0.35)) / 0.2, 0, 1)) * c2;
      ((nn.style.opacity = t3.toFixed(3)),
        (nn.style.transform = `translateY(${((1 - t3) * 10).toFixed(1)}px)`));
    }
    let u2 =
      clamp(s2 ? (l2 - 0.56) / 0.36 : (a2 - 0.14) / 0.26, 0, 1) *
      (n3.chars.length + 4);
    n3.chars.forEach((e3, t3) => {
      e3.style.opacity = clamp((u2 - t3) * 2.4, 0, 1).toFixed(2);
    });
  }
  nn && !r2 && on !== -1 && ((on = -1), (nn.style.opacity = `0`));
  {
    let t3 = tear.at + overlayExit.over * tear.len;
    ((readout.p = e2), (readout.lockEnd = t3));
    let r3 = smoothstep(
        clamp((e2 - (t3 - overlayExit.len)) / overlayExit.len, 0, 1),
      ),
      i2 = innerWidth * tearOrigin.x,
      a2 = innerHeight * (1 - tearOrigin.y),
      o2 =
        overlayExit.e > 0
          ? innerWidth * (overlayExit.e / tear.ax)
          : (innerWidth * overlayExit.w) / 100,
      s2 =
        overlayExit.e > 0
          ? innerHeight * (overlayExit.e / tear.ay)
          : (innerHeight * overlayExit.h) / 100,
      c2 = {
        l: i2 - o2,
        r: i2 + o2,
        ld: i2 - o2,
        rd: i2 + o2,
        lu: i2 - o2,
        ru: i2 + o2,
      },
      l2 = {
        u: a2 - s2,
        d: a2 + s2,
        ld: a2 + s2,
        rd: a2 + s2,
        lu: a2 - s2,
        ru: a2 - s2,
      },
      u2 = clamp((e2 - tear.at) / tear.len, 0, 1),
      p2 = contrastEase(
        clamp(
          (u2 -
            (overlayExit.auto > 0.5
              ? clamp(getTearIntersection() + overlayExit.lead, 0, 1)
              : overlayExit.ret)) /
            overlayExit.retLen,
          0,
          1,
        ),
        overlayExit.ease,
      ),
      m2 = smoothstep(clamp((u2 - (overlayExit.ret - 0.18)) / 0.18, 0, 1)),
      h2 =
        1 +
        0.85 * Math.max(0, Math.sin(Math.PI * clamp((r3 - 0.55) / 0.45, 0, 1)));
    for (let e3 of an) {
      if (n2 > 0 && e3.el.classList.contains(`fill`)) continue;
      let t4 = e3.el.classList.contains(`gx`),
        i3 = t4 ? r3 : r3 * (1 - p2),
        a3 = c2[e3.role] === void 0 ? 0 : (c2[e3.role] - e3.x0) * i3,
        o3 = l2[e3.role] === void 0 ? 0 : (l2[e3.role] - e3.y0) * i3,
        s3 = e3.el.classList.contains(`gh`) && e3.role === `d`,
        u3 = e3.el.classList.contains(`gv--r`);
      if ((s3 && (o3 += p2 * (innerHeight + 24 - e3.y0)), u3)) {
        let t5 =
          innerWidth <= 720
            ? 1 - smoothstep(clamp((readout.burn - 0.1) / 0.25, 0, 1))
            : 1;
        a3 += p2 * t5 * (platePosition.x - e3.x0);
      }
      let g2 = t4 ? ` scale(${h2.toFixed(3)})` : ``;
      if (u3) {
        let t5 =
          innerWidth <= 720
            ? 0
            : smoothstep(clamp((readout.coda - 0.42) / 0.3, 0, 1));
        e3.el.style.top =
          (e3.top0 * (1 - Math.max(i3, p2)) + t5 * innerHeight).toFixed(1) +
          `px`;
      }
      e3.el.style.transform = `translate(${a3.toFixed(1)}px,${o3.toFixed(1)}px)${g2}`;
      let _2 = e3.el.classList.contains(`fill`) ? 1 - r3 : 1,
        b2 = e3.el.classList.contains(`gx--lock`)
          ? smoothstep(clamp(r3 / 0.5, 0, 1))
          : 1,
        x2 = t4 ? 1 - m2 : s3 ? 1 - p2 : 1,
        ee2 = 1 - Jt();
      e3.el.style.opacity = (e3.base * _2 * b2 * x2 * ee2).toFixed(3);
    }
    if (((readout.g = r3), (readout.off = p2), paperLighting.lit))
      en.style.getPropertyValue(`--rule`) &&
        (en.style.removeProperty(`--rule`),
        en.style.removeProperty(`--cross`),
        en.style.removeProperty(`--mark`));
    else if (r3 > 1e-3) {
      let e3 = (e4, t5) => e4 + (t5 - e4) * p2,
        t4 = inkChannels
          .map((channel, i) => e3(channel, lightChannels[i]))
          .map(Math.round)
          .join(` `);
      (en.style.setProperty(
        `--rule`,
        `rgb(${t4} / ${e3(0.165 + 0.5 * r3, 0.225).toFixed(3)})`,
      ),
        en.style.setProperty(
          `--cross`,
          `rgb(${t4} / ${e3(0.34 + 0.6 * r3, 0.525).toFixed(3)})`,
        ),
        en.style.setProperty(
          `--mark`,
          p2 > 0.5 ? `var(--on-dark)` : `var(--ink)`,
        ));
    } else
      en.style.getPropertyValue(`--rule`) &&
        (en.style.removeProperty(`--rule`),
        en.style.removeProperty(`--cross`),
        en.style.removeProperty(`--mark`));
  }
  if (((readout.burn = clamp((e2 - tear.at) / tear.len, 0, 1)), tn))
    if (n2 > 0) tn.style.opacity = `0`;
    else {
      let t3 =
        OVERLAY_LEFT * (1 - smoothstep(clamp((e2 - 0.052) / 0.09, 0, 1)));
      ((tn.style.left = t3.toFixed(2) + `%`),
        (tn.style.width =
          ((OVERLAY_RIGHT - t3) * smoothstep(e2)).toFixed(2) + `%`));
    }
}
var hn = `M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z`;
var gn;
var _n;
var vn;
var yn;
var bn = [];
function initFaq() {
  gn = document.querySelector(".faq");
  _n = gn.querySelector(".faq-lead");
  vn = _n.querySelector("line");
  yn = _n.querySelector("rect");
  bn = [...gn.querySelectorAll(".fq")];
}
var Sn = false;
function renderFaq(e2) {
  if (!gn) return;
  if (((gn.style.opacity = e2 > 1e-3 ? `1` : `0`), e2 <= 1e-3)) {
    if (Sn) return;
    Sn = true;
  } else Sn = false;
  let t2 = innerWidth,
    n2 = innerHeight,
    r2 = bn.length,
    i2 = Math.max(t2 / FAQ_PLATE_SIZE[0], n2 / FAQ_PLATE_SIZE[1]),
    a2 = FAQ_PLATE_SIZE[0] * i2,
    o2 = FAQ_PLATE_SIZE[1] * i2,
    s2 = (t2 - a2) / 2,
    c2 = (n2 - o2) / 2,
    l2 = clamp(e2 / 0.85, 0, 1),
    u2 = 0.22,
    p2 = clamp((l2 - u2) / (1 - u2), 0, 1),
    m2 = 360 / r2,
    h2 = -p2 * (360 - m2),
    g2 = 0,
    _2 = -2;
  for (let e3 = 0; e3 < r2; e3++) {
    let t3 = Math.cos((((((e3 * m2 + h2) % 360) + 360) % 360) * Math.PI) / 180);
    t3 > _2 && ((_2 = t3), (g2 = e3));
  }
  let v2 = t2 <= 720,
    y2 = v2 ? t2 * 0.36 : Math.min(360, t2 * 0.26),
    x2 = v2 ? Math.min(1, t2 / 560) : 1;
  for (let e3 = 0; e3 < r2; e3++) {
    let t3 = bn[e3],
      r3 = smoothstep(clamp((l2 - 0.04 - e3 * 0.05) / 0.22, 0, 1)),
      i3 = (((e3 * m2 + h2) % 360) + 360) % 360,
      a3 = (i3 * Math.PI) / 180,
      o3 = (Math.cos(a3) + 1) / 2,
      s3 = e3 === g2 && o3 > 0.9 && r3 > 0.92;
    (s3 !== t3.classList.contains(`on`) && t3.classList.toggle(`on`, s3),
      (t3.style.left = `50%`),
      (t3.style.top = (n2 * 0.602).toFixed(0) + `px`),
      (t3.style.transform = `translate(${(-50 + pointer.x * 2.4).toFixed(2)}%,${(-50 + pointer.y * 2).toFixed(2)}%) rotateY(${i3.toFixed(2)}deg) translateZ(${y2}px) rotateY(${(-i3).toFixed(2)}deg) translateY(${(Math.sin(a3) * 26 - (1 - r3) * 34).toFixed(1)}px) scale(${(Math.round(r3 * x2 * (0.58 + 0.42 * o3 ** 1.4) * 100) / 100).toFixed(2)})`));
    let c3 = Math.round((1 - o3) * 8.4) / 2;
    ((t3.style.filter = c3 > 0.05 ? `blur(${c3.toFixed(1)}px)` : ``),
      (t3.style.zIndex = Math.round(o3 * 100)));
  }
  let [ee2, S2] = FAQ_ANCHORS[g2],
    C2 = s2 + ee2 * a2,
    te2 = c2 + S2 * o2,
    w2 = bn[g2].getBoundingClientRect(),
    T2 = C2 < t2 / 2 ? w2.left - 34 : w2.right + 34,
    E2 = w2.top + 26,
    ne2 = smoothstep(clamp(((_2 + 1) / 2 - 0.9) / 0.055, 0, 1));
  (yn.setAttribute(`x`, (T2 - 4).toFixed(1)),
    yn.setAttribute(`y`, (E2 - 4).toFixed(1)),
    vn.setAttribute(`x1`, C2.toFixed(1)),
    vn.setAttribute(`y1`, te2.toFixed(1)),
    vn.setAttribute(`x2`, T2.toFixed(1)),
    vn.setAttribute(`y2`, E2.toFixed(1)),
    (_n.style.opacity = ne2.toFixed(3)));
}
function exitFaq(e2) {
  if (!gn) return 0;
  let t2 = smoothstep(clamp((e2 - 0.8) / 0.2, 0, 1));
  return (
    gn.classList.toggle(`out`, t2 > 1e-3),
    t2 > 1e-3
      ? (gn.style.setProperty(`--go`, Math.round((80 - t2 * 80) / 2) * 2 + `%`),
        (gn.style.filter = `blur(${(Math.round(t2 * 18) / 2).toFixed(1)}px)`),
        (gn.style.transform = `translateY(${(-t2 * innerHeight * 0.06).toFixed(1)}px) scale(${(Math.round((1 + t2 * 0.05) * 100) / 100).toFixed(2)})`))
      : ((gn.style.filter = ``), (gn.style.transform = ``)),
    t2
  );
}
var Nn;
var Pn;
var Fn;
var In = -1;
var Ln = null;
var Rn = 0;
var zn;
var Bn;
var Vn;
var Hn;
var Un;
var Wn;
var Gn = [];
var Kn = [];
var qn = -1;
var Jn = [];
var Yn = 0;
var Xn = [0, 0];
var Zn;
var Qn = false;
var $n = false;
var er = false;
var tr;
var nr;
var rr;
var ir;
var ar;
var or;
var sr;
var cr;
var lr = -1;
var ur = null;
function drawFrame(e2, t2) {
  e2.dataset.frameSource = t2.currentSrc || t2.src;
  ((e2.width !== t2.naturalWidth || e2.height !== t2.naturalHeight) &&
    ((e2.width = t2.naturalWidth), (e2.height = t2.naturalHeight)),
    e2.getContext(`2d`).drawImage(t2, 0, 0));
}
var fr;
var pr = null;
var mr = null;
var hr = -1;
var gr = false;
var _r = -1;
var vr = 0;
var yr = 0;
var br = false;
var xr = null;
var Sr = [];
function seedExitMotion(e2) {
  let t2 = e2 || 1,
    n2 = () => (t2 = (t2 * 1103515245 + 12345) & 2147483647) / 2147483647;
  Sr = [];
  for (let e3 = 0; e3 < 4; e3++) {
    let e4 = n2() * Math.PI * 2,
      t3 = 0.35 + n2() * 0.9;
    Sr.push({
      d: +(n2() * 0.34).toFixed(3),
      r: +(0.42 + n2() * 0.58).toFixed(3),
      e: Math.floor(n2() * EASINGS.length),
      ax: +(Math.cos(e4) * t3).toFixed(3),
      ay: +(Math.sin(e4) * t3 * 0.6).toFixed(3),
      rz: +((n2() - 0.5) * 7).toFixed(2),
    });
  }
}
function initFlight() {
  (seedExitMotion(0),
    (Nn = document.querySelector(`.fly`)),
    (Pn = document.querySelector(`.fly-w`)),
    (Fn = createSequence(
      `/films/flysky`,
      121,
      2,
      1 - FOOTER_LENGTH - FORM_LENGTH - FLIGHT_LENGTH,
      1,
    )),
    (sr = document.querySelector(`.trans`)),
    (cr = createSequence(`/films/trans`, 121, 2, 1 - FOOTER_LENGTH, 1)),
    (Zn = document.querySelector(`.foot`)),
    (Zn.muted = true),
    Zn.setAttribute(`muted`, ``));
  let e2 = () => {
    if (er) return;
    let t2 = document.documentElement.scrollHeight - innerHeight;
    if (t2 < 1 || scrollY / t2 < 0.5) return;
    ((er = true), removeEventListener(`touchstart`, e2));
    let n2 = Zn.play();
    n2 &&
      n2.then &&
      n2
        .then(() => {
          Qn || Zn.pause();
        })
        .catch(() => {});
  };
  if (
    (addEventListener(`touchstart`, e2, {
      passive: true,
    }),
    (fr = document.querySelector(`.ftx`)),
    (tr = document.querySelector(`.ft`)),
    (nr = tr && tr.querySelector(`.ft-in`)),
    (rr = tr ? [...tr.querySelectorAll(`.ft-r`)] : []),
    (ir = tr && tr.querySelector(`.ft-box rect`)),
    (ar = tr
      ? [...tr.querySelectorAll(`.ft-st,.ft-mark,.ft-tag,.ft-meta`)]
      : []),
    (or = tr ? [...tr.querySelectorAll(`.ft-tag .ln i`)] : []),
    ir && (ir.style.strokeDasharray = 2 * 1442),
    (zn = document.querySelector(`.cf`)),
    (Bn = document.querySelector(`.cf-lead`)),
    (Vn = zn && zn.querySelector(`.cf-in`)),
    (Hn = document.querySelector(`.cf-orb`)),
    (Un = Hn ? [...Hn.querySelectorAll(`ellipse`)] : []),
    (Wn = document.querySelector(`.cf-gl`)),
    Wn)
  )
    for (let e3 = 0; e3 < STAR_POSITIONS.length; e3++) {
      let t2 = document.createElement(`i`);
      (t2.style.setProperty(`--dur`, (1.9 + (e3 % 7) * 0.42).toFixed(2) + `s`),
        t2.style.setProperty(`--dl`, (-(e3 * 0.53) % 3.1).toFixed(2) + `s`),
        Wn.appendChild(t2),
        Gn.push(t2));
    }
  initForm();
}
function initForm() {
  if (!Vn) return;
  Kn = [...Vn.querySelectorAll(".cf-f,.cf-cta")];
  Kn.forEach((field, index) => {
    field.addEventListener("pointerenter", () => {
      qn = index;
    });
    field.addEventListener("pointerleave", () => {
      if (qn === index) qn = -1;
    });
    const input = field.querySelector("input,textarea");
    if (input) field.addEventListener("click", () => input.focus());
  });
  installLocalForm();
}
function flightFraming(e2, t2) {
  let n2 = innerWidth,
    r2 = innerHeight,
    i2 = t2 === void 0 ? formMotion.bgScale : t2,
    a2 =
      e2 === void 0
        ? innerWidth <= 720
          ? 50 +
            (mobileFlight.x - 50) *
              clamp(
                (Rn - mobileFlight.from) / Math.max(0.02, mobileFlight.span),
                0,
                1,
              )
          : 50 +
            (formMotion.bgX - 50) * smoothstep(clamp((Rn - 0.26) / 0.34, 0, 1))
        : e2,
    o2 = Math.max(n2 / 1280, r2 / 720),
    s2 = 1280 * o2 * i2,
    c2 = 720 * o2 * i2;
  return {
    dw: s2,
    dh: c2,
    ox: (n2 - s2) * (a2 / 100),
    oy: (r2 - c2) * (formMotion.bgY / 100),
  };
}
function renderFlight(e2) {
  if (!Nn) return;
  if (((Rn = e2), e2 > 1e-4 && !er && ((er = true), Zn.load()), e2 <= 1e-4)) {
    ((Nn.style.opacity = `0`), (In = -1));
    return;
  }
  {
    let t3 = Math.min(120, Math.round(e2 * 120));
    if ((Fn.aim(t3), Fn.ready)) {
      let e3 = Fn.near(t3);
      e3 && (e3 !== Ln && (drawFrame(Nn, e3), (Ln = e3)), (In = t3));
    }
  }
  ((Nn.style.opacity = smoothstep(clamp(e2 / 0.05, 0, 1)).toFixed(3)),
    (Pn.style.opacity = `0`));
  let t2 = flightFraming();
  ((Nn.style.width = t2.dw.toFixed(1) + `px`),
    (Nn.style.height = t2.dh.toFixed(1) + `px`),
    (Nn.style.left = t2.ox.toFixed(1) + `px`),
    (Nn.style.top = t2.oy.toFixed(1) + `px`));
}
var Or = ``;
var kr = [];
function renderOrbits(e2) {
  if (!Hn || ((Hn.style.opacity = e2.toFixed(3)), e2 < 2e-3)) return;
  let t2 = flightFraming(),
    n2 = `${e2.toFixed(3)}|${t2.ox.toFixed(1)}|${t2.oy.toFixed(1)}|${t2.dw.toFixed(1)}`,
    r2 = n2 !== Or;
  Or = n2;
  for (let n3 = 0; n3 < Un.length; n3++) {
    let [i2, a2, o2, s2, c2] = ORBIT_GEOMETRY[n3],
      l2 = Un[n3],
      u2 = t2.ox + i2 * t2.dw,
      p2 = t2.oy + a2 * t2.dh,
      m2 = o2 * t2.dw,
      h2 = s2 * t2.dh;
    if (r2) {
      (l2.setAttribute(`cx`, u2.toFixed(1)),
        l2.setAttribute(`cy`, p2.toFixed(1)),
        l2.setAttribute(`rx`, m2.toFixed(1)),
        l2.setAttribute(`ry`, h2.toFixed(1)));
      let t3 = (m2 - h2) ** 2 / (m2 + h2) ** 2,
        r3 =
          Math.PI * (m2 + h2) * (1 + (3 * t3) / (10 + Math.sqrt(4 - 3 * t3))),
        i3 = smoothstep(clamp((e2 - n3 * 0.16) / 0.52, 0, 1));
      ((l2.style.strokeDasharray = `1.4 7`),
        (l2.style.strokeDashoffset = ((1 - i3) * r3).toFixed(1)),
        (l2.style.opacity = i3.toFixed(3)),
        l2.style.setProperty(`--adur`, (7.5 + n3 * 2.6).toFixed(1) + `s`),
        l2.style.setProperty(`--adl`, (-(n3 * 3.1)).toFixed(1) + `s`));
    }
    let g2 = c2 + (performance.now() / 1e3) * (n3 % 2 ? -0.6 : 0.9),
      _2 = (Math.round(g2 / 0.2) * 0.2).toFixed(1);
    (kr[n3] !== _2 || r2) &&
      ((kr[n3] = _2),
      l2.setAttribute(
        `transform`,
        `rotate(${_2} ${u2.toFixed(1)} ${p2.toFixed(1)})`,
      ));
  }
}
var jr = ``;
function renderStars(e2) {
  if (!Wn || ((Wn.style.opacity = e2.toFixed(3)), e2 < 2e-3)) return;
  let t2 = flightFraming(),
    n2 = `${t2.ox.toFixed(1)}|${t2.oy.toFixed(1)}|${t2.dw.toFixed(1)}`;
  if (n2 !== jr) {
    jr = n2;
    for (let e3 = 0; e3 < Gn.length; e3++) {
      let [n3, r2, i2] = STAR_POSITIONS[e3],
        a2 = (i2 === 2 ? 78 : 46) * formMotion.bgScale,
        o2 = Gn[e3];
      ((o2.style.left = (t2.ox + n3 * t2.dw).toFixed(1) + `px`),
        (o2.style.top = (t2.oy + r2 * t2.dh).toFixed(1) + `px`),
        (o2.style.width = a2.toFixed(1) + `px`),
        (o2.style.height = a2.toFixed(1) + `px`));
    }
  }
}
var Nr = false;
var Pr = null;
function renderForm(e2, t2) {
  if (!zn) return;
  if (e2 <= 5e-4 && Yn <= 5e-4 && t2 <= formMotion.at) {
    if (Nr) return;
    Nr = true;
  } else Nr = false;
  (renderStars(smoothstep(clamp((t2 - 0.9) / 0.1, 0, 1))),
    renderOrbits(smoothstep(clamp((t2 - 0.8) / 0.2, 0, 1))));
  let n2 = clamp((t2 - formMotion.at) / formMotion.span, 0, 1),
    r2 = smoothstep(n2);
  if (Bn) {
    let e3 = clamp((n2 - formMotion.hold - 0.1) / 0.46, 0, 1),
      t3 = e3 * e3 * e3 * (e3 * (e3 * 6 - 15) + 10);
    ((Bn.style.opacity = t3.toFixed(3)),
      (Bn.style.transform = `translateY(${((1 - t3) * 11).toFixed(1)}px)`));
  }
  zn.style.opacity = r2 > 1e-3 || e2 > 1e-3 ? `1` : `0`;
  {
    let t3 = e2 > 1e-3 || n2 > 0.995;
    (zn.classList.toggle(`live`, t3),
      (zn.inert = !t3),
      zn.setAttribute(`aria-hidden`, String(!t3)));
  }
  zn.style.perspective = formMotion.persp + `px`;
  let i2 = innerWidth,
    a2 = innerHeight,
    o2 = i2 <= 720,
    s2 = o2
      ? Math.min((i2 * mobileTerms.w) / 496, (a2 - 240) / 378) /
        formMotion.scale
      : Math.min(i2 / 1180, a2 / 900),
    c2 = o2 ? mobileTerms.x - 210 * s2 * formMotion.scale : formMotion.px,
    l2 = s2 * formMotion.scale,
    u2 = o2 ? 60 - a2 / 2 + 232 * l2 + mobileTerms.y : formMotion.py,
    p2 = Math.max(smoothstep(clamp((e2 - 0.06) / 0.4, 0, 1)), r2),
    m2 = (1 - p2) * formMotion.ryIn + formMotion.ry + pointer.x * 5.5,
    h2 = (1 - p2) * formMotion.rxIn + formMotion.rx - pointer.y * 4,
    g2 = (1 - p2) * formMotion.rzIn + formMotion.rz,
    v2 = flightFraming(),
    y2 = v2.ox + 0.3715 * v2.dw,
    x2 = v2.oy + 0.148 * v2.dh,
    ee2 = clamp((n2 - formMotion.hold) / Math.max(0.02, formMotion.run), 0, 1),
    S2 = 1 - EASINGS[formMotion.ease | 0].f(ee2),
    C2 =
      Yn > 5e-4
        ? `translate3d(0,${(-Yn * innerHeight * 1.22).toFixed(1)}px,0) scale(${(1 + Yn * 0.1).toFixed(4)}) `
        : ``,
    te2 = (e3, t3) =>
      C2 +
      `translate(${(c2 + e3 + pointer.x * 16).toFixed(1)}px, ${(u2 + t3 + (1 - p2) * 90 + pointer.y * 12).toFixed(1)}px) scale(${(s2 * formMotion.scale).toFixed(4)}) rotateX(${h2.toFixed(2)}deg) rotateY(${m2.toFixed(2)}deg) rotateZ(${g2.toFixed(2)}deg)`;
  !Pr && Kn[0] && (Pr = Kn[0].querySelector(`.ic`));
  let w2 = S2 > 2e-3 && Pr;
  if (w2) {
    Vn.style.transform = te2(0, 0);
    let e3 = w2.getBoundingClientRect();
    Xn = [y2 - (e3.left + e3.width / 2), x2 - (e3.top + e3.height / 2)];
  }
  Vn.style.transform = te2(Xn[0] * S2, Xn[1] * S2);
  for (let e3 = 0; e3 < Kn.length; e3++) {
    let t3 = Sr[e3 % Sr.length],
      n3 = smoothstep(
        clamp((r2 - e3 * formMotion.stagger) / formMotion.each, 0, 1),
      );
    Kn[e3].style.opacity = n3.toFixed(3);
    let i3 = qn < 0 ? 0 : e3 === qn ? formMotion.pop : -formMotion.push;
    Jn[e3] = (Jn[e3] || 0) + (i3 - (Jn[e3] || 0)) * 0.12;
    let a3 = e3 === qn ? 1 : qn < 0 ? 0 : -1,
      o3 = (Kn.length - 1 - e3) * 7,
      s3 = clamp((ee2 - t3.d) / Math.max(0.05, t3.r), 0, 1),
      c3 = 1 - EASINGS[t3.e].f(s3),
      l3 = (t3.ax * c3 * 90).toFixed(1),
      u3 = (t3.ay * c3 * 90).toFixed(1);
    ((Kn[e3].style.transform =
      `translate3d(${l3}px, ${u3}px, ${((1 - n3) * -180 + o3 + Jn[e3]).toFixed(1)}px) rotateZ(${(t3.rz * c3).toFixed(2)}deg)`),
      (Kn[e3].style.filter =
        a3 < 0 && innerWidth > 720
          ? `brightness(${(1 - 0.1 * (-Jn[e3] / Math.max(1, formMotion.push))).toFixed(3)})`
          : ``));
    let p3 = Kn[e3].style;
    (p3.setProperty(`--blur`, formMotion.blur + `px`),
      p3.setProperty(`--fill`, formMotion.fill),
      p3.setProperty(`--rim`, formMotion.rim),
      p3.setProperty(`--bev`, formMotion.bev + `px`),
      p3.setProperty(`--bev2`, formMotion.bev2),
      p3.setProperty(`--spec`, formMotion.spec),
      p3.setProperty(`--sat`, formMotion.sat),
      p3.setProperty(`--ins`, formMotion.ins),
      p3.setProperty(`--insB`, formMotion.insB + `px`),
      p3.setProperty(`--insY`, formMotion.insY + `px`));
  }
}
function createFooterRenderer() {
  let e2 = fr.getContext(`webgl`);
  if (!e2) return null;
  let t2 = (t3, n3) => {
      let r3 = e2.createShader(t3);
      return (
        e2.shaderSource(r3, n3),
        e2.compileShader(r3),
        e2.getShaderParameter(r3, e2.COMPILE_STATUS)
          ? r3
          : (console.warn(e2.getShaderInfoLog(r3)), null)
      );
    },
    n2 = t2(e2.VERTEX_SHADER, FOOTER_VERTEX),
    r2 = t2(e2.FRAGMENT_SHADER, FOOTER_FRAGMENT);
  if (!n2 || !r2) return null;
  let i2 = e2.createProgram();
  (e2.attachShader(i2, n2),
    e2.attachShader(i2, r2),
    e2.linkProgram(i2),
    e2.useProgram(i2));
  let a2 = e2.createBuffer();
  (e2.bindBuffer(e2.ARRAY_BUFFER, a2),
    e2.bufferData(
      e2.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      e2.STATIC_DRAW,
    ));
  let o2 = e2.getAttribLocation(i2, `a`);
  (e2.enableVertexAttribArray(o2),
    e2.vertexAttribPointer(o2, 2, e2.FLOAT, false, 0, 0),
    e2.pixelStorei(e2.UNPACK_FLIP_Y_WEBGL, true));
  let s2 = (t3) => {
      let n3 = e2.createTexture();
      return (
        e2.activeTexture(e2.TEXTURE0 + t3),
        e2.bindTexture(e2.TEXTURE_2D, n3),
        [
          [e2.TEXTURE_WRAP_S, e2.CLAMP_TO_EDGE],
          [e2.TEXTURE_WRAP_T, e2.CLAMP_TO_EDGE],
          [e2.TEXTURE_MIN_FILTER, e2.LINEAR],
          [e2.TEXTURE_MAG_FILTER, e2.LINEAR],
        ].forEach(([t4, n4]) => e2.texParameteri(e2.TEXTURE_2D, t4, n4)),
        n3
      );
    },
    c2 = s2(0),
    l2 = s2(1),
    u2 = new Uint8Array([11, 10, 9, 255]);
  for (let [t3, n3] of [
    [0, c2],
    [1, l2],
  ])
    (e2.activeTexture(e2.TEXTURE0 + t3),
      e2.bindTexture(e2.TEXTURE_2D, n3),
      e2.texImage2D(
        e2.TEXTURE_2D,
        0,
        e2.RGBA,
        1,
        1,
        0,
        e2.RGBA,
        e2.UNSIGNED_BYTE,
        u2,
      ));
  let d2 = {};
  for (let t3 of [
    `progress`,
    `grade`,
    `scaleB`,
    `mode`,
    `radius`,
    `width`,
    `intensity`,
    `time`,
    `res`,
    `img`,
  ])
    d2[t3] = e2.getUniformLocation(i2, t3);
  let f2 = (t3) => e2.getUniformLocation(i2, t3);
  return (
    e2.uniform1i(f2(`t1`), 0),
    e2.uniform1i(f2(`t2`), 1),
    e2.uniform1f(d2.scaleB, footerTransition.scaleB),
    e2.uniform1f(d2.mode, footerTransition.mode),
    e2.uniform1f(d2.radius, footerTransition.radius),
    e2.uniform1f(d2.width, footerTransition.width),
    e2.uniform1f(d2.intensity, footerTransition.noise),
    e2.uniform2f(d2.img, 1920, 1080),
    {
      g: e2,
      loc: d2,
      tA: c2,
      tB: l2,
    }
  );
}
var Lr = (e2) => {
  let t2 = 1;
  for (; t2 < SECONDARY_EFFECTS.length - 1 && e2 > SECONDARY_EFFECTS[t2];) t2++;
  let n2 =
    (e2 - SECONDARY_EFFECTS[t2 - 1]) /
    (SECONDARY_EFFECTS[t2] - SECONDARY_EFFECTS[t2 - 1]);
  return (
    SECONDARY_STARTS[t2 - 1] +
    (SECONDARY_STARTS[t2] - SECONDARY_STARTS[t2 - 1]) * clamp(n2, 0, 1)
  );
};
function renderFooterTransition(e2, t2) {
  if (((pr ||= createFooterRenderer()), !pr)) return 0;
  let n2 = clamp((e2 - footerTransition.at) / footerTransition.span, 0, 1);
  if (n2 <= 5e-4) return ((fr.style.opacity = `0`), (br = false), 0);
  ((fr.style.opacity = `1`), (br = true));
  let { g: r2, loc: i2 } = pr,
    a2 = Math.min(devicePixelRatio, innerWidth <= 720 ? 1.5 : 2),
    o2 = Math.round(innerWidth * a2),
    s2 = Math.round(innerHeight * a2);
  ((fr.width !== o2 || fr.height !== s2) && ((fr.width = o2), (fr.height = s2)),
    r2.viewport(0, 0, fr.width, fr.height));
  let c2 = false;
  if (
    (t2 &&
      t2.complete &&
      t2.naturalWidth &&
      t2 !== mr &&
      ((mr = t2),
      (c2 = true),
      r2.activeTexture(r2.TEXTURE0),
      r2.bindTexture(r2.TEXTURE_2D, pr.tA),
      gr
        ? r2.texSubImage2D(
            r2.TEXTURE_2D,
            0,
            0,
            0,
            r2.RGBA,
            r2.UNSIGNED_BYTE,
            t2,
          )
        : (r2.texImage2D(
            r2.TEXTURE_2D,
            0,
            r2.RGBA,
            r2.RGBA,
            r2.UNSIGNED_BYTE,
            t2,
          ),
          (gr = true))),
    Zn.readyState >= 2 && Zn.currentTime !== hr)
  ) {
    let e3 = hr < 0;
    ((hr = Zn.currentTime),
      (c2 = true),
      r2.activeTexture(r2.TEXTURE1),
      r2.bindTexture(r2.TEXTURE_2D, pr.tB),
      e3
        ? r2.texImage2D(
            r2.TEXTURE_2D,
            0,
            r2.RGBA,
            r2.RGBA,
            r2.UNSIGNED_BYTE,
            Zn,
          )
        : r2.texSubImage2D(
            r2.TEXTURE_2D,
            0,
            0,
            0,
            r2.RGBA,
            r2.UNSIGNED_BYTE,
            Zn,
          ));
  }
  if (
    (n2 !== _r && ((_r = n2), (c2 = true)),
    (fr.width !== vr || fr.height !== yr) &&
      ((vr = fr.width), (yr = fr.height), (c2 = true)),
    !c2)
  )
    return 1;
  let l2 = clamp(Zn.currentTime || 0, 0, 10);
  return (
    r2.uniform1f(i2.progress, n2),
    r2.uniform1f(i2.grade, 0.955 / Lr(l2)),
    r2.uniform1f(i2.time, performance.now() / 1e3),
    r2.uniform2f(i2.res, fr.width, fr.height),
    r2.drawArrays(r2.TRIANGLES, 0, 3),
    1
  );
}
function renderFooterText(e2) {
  if (
    !tr ||
    ((tr.style.opacity = e2 > 1e-3 ? `1` : `0`),
    document.body.classList.toggle(`ft-on`, e2 > 0.02),
    e2 < 1e-3)
  )
    return;
  let t2 =
    Math.min(innerWidth / 1920, innerHeight / 1080) *
    (innerWidth <= 720 ? mobileForm.k : 1);
  nr.style.transform = `scale(${t2.toFixed(5)})`;
  for (let t3 = 0; t3 < rr.length; t3++) {
    let n3 = smoothstep(clamp((e2 - t3 * 0.04) / 0.26, 0, 1));
    rr[t3].style.transform = rr[t3].classList.contains(`h`)
      ? `scaleX(${n3.toFixed(3)})`
      : `scaleY(${n3.toFixed(3)})`;
  }
  let n2 = smoothstep(clamp((e2 - 0.1) / 0.42, 0, 1));
  ir.style.strokeDashoffset = (2884 * (1 - n2)).toFixed(1);
  for (let t3 = 0; t3 < ar.length; t3++) {
    let n3 = smoothstep(clamp((e2 - 0.14 - t3 * 0.045) / 0.26, 0, 1));
    ar[t3].style.opacity = n3.toFixed(3);
  }
  for (let t3 = 0; t3 < or.length; t3++) {
    let n3 = easeOutQuart(clamp((e2 - 0.2 - t3 * 0.075) / 0.34, 0, 1));
    or[t3].style.transform = `translateY(${((1 - n3) * 120).toFixed(1)}%)`;
  }
}
function renderFooter(e2) {
  if (!Zn) return;
  if (!(e2 > 5e-4)) {
    (renderFooterText(0),
      (sr.style.opacity = `0`),
      (Zn.style.opacity = `0`),
      (fr.style.opacity = `0`),
      $n &&
        (($n = false),
        (Yn = 0),
        zn &&
          ((zn.style.transform = ``),
          (zn.style.filter = ``),
          (zn.style.opacity = ``),
          (zn.style.zIndex = ``)),
        Vn && (Vn.style.filter = ``),
        Bn && (Bn.style.opacity = ``)),
      Qn && ((Qn = false), Zn.pause()),
      (lr = -1));
    return;
  }
  if (((Qn = true), Zn.paused && Zn.readyState >= 2)) {
    let e3 = Zn.play();
    e3 && e3.catch && e3.catch(() => {});
  }
  let t2 = smoothstep(clamp(e2 / 0.34, 0, 1));
  (($n = true),
    (Yn = t2),
    zn &&
      ((zn.style.zIndex = `7`),
      (zn.style.transform = ``),
      (zn.style.filter = ``),
      (zn.style.opacity = t2 > 0.99 ? `0` : `1`)),
    Vn && (Vn.style.filter = t2 > 0.02 ? `blur(${(t2 * 7).toFixed(2)}px)` : ``),
    Bn &&
      (Bn.style.opacity = (1 - smoothstep(clamp(e2 / 0.28, 0, 1))).toFixed(3)));
  let n2 = clamp(e2 / FOOTER_HOLD, 0, 1);
  {
    let e3 = Math.min(120, Math.round(n2 * 120));
    if ((cr.aim(e3), cr.ready)) {
      let t3 = cr.near(e3);
      t3 &&
        (t3 !== ur && ((ur = t3), br || (drawFrame(sr, t3), (xr = t3))),
        (lr = e3));
    }
  }
  let r2 = innerWidth <= 720,
    i2 = r2
      ? 50 +
        (mobileFlight.x - 50) *
          clamp(
            (1 - mobileFlight.from) / Math.max(0.02, mobileFlight.span),
            0,
            1,
          )
      : formMotion.bgX,
    a2 = smoothstep(
      clamp(
        (n2 - (r2 ? mobileSignature.at : 0.12)) /
          Math.max(0.02, r2 ? mobileSignature.span : 0.6),
        0,
        1,
      ),
    ),
    o2 = flightFraming(
      i2 + (50 - i2) * a2,
      formMotion.bgScale + (1 - formMotion.bgScale) * a2,
    );
  ((sr.style.width = o2.dw.toFixed(1) + `px`),
    (sr.style.height = o2.dh.toFixed(1) + `px`),
    (sr.style.left = o2.ox.toFixed(1) + `px`),
    (sr.style.top = o2.oy.toFixed(1) + `px`));
  let s2 = renderFooterTransition(n2, lr >= 0 ? ur : null);
  (!s2 && ur && xr !== ur && (drawFrame(sr, ur), (xr = ur)),
    (sr.style.opacity = lr >= 0 && !s2 ? `1` : `0`),
    (Zn.style.opacity = !s2 && n2 >= 1 ? `1` : `0`),
    renderFooterText(
      smoothstep(
        clamp((e2 - FOOTER_HOLD * 0.3) / (1 - FOOTER_HOLD * 0.3), 0, 1),
      ),
    ));
}
var Vr;
var Hr;
var Ur;
var Wr;
var Gr = [];
var Kr = [];
var qr = [];
var Jr = [];
var Yr;
var Xr;
var Zr;
var Qr;
var $r;
var ei = [];
var ti = [];
var ni = [];
var ri = 0;
var ii = false;
var ai = -1;
var oi = 0;
var si = 0;
var ci = -1;
function initTerms() {
  if (
    ((Vr = document.querySelector(`.fin`)),
    (Hr = [...document.querySelectorAll(`.fin-top, .fin-bot`)]),
    (Ur = document.querySelector(`.fin-g[data-f="1"] .fin-top`)),
    (Wr = document.querySelector(`.fin-g[data-f="1"] .fin-bot`)),
    (Gr = [...document.querySelectorAll(`.fin-g`)]),
    (Kr = Gr.map((e2) => [...e2.querySelectorAll(`.fin-h .ln i`)])),
    (qr = Gr.map((e2) => [
      ...e2.querySelectorAll(`.fin-l, .fin-chip, .fin-s`),
    ])),
    (Jr = Gr.map((e2) => [...e2.querySelectorAll(`.fin-soak`)])),
    (Yr = document.querySelector(`#inkf feDisplacementMap`)),
    (Xr = document.querySelector(`#inkf feFuncA`)),
    innerWidth <= 720)
  )
    for (let e2 of Jr) for (let t2 of e2) t2.style.filter = `none`;
  else for (let e2 of Jr[1] || []) e2.style.filter = `none`;
  ((Zr = document.querySelector(`.sign`)),
    (Qr = Zr && Zr.querySelector(`.sg-a`)),
    ($r = Zr && Zr.querySelector(`.sg-b`)),
    (ei = $r
      ? [...$r.querySelectorAll(`path`)].map((e2) => {
          let t2 = e2.getTotalLength();
          return (
            (e2.style.strokeDasharray = t2),
            (e2.style.strokeDashoffset = t2),
            (e2.style.opacity = `0`),
            {
              el: e2,
              a: +e2.dataset.a,
              b: +e2.dataset.b,
              len: t2,
            }
          );
        })
      : []),
    (ti = [...document.querySelectorAll(`.ov .wob`)]),
    (ni = [...document.querySelectorAll(`.ov .gv, .ov .gh`)]));
}
function renderTerms(e2, t2, n2) {
  if (!Vr) return ri;
  let r2 = innerWidth <= 720,
    i2 = innerWidth / 1516;
  r2 &&
    Vr._join !== mobilePlan.join &&
    ((Vr._join = mobilePlan.join),
    Vr.style.setProperty(`--join`, (mobilePlan.join * 100).toFixed(1) + `%`));
  for (let e3 of Hr)
    e3 === Ur ||
      e3 === Wr ||
      (e3.style.transform = r2 ? `scale(1)` : `scale(${i2.toFixed(5)})`);
  let a2 = clamp(
    (readout.plan - TERMS_INK_START) / (1 - TERMS_INK_START),
    0,
    1,
  );
  ((ri = clamp((t2 - TERMS_SPLIT_START) / (1 - TERMS_SPLIT_START), 0, 1)),
    (readout.ink = a2));
  let o2 = clamp(e2 / GRAFT_PAUSE, 0, 1),
    s2 =
      ri > 0.5
        ? smoothstep(
            clamp(
              (graftTime(e2) - TERMS_EXIT_START) / TERMS_EXIT_DURATION,
              0,
              1,
            ),
          )
        : 0,
    c2 = [
      smoothstep(clamp(a2 / 0.22, 0, 1)),
      smoothstep(clamp(o2 / 0.02, 0, 1)) * (1 - s2),
    ];
  if (Ur) {
    let e3 = smoothstep(clamp(o2 / 0.78, 0, 1)),
      t3 = easeOutQuart(clamp(r2 ? e3 : (e3 - 0.62) / 0.38, 0, 1)),
      n3 = 1 + ((r2 ? MOBILE_TERMS_ZOOM : TERMS_ZOOM) - 1) * (1 - t3);
    if (
      (r2 && (n3 = Math.round(n3 * 100) / 100),
      (Ur.style.transform = r2
        ? `translate(0px,${((1 - e3) * 520).toFixed(1)}px) scale(${n3.toFixed(4)})`
        : `scale(${i2.toFixed(5)}) translate(0px,${((1 - e3) * 1190).toFixed(1)}px) scale(${n3.toFixed(4)})`),
      Wr)
    ) {
      let t4 = smoothstep(clamp((e3 - 0.55) / 0.4, 0, 1));
      ((Wr.style.transform = r2
        ? `translateY(${((1 - t4) * 110).toFixed(1)}px)`
        : `scale(${i2.toFixed(5)}) translateY(${((1 - t4) * 230).toFixed(1)}px)`),
        (Wr.style.opacity = t4.toFixed(3)));
    }
  }
  let l2 = a2 >= 0.999 || a2 <= 1e-3;
  if (
    Yr &&
    Math.abs(a2 - ai) > 5e-4 &&
    (l2 || innerWidth > 720 || n2 - oi > 33)
  ) {
    ((oi = n2), (ai = a2));
    let e3 = smoothstep(a2);
    if (r2)
      for (let t3 of Jr[0])
        ((t3.style.filter =
          a2 >= 0.999
            ? `none`
            : `blur(${((1 - e3) * 3.4).toFixed(2)}px) contrast(${(1 + (1 - e3) * 6).toFixed(2)})`),
          (t3.style.opacity = clamp(a2 * 1.12, 0, 1).toFixed(3)));
    else {
      (Yr.setAttribute(`scale`, ((1 - e3) * 34).toFixed(2)),
        Xr.setAttribute(
          `intercept`,
          (-7.4 + 8.4 * clamp(a2 * 1.12, 0, 1)).toFixed(3),
        ),
        Xr.setAttribute(`slope`, (9 - 5 * e3).toFixed(2)));
      for (let t3 of Jr[0])
        (t3.style.setProperty(`--soak`, ((1 - e3) * 3.4).toFixed(2) + `px`),
          t3.style.setProperty(`--bite`, (1 + (1 - e3) * 6).toFixed(2)),
          (t3.style.filter = a2 >= 0.999 ? `none` : ``));
    }
  }
  {
    let e3 =
      !!paperLighting.lit * (1 - smoothstep(clamp((ri - 0.35) / 0.2, 0, 1)));
    if (e3 > 0.01 !== ii) {
      ii = e3 > 0.01;
      for (let e4 of ni) e4.classList.toggle(`warp`, ii);
      for (let e4 of ti) e4._L = void 0;
    }
    if (ii && n2 - si > 32) {
      si = n2;
      let t3 = n2 * 1e-3;
      for (let n3 of ti) {
        let r3 = n3.parentElement;
        if (n3._L === void 0) {
          let e4 = r3.getBoundingClientRect();
          n3._L = Math.max(
            1,
            r3.classList.contains(`gv`) ? e4.height : e4.width,
          );
        }
        let i3 = r3.classList.contains(`gv`),
          a3 = n3._L,
          o3 = e3 * 7.5,
          s3 = ``;
        for (let e4 = 0; e4 <= 14; e4++) {
          let n4 = e4 / 14,
            r4 = n4 * a3,
            c3 =
              o3 *
              (Math.sin(n4 * 5.2 + t3 * 1.25) * 0.62 +
                Math.sin(n4 * 11.4 - t3 * 0.87) * 0.38);
          s3 +=
            (e4 ? `L` : `M`) +
            (i3
              ? `${(24 + c3).toFixed(1)},${r4.toFixed(1)}`
              : `${r4.toFixed(1)},${(24 + c3).toFixed(1)}`);
        }
        (n3.setAttribute(
          `viewBox`,
          i3 ? `0 0 49 ${a3.toFixed(0)}` : `0 0 ${a3.toFixed(0)} 49`,
        ),
          n3.firstElementChild.setAttribute(`d`, s3));
      }
    }
  }
  let u2 = r2 ? Math.round(s2 * 26) / 2 : s2 * 13;
  if (
    ((Gr[1].style.filter = u2 > 0.01 ? `blur(${u2.toFixed(2)}px)` : ``),
    Math.abs(ri - ci) > 5e-4)
  ) {
    ci = ri;
    let e3 = (1.52 - 2.04 * ri) * 100;
    r2
      ? ((Gr[0].style.clipPath =
          ri > 1e-3
            ? `inset(0 0 ${clamp(100 - e3, 0, 100).toFixed(2)}% 0)`
            : ``),
        (Gr[1].style.clipPath =
          ri > 1e-3 && ri < 0.999
            ? `inset(${clamp(e3, 0, 100).toFixed(2)}% 0 0 0)`
            : ``))
      : ((Gr[0].style.webkitMaskImage = Gr[0].style.maskImage =
          ri > 1e-3
            ? `linear-gradient(to top, var(--transparent) ${(100 - e3 - 1.5).toFixed(1)}%, var(--mask-ink) ${(100 - e3 + 3).toFixed(1)}%)`
            : ``),
        (Gr[1].style.webkitMaskImage = Gr[1].style.maskImage =
          ri > 1e-3 && ri < 0.999
            ? `linear-gradient(to top, var(--mask-ink) ${(100 - e3 - 1.5).toFixed(1)}%, var(--transparent) ${(100 - e3 + 3).toFixed(1)}%)`
            : ``));
  }
  Vr.style.opacity = Math.max(c2[0], c2[1]) > 1e-3 ? `1` : `0`;
  for (let e3 = 0; e3 < Gr.length; e3++) {
    let t3 = c2[e3];
    Gr[e3].style.opacity = t3.toFixed(3);
    let n3 = Kr[e3];
    for (let e4 = 0; e4 < n3.length; e4++) {
      let r3 = easeOutQuart(clamp((t3 - e4 * 0.12) / 0.62, 0, 1));
      n3[e4].style.transform = `translateY(${((1 - r3) * 120).toFixed(1)}%)`;
    }
    for (let t4 of qr[e3])
      ((t4.style.opacity = `1`), (t4.style.transform = `translateY(0px)`));
  }
  return ri;
}
function renderSignature(e2, t2) {
  if (!Zr) return;
  let n2 = Math.round(t2 * 22) / 2;
  Zr.style.filter = n2 > 0.01 ? `blur(${n2.toFixed(1)}px)` : ``;
  let r2 = clamp((e2 - FAQ_START) / (1 - FAQ_START), 0, 1),
    i2 = smoothstep(clamp((r2 - 0.3) / 0.7, 0, 1)),
    a2 =
      innerWidth <= 720
        ? SIGNATURE_START + (1 - SIGNATURE_START) * i2
        : 1 - (1 - SIGNATURE_START) * i2,
    o2 = Math.round(a2 * (1 + t2 * 0.06) * 100) / 100;
  ((Zr.style.transform = `translate(${(pointer.x * 15).toFixed(1)}px,${(-i2 * innerHeight * 0.072 + pointer.y * 12 - t2 * innerHeight * 0.09).toFixed(1)}px) scale(${o2.toFixed(2)})`),
    (Zr.style.opacity = (1 - t2).toFixed(3)),
    Qr && (Qr.style.opacity = smoothstep(clamp(r2 / 0.22, 0, 1)).toFixed(3)));
  let s2 = smoothstep(clamp((r2 - 0.2) / 0.62, 0, 1));
  if ($r) {
    $r.style.opacity = s2 > 1e-3 ? `1` : `0`;
    for (let e3 = 0; e3 < ei.length; e3++) {
      let t3 = ei[e3],
        n3 = clamp((s2 - t3.a) / Math.max(1e-4, t3.b - t3.a), 0, 1);
      ((t3.el.style.opacity = n3 > 0 ? `1` : `0`),
        (t3.el.style.strokeDashoffset = (t3.len * (1 - n3)).toFixed(2)));
    }
  }
}
var fi;
var pi;
var mi;
var hi = [];
var gi = [];
var _i = [];
var vi = [];
var yi = [];
var bi = [];
var xi = 0;
var Si = 0;
function initWork() {
  ((fi = document.querySelector(`.pf`)),
    (pi = document.querySelector(`.pf-in`)),
    (mi = document.querySelector(`.pf-head`)),
    (hi = [...document.querySelectorAll(`.pf-g`)]),
    (gi = hi.map((e3) => [...e3.querySelectorAll(`.pf-h .ln i`)])),
    (_i = hi.map((e3) => [
      e3.querySelector(`.pf-chip`),
      e3.querySelector(`.pf-b`),
    ])),
    (yi = hi.map(() => 0)),
    (bi = hi.map(() => 0)));
  let e2 = document.querySelector(`.pf-ticks`);
  if (((vi = []), e2))
    for (let t2 = 1; t2 < 34; t2++) {
      let n2 = t2 * WORK_TICK_SPACING,
        r2 = t2 % 5 == 0,
        i2 = document.createElementNS(`http://www.w3.org/2000/svg`, `line`);
      (i2.setAttribute(`x1`, 818),
        i2.setAttribute(`x2`, 818 + (r2 ? 13 : 6)),
        i2.setAttribute(`y1`, n2),
        i2.setAttribute(`y2`, n2),
        e2.appendChild(i2),
        vi.push({
          el: i2,
          y: n2,
          long: r2,
        }));
    }
}
var wi = (e2) => ((Si ||= e2), (e2 - Si) / 1e3);
function renderWork(e2, t2, n2, r2, i2) {
  if (!fi) return;
  if (t2 <= 0 || i2 <= 1e-3) {
    fi.style.opacity !== `0` && (fi.style.opacity = `0`);
    return;
  }
  fi.style.opacity = `1`;
  let a2 = innerWidth / WORK_DESIGN_WIDTH,
    o2 = innerWidth <= 720 ? innerWidth * 0.0475 - 818 * a2 : 0,
    s2 = innerHeight - innerHeight * t2 * (1 - n2);
  pi.style.transform = `translate(${o2.toFixed(2)}px,${s2.toFixed(2)}px) scale(${a2.toFixed(5)})`;
  let c2 =
      overlayExit.auto > 0.5
        ? clamp(getTearIntersection() + overlayExit.lead, 0, 1)
        : overlayExit.ret,
    l2 = Math.min(0.8, c2 + overlayExit.retLen * 0.85),
    u2 = smoothstep(clamp((i2 - l2) / Math.max(0.06, 1 - l2), 0, 1));
  wi(r2);
  let p2 = clamp((innerHeight * 0.92 - s2) / a2, 0, WORK_DESIGN_HEIGHT);
  if (mi) {
    ((mi.style.transform = `translateY(${p2.toFixed(1)}px)`),
      (mi.style.opacity = (
        u2 * smoothstep(clamp((1 - e2) / 0.08, 0, 1))
      ).toFixed(3)));
    let t3 = Math.round((p2 / WORK_DESIGN_HEIGHT) * 100);
    t3 !== mi._p && ((mi._p = t3), (mi.firstChild.textContent = t3 + `%`));
  }
  let m2 = 0;
  for (let e3 = 0; e3 < WORK_PANEL_STOPS.length; e3++)
    p2 >= WORK_PANEL_STOPS[e3] && (m2 = e3);
  let h2 = WORK_PANEL_STOPS[m2],
    g2 =
      m2 + 1 < WORK_PANEL_STOPS.length
        ? WORK_PANEL_STOPS[m2 + 1]
        : WORK_DESIGN_HEIGHT,
    _2 = 0;
  for (let e3 of vi) e3.j = e3.y >= h2 && e3.y < g2 ? _2++ : -1;
  for (let e3 = 0; e3 < vi.length; e3++) {
    let t3 = vi[e3],
      n3 = clamp((p2 - t3.y) / 60, 0, 1),
      r3 = Math.exp(-Math.abs(p2 - t3.y) / 190),
      i3 = 0.5 + 0.5 * Math.sin(p2 * 0.011 + e3 * 1.7),
      a3 = t3.long ? 15 : 7,
      o3 = 0;
    if (t3.j >= 0) {
      let e4 = _2 > 1 ? 0.62 / (_2 - 1) : 0;
      o3 = smoothstep(clamp((yi[m2] - t3.j * e4) / 0.34, 0, 1));
    }
    let s3 = a3 * (0.55 + 0.75 * i3 + 0.9 * r3) + o3 * (t3.long ? 30 : 23);
    (t3.el.setAttribute(`x2`, (818 + s3).toFixed(1)),
      (t3.el.style.opacity = (
        u2 * Math.max(n3 * ((t3.long ? 0.62 : 0.38) + 0.38 * r3), o3 * 0.96)
      ).toFixed(3)));
  }
  let v2 = xi ? Math.min(64, r2 - xi) : 16;
  xi = r2;
  for (let t3 = 0; t3 < hi.length; t3++) {
    let n3 = innerWidth <= 720,
      r3 = n3 ? e2 >= WORK_BEATS[t3] : p2 >= WORK_PANEL_STOPS[t3],
      i3 = n3 && t3 + 1 < WORK_BEATS.length && e2 >= WORK_BEATS[t3 + 1],
      a3 = u2 > 0.1 && r3 && !i3,
      o3 = t3 === 0 ? 340 : 0,
      s3 = v2 / 820;
    bi[t3] = clamp(bi[t3] + (a3 ? s3 : -s3), 0, 1);
    let c3 = smoothstep(clamp(bi[t3] + (a3 && o3 ? o3 / 820 : 0), 0, 1)),
      l3 = n3 ? 0 : (WORK_PANEL_STOPS[t3] - p2) * 0.375;
    yi[t3] = c3;
    let m3 = c3;
    ((hi[t3].style.opacity = c3.toFixed(3)),
      (hi[t3].style.transform =
        `translateY(${(l3 + (1 - m3) * 10).toFixed(1)}px)`));
    let h3 = gi[t3];
    for (let e3 = 0; e3 < h3.length; e3++) {
      let t4 = clamp((m3 - e3 * 0.055) / 0.8, 0, 1);
      h3[e3].style.transform = `translateX(${((1 - t4) * 115).toFixed(2)}%)`;
    }
    let g3 = clamp(m3 / 0.42, 0, 1),
      _3 = clamp((m3 - 0.3) / 0.7, 0, 1);
    (_i[t3][0] &&
      ((_i[t3][0].style.opacity = g3.toFixed(3)),
      (_i[t3][0].style.transform =
        `translateY(${((1 - g3) * 8).toFixed(1)}px)`)),
      _i[t3][1] &&
        ((_i[t3][1].style.opacity = _3.toFixed(3)),
        (_i[t3][1].style.transform =
          `translateY(${((1 - _3) * 10).toFixed(1)}px)`)));
  }
}
function exitWork(e2) {
  fi &&
    e2 > 0 &&
    (fi.style.opacity = (1 - smoothstep(clamp(e2 / 0.16, 0, 1))).toFixed(3));
}
var Di = [];
function initRail() {
  Di = [...document.querySelectorAll(`.rail a`)].map((e2) => ({
    el: e2,
    at: parseFloat(e2.dataset.at || `0`),
  }));
  for (let e2 of Di)
    e2.el.addEventListener(`click`, (t2) => {
      (t2.preventDefault(),
        (scrollState.target = clamp(e2.at * scrollRange(), 0, scrollRange())),
        scrollState.on ||
          (markProgrammaticScroll(scrollState.target),
          scrollTo(0, scrollState.target),
          (scrollState.current = scrollState.target)));
    });
}
function renderRail(e2) {
  let t2 = -1;
  for (let n2 = 0; n2 < Di.length; n2++) e2 >= Di[n2].at - 2e-3 && (t2 = n2);
  for (let e3 = 0; e3 < Di.length; e3++) {
    let n2 = e3 === t2;
    n2 !== Di[e3].on &&
      ((Di[e3].on = n2), Di[e3].el.classList.toggle(`on`, n2));
  }
}
var Ai = new URLSearchParams(location.search);
var ji = Ai.has(`hud`);
var Mi = parseFloat(Ai.get(`drive`) || `0`);
var debugOptions = {
  nogl: Ai.has(`nogl`),
  nofin: Ai.has(`nofin`),
  noscrub: Ai.has(`noscrub`),
};
var z = null;
var B = 0;
var Pi = 0;
var Fi = 0;
var Ii = 0;
var Li = 0;
var Ri = 0;
var zi = false;
var Bi = 0;
var Vi = {};
function profileStep(e2) {
  if (!ji) return;
  let t2 = performance.now();
  (e2 && (Vi[e2] = (Vi[e2] || 0) + (t2 - Bi)), (Bi = t2));
}
function profileFrame(e2, t2) {
  if (!ji && !Mi) return;
  if (!B) {
    B = e2;
    return;
  }
  let n2 = e2 - B;
  if (((B = e2), Mi)) {
    let e3 = document.documentElement.scrollHeight - innerHeight;
    scrollY < e3 && scrollBy(0, (e3 / (Mi * 1e3)) * n2);
  }
  if (
    ji &&
    (z ||
      ((z = document.createElement(`div`)),
      (z.style.cssText = `position:fixed;top:70px;left:12px;z-index:99;padding:6px 10px;font:700 13px/1.4 monospace;color:var(--debug-fg);background:var(--debug-bg);pointer-events:none;white-space:pre-wrap;max-width:calc(100vw - 24px)`),
      document.body.appendChild(z)),
    (Pi += n2),
    Fi++,
    (Ii = Math.max(Ii, n2)),
    Li < 150 &&
      (Li++, n2 > 31 && n2 < 36 && Ri++, Li === 150 && (zi = Ri / Li > 0.8)),
    Pi >= 500)
  ) {
    let e3 = Object.values(Vi).reduce((e4, t3) => e4 + t3, 0),
      n3 = Object.entries(Vi)
        .sort((e4, t3) => t3[1] - e4[1])
        .slice(0, 5)
        .map(([e4, t3]) => `${e4} ${(t3 / Fi).toFixed(1)}`);
    z.textContent =
      (zi
        ? `LPM? rAF is 30Hz-quantised
`
        : ``) +
      `${Math.round(Fi / (Pi / 1e3))}fps worst ${Ii.toFixed(0)}ms
road ${(t2 * 100).toFixed(1)}%
` +
      n3.join(`  `) +
      `  unacct ${((Pi - e3) / Fi).toFixed(1)}
` +
      mediaStats
        .map((e4) => `${e4.name} ${e4.seq.loaded}/${e4.count}`)
        .join(` `);
    for (let e4 in Vi) delete Vi[e4];
    ((Pi = 0), (Fi = 0), (Ii = 0));
  }
}
var started = false;
function startScenes() {
  window.__pearStopped = false;
  if (started) return;
  document.querySelector("video.foot").src = matchMedia("(max-width:820px)")
    .matches
    ? "/films/mobile/footer-loop.mp4"
    : "/films/footer-loop.mp4";
  window.__pearReview = {
    scrollProgress(sceneProgress) {
      return toScrollProgress(clamp(sceneProgress, 0, 1), innerWidth <= 720);
    },
    seek(progress) {
      window.__releasePearBoot?.();
      const target = clamp(progress, 0, 1) * scrollRange();
      markProgrammaticScroll(target);
      scrollState.target = scrollState.current = target;
      scrollTo(0, target);
    },
    state() {
      return {
        hero: selectedHero.id,
        readout: { ...readout },
        progress: scrollY / scrollRange(),
      };
    },
  };
  window.addEventListener("message", (event) => {
    if (event.origin === location.origin && event.data?.type === "pear:seek")
      window.__pearReview.seek(Number(event.data.progress) || 0);
  });
  ((started = true),
    `scrollRestoration` in history && (history.scrollRestoration = `manual`),
    scrollTo(0, 0),
    (scrollState.target = scrollState.current = 0),
    (document.documentElement.style.overflow = `hidden`));
  let e2 = false,
    t2 = document.querySelector(`.boot-note`),
    n2 = () => {
      e2 ||
        ((e2 = true),
        (document.documentElement.style.overflow = ``),
        t2 && (t2.classList.add(`off`), setTimeout(() => t2.remove(), 800)));
    };
  window.__releasePearBoot = n2;
  if (
    (setTimeout(n2, 4e3),
    installPointer(),
    installNavigation(),
    initOverlay(),
    initFaq(),
    initFlight(),
    initTerms(),
    debugOptions.nofin)
  ) {
    let e3 = document.querySelector(`.fin`);
    e3 && e3.style.setProperty(`display`, `none`, `important`);
  }
  (initWork(), initRail(), initSampledGrid());
  let r2 = selectedHero,
    i2 = document.querySelector(`.src`);
  i2.src = r2.src;
  let a2 = () => (reducedMotion ? 1 : 1.06),
    o2 = (e3, t3) => {
      if (!e3 || !t3) return 0;
      let n3 = innerWidth / innerHeight,
        i3 = e3 / t3;
      if (n3 >= i3) return 0;
      let o3 = r2.pos[innerWidth < 768 ? 0 : innerWidth < 1180 ? 1 : 2];
      return (1 - n3 / i3 / a2()) * (o3 - 0.5);
    },
    s2 = document.querySelector(`.boot`),
    c2 = false,
    l2 = !s2,
    u2 = 0,
    m2 = 0,
    g2 = 0,
    _2 = () => {
      try {
        i2.duration &&
          i2.buffered.length &&
          (u2 = Math.max(
            u2,
            Math.min(
              0.92,
              i2.buffered.end(i2.buffered.length - 1) / i2.duration,
            ),
          ));
      } catch {}
    };
  (i2.addEventListener(`progress`, _2),
    i2.addEventListener(`loadedmetadata`, _2),
    i2.addEventListener(`canplaythrough`, () => {
      u2 = 1;
    }),
    i2.addEventListener(`playing`, () => {
      u2 = 1;
    }));
  let S2 = () => {
      c2 ||
        !s2 ||
        ((c2 = true),
        s2.classList.add(`off`),
        s2.addEventListener(
          `transitionend`,
          () => {
            (s2.remove(), (l2 = true));
          },
          {
            once: true,
          },
        ));
    },
    te2 = (n3) => {
      if (!s2 || c2) return;
      let r3 = g2 ? Math.min(0.1, (n3 - g2) / 1e3) : 0.016;
      ((g2 = n3), (m2 = Math.min(u2, m2 + r3 * 0.55)));
      let i3 = smoothstep(m2);
      if (
        ((s2.style.filter = `blur(${((1 - i3) * 26).toFixed(1)}px) saturate(${(0.62 + 0.38 * i3).toFixed(3)}) brightness(${(0.92 + 0.08 * i3).toFixed(3)})`),
        (s2.style.transform = `scale(${(a2() * (1.06 - 0.06 * i3)).toFixed(4)})`),
        t2 && !e2)
      ) {
        let e3 = Math.round(m2 * 100);
        t2._p !== e3 &&
          ((t2._p = e3), (t2.lastElementChild.textContent = e3 + `%`));
      }
      if (s2.naturalWidth) {
        let e3 = innerHeight * (s2.naturalWidth / s2.naturalHeight),
          t3 = innerWidth - e3;
        if (t3 < -1) {
          let n4 = o2(s2.naturalWidth, s2.naturalHeight),
            r4 = ((t3 / 2 - n4 * e3) / t3) * 100;
          s2.style.objectPosition = `${r4.toFixed(2)}% 50%`;
        } else s2.style.objectPosition = `50% 50%`;
      }
    };
  ((i2.muted = true), i2.setAttribute(`muted`, ``));
  let w2 = () => {
    if (document.hidden || window.__pearStopped) return;
    let e3 = i2.play();
    e3 && e3.catch(() => {});
  };
  (w2(),
    i2.addEventListener(`canplay`, w2),
    i2.addEventListener(`canplay`, n2),
    i2.addEventListener(`playing`, n2),
    addEventListener(`pointerdown`, w2, {
      once: true,
    }));
  let M2 = matchMedia(`(max-width: 820px)`).matches ? `768` : `1440`,
    ge2 = createReel(r2.bridge, M2, MODEL_LENGTH + WORK_LENGTH),
    _e2 = createSequence(
      `/films/plan`,
      121,
      2,
      MODEL_LENGTH + WORK_LENGTH + CODA_LENGTH,
      MODEL_LENGTH + WORK_LENGTH + CODA_LENGTH + TERMS_LENGTH,
    ),
    ve2 = createSequence(
      `/films/coda`,
      89,
      3,
      MODEL_LENGTH + WORK_LENGTH,
      MODEL_LENGTH + WORK_LENGTH + CODA_LENGTH + TERMS_LENGTH,
    ),
    ye2 = createSequence(
      `/films/tree`,
      121,
      2,
      MODEL_LENGTH + WORK_LENGTH + CODA_LENGTH,
      1 - FOOTER_LENGTH - FORM_LENGTH - FLIGHT_LENGTH,
    ),
    {
      gl: P2,
      canvas: Ce2,
      tex: we2,
      u: F2,
      upload: Te2,
      plate: Ee2,
    } = createStageRenderer(r2),
    De2 = document.querySelector(`.stage`),
    I2 = () =>
      Ee2.naturalWidth
        ? (Ee2.naturalHeight * Ce2.clientWidth) /
          (Ee2.naturalWidth * Ce2.clientHeight)
        : 0,
    Oe2 = [`breathe`, `slice`, `halftone`, `displace`, `static`, `ring`],
    ke2 = (new URLSearchParams(location.search).get(`t`) || ``).toLowerCase(),
    Ae2 = Oe2.indexOf(ke2) >= 0 ? Oe2.indexOf(ke2) : Oe2.indexOf(`ring`),
    je2 = [
      `none`,
      `slabs`,
      `halftone`,
      `warp`,
      `tear`,
      `fine`,
      `mosaic`,
      `dither`,
      `shred`,
      `ditherblock`,
    ],
    Me2 = {
      overlap: [0.4, 1],
      after: [0.7, 1],
    },
    Pe2 = document.querySelector(`.ov`),
    Fe2 = document.createElement(`canvas`);
  ((Fe2.width = 8), (Fe2.height = 5));
  let Ie2 = Fe2.getContext(`2d`, {
      willReadFrequently: true,
    }),
    Le2 = false,
    Re2 = 0;
  function ze2(e3) {
    if (!e3) return;
    let t3 = e3.videoWidth || e3.naturalWidth,
      n3 = e3.videoHeight || e3.naturalHeight;
    if (!(!t3 || !n3))
      try {
        innerWidth <= 720
          ? Ie2.drawImage(
              e3,
              t3 * 0.3,
              n3 * 0.15,
              t3 * 0.4,
              n3 * 0.75,
              0,
              0,
              8,
              5,
            )
          : Ie2.drawImage(e3, 0, n3 * 0.18, t3 * 0.58, n3 * 0.68, 0, 0, 8, 5);
        let r3 = Ie2.getImageData(0, 0, 8, 5).data,
          i3 = 0;
        for (let e4 = 0; e4 < r3.length; e4 += 4)
          i3 += 0.299 * r3[e4] + 0.587 * r3[e4 + 1] + 0.114 * r3[e4 + 2];
        let a3 = i3 / (r3.length / 4),
          o3 =
            innerWidth <= 720 ? a3 > (Le2 ? 150 : 185) : a3 > (Le2 ? 132 : 168);
        o3 !== Le2 && ((Le2 = o3), Pe2.classList.toggle(`on-light`, o3));
      } catch {}
  }
  let Be2 = -1,
    Ve2 = null,
    qe2 = null,
    Je2 = null,
    Ye2 = 0,
    Xe2 = innerWidth <= 720 ? 1.5 : 2,
    Ze2 = Xe2,
    Qe2 = 0,
    $e2 = 0,
    et2 = 0,
    tt2 = 0,
    nt2 = 0,
    rt2 = 0,
    it2 = false,
    ot2 = performance.now();
  function R2(t3) {
    if (window.__pearStopped) return;
    if (
      (requestAnimationFrame(R2),
      te2(t3),
      !e2 && scrollState.on && (scrollState.target = scrollState.current = 0),
      scrollState.on)
    ) {
      let e3 = scrollState.current;
      ((scrollState.current +=
        (scrollState.target - scrollState.current) * 0.085),
        Math.abs(scrollState.target - scrollState.current) < 0.08 &&
          (scrollState.current = scrollState.target),
        (scrollState.velocity = scrollState.current - e3),
        scrollState.current !== e3 &&
          (markProgrammaticScroll(scrollState.current),
          scrollTo(0, scrollState.current)));
    } else
      ((scrollState.velocity = scrollY - scrollState.current),
        (scrollState.target = scrollY),
        (scrollState.current +=
          (scrollState.target - scrollState.current) * 0.3),
        Math.abs(scrollState.target - scrollState.current) < 0.5 &&
          (scrollState.current = scrollState.target));
    let c3 = I2(),
      u3 = tt2 ? t3 - tt2 : 16.7;
    ((tt2 = t3),
      innerWidth <= 720 &&
        (u3 > 26 ? (Qe2++, ($e2 = 0)) : ($e2++, (Qe2 = Math.max(0, Qe2 - 1))),
        Qe2 > 150 && Ze2 > 1 && t3 - et2 > 4e3
          ? ((Ze2 = Math.max(1, Ze2 - 0.25)), (Qe2 = 0), (et2 = t3))
          : $e2 > 900 &&
            Ze2 < Xe2 &&
            t3 - et2 > 4e3 &&
            ((Ze2 = Math.min(Xe2, Ze2 + 0.25)), ($e2 = 0), (et2 = t3))));
    let g3 = Math.min(devicePixelRatio || 1, Ze2),
      _3 = 1,
      x2 = Math.round(Ce2.clientWidth * g3),
      C2 = Math.round(Ce2.clientHeight * g3);
    (Ce2.width !== x2 || Ce2.height !== C2) &&
      ((Ce2.width = x2), (Ce2.height = C2), P2.viewport(0, 0, x2, C2));
    let M3 = Math.max(1, De2.offsetHeight - innerHeight),
      Oe3 = (e3) => toSceneProgress(e3, innerWidth <= 720),
      ke3 = Oe3(clamp(scrollState.current / M3, 0, 1));
    (activateSceneLoads(Oe3(clamp(scrollState.target / M3, 0, 1))),
      profileFrame(t3, ke3),
      profileStep(),
      (pointer.x += (pointer.tx - pointer.x) * 0.055),
      (pointer.y += (pointer.ty - pointer.y) * 0.055));
    let Fe3 = clamp(ke3 / MODEL_LENGTH, 0, 1),
      Ie3 = clamp((ke3 - MODEL_LENGTH) / WORK_LENGTH, 0, 1),
      at2 = clamp((ke3 - MODEL_LENGTH - WORK_LENGTH) / CODA_LENGTH, 0, 1),
      ct2 = clamp(
        (ke3 - MODEL_LENGTH - WORK_LENGTH - CODA_LENGTH) / TERMS_LENGTH,
        0,
        1,
      ),
      lt2 = TERMS_LENGTH * 0.25,
      ut2 = clamp(
        (ke3 - MODEL_LENGTH - WORK_LENGTH - CODA_LENGTH - TERMS_LENGTH + lt2) /
          (GRAFT_LENGTH + lt2),
        0,
        1,
      ),
      dt2 = clamp(
        (ke3 -
          (MODEL_LENGTH +
            WORK_LENGTH +
            CODA_LENGTH +
            TERMS_LENGTH +
            GRAFT_LENGTH)) /
          FAQ_LENGTH,
        0,
        1,
      );
    nt2 = smootherstep(clamp(dt2 / 0.85, 0, 1));
    let ft2 = clamp(Fe3 / HERO_RING_END, 0, 1),
      pt2 = clamp((Fe3 - HERO_RING_END) / (REEL_END - HERO_RING_END), 0, 1),
      mt2 = clamp((Fe3 - tear.at) / tear.len, 0, 1),
      ht2 = Ie3;
    ((readout.pan = ht2), (readout.raw = ke3));
    let gt2 = ft2 * ft2 * (3 - 2 * ft2);
    (i2.readyState >= 2 &&
      (gt2 < 0.999
        ? (Te2(0, we2.A, i2),
          P2.uniform2f(F2.uResA, i2.videoWidth, i2.videoHeight),
          i2.paused && w2(),
          n2(),
          m2 > 0.99 && S2())
        : i2.paused || i2.pause()),
      gt2 >= 0.999 && S2());
    let _t2 = Math.round(pt2 * (ge2.N - 1)),
      vt2 = ge2.frameNear(_t2);
    (vt2 &&
      vt2 !== Be2 &&
      ((Be2 = vt2),
      Te2(1, we2.B, vt2),
      P2.uniform2f(F2.uResB, vt2.naturalWidth, vt2.naturalHeight)),
      P2.uniform2f(F2.uRes, x2, C2));
    let bt2 = innerWidth <= 720,
      xt2 = i2.videoWidth
        ? o2(i2.videoWidth, i2.videoHeight)
        : s2 && s2.naturalWidth
          ? o2(s2.naturalWidth, s2.naturalHeight)
          : 0,
      St2 = (e3) => (e3 / 1179) * x2,
      Ct2 = (e3) => (e3 / 2556) * C2,
      wt2 = smoothstep(
        clamp((_t2 + 1 - (BRIDGE_FRAME_ENDS[r2.bridge] || 100)) / 8, 0, 1),
      ),
      Tt2 = 0;
    if (xt2 && i2.videoWidth) {
      let e3 = x2 / C2,
        t4 = i2.videoWidth / i2.videoHeight;
      Tt2 = xt2 * x2 * (t4 / e3);
    }
    (P2.uniform1f(F2.uPanPx, Tt2 + (St2(-20) - Tt2) * wt2),
      P2.uniform1f(F2.uPanY, 0),
      P2.uniform1f(F2.uZoom, a2() + (1 - a2()) * wt2),
      P2.uniform1f(F2.uZoomE, bt2 ? mobileCoda.z : 1),
      P2.uniform1f(F2.uPanE, bt2 ? St2(mobileCoda.x) : 0),
      P2.uniform1f(F2.uPanEY, bt2 ? Ct2(mobileCoda.y) : 0));
    let Et2 = smoothstep(
      clamp(
        (ht2 - mobileScaffold.at) / Math.max(0.05, mobileScaffold.span),
        0,
        1,
      ),
    );
    (P2.uniform3f(
      F2.uPlateFit,
      bt2 ? St2(mobileScaffold.x) * Et2 : 0,
      bt2 ? Ct2(mobileScaffold.y) * Et2 : 0,
      bt2 ? 1 + (mobileScaffold.z - 1) * Et2 : 1,
    ),
      P2.uniform1f(
        F2.uPanG,
        bt2
          ? St2(mobileGraft.x) *
              smoothstep(
                clamp(
                  (graftTime(ut2) - mobileGraft.from) /
                    Math.max(1e-3, mobileGraft.ramp),
                  0,
                  1,
                ),
              )
          : 0,
      ),
      profileStep(`film`),
      renderSampledGrid(
        i2,
        ft2,
        t3,
        xt2,
        a2(),
        l2
          ? null
          : {
              el: s2,
              p: smoothstep(m2),
            },
      ),
      profileStep(`mask`),
      P2.uniform1f(F2.uT, gt2),
      P2.uniform1f(F2.uTime, t3 / 1e3),
      P2.uniform1i(F2.uMode, Ae2));
    let Dt2 = Me2.overlap,
      Ot2 = clamp((gt2 - Dt2[0]) / (Dt2[1] - Dt2[0]), 0, 1);
    P2.uniform1i(F2.uMode2, je2.indexOf(`fine`));
    let kt2 = clamp((mt2 - tear.fxAt) / Math.max(1e-3, tear.fxLen), 0, 1),
      At2 = Math.sin(Math.PI * Ot2),
      jt2 = mt2 > 0 && mt2 < 1 ? Math.sin(Math.PI * kt2) * tear.fx : 0;
    (P2.uniform1f(F2.uT2, Math.max(At2, jt2)),
      P2.uniform1f(F2.uBurn, mt2),
      (tearOrigin.x = tear.x + tear.dx / innerWidth),
      (tearOrigin.y = tear.y + tear.dy / innerHeight),
      P2.uniform1f(F2.uBurnX, tearOrigin.x),
      P2.uniform1f(F2.uBurnY, tearOrigin.y),
      P2.uniform2f(F2.uBurnAB, tear.ax, tear.ay),
      P2.uniform4f(F2.uBurnFld, tear.noise, tear.grain, tear.dither, tear.hash),
      P2.uniform4f(F2.uBurnChr, tear.char, tear.charW, tear.glowW, tear.glowH),
      P2.uniform1f(
        F2.uSplit,
        pushIn.part * smoothstep(clamp(mt2 / pushIn.lag, 0, 1)),
      ),
      P2.uniform2f(F2.uBurnE, tear.e0, tear.e1));
    let Mt2 =
        tear.at +
        overlayExit.over * tear.len -
        overlayExit.len * (1 - inverseSmoothstep(pushIn.at)),
      Nt2 = clamp((Fe3 - Mt2) / Math.max(1e-4, tear.at + tear.len - Mt2), 0, 1),
      Pt2 = Nt2 * (pushIn.lin + (1 - pushIn.lin) * Nt2 * Nt2);
    ((readout.push = Pt2),
      P2.uniform1f(F2.uReelZ, 1 + pushIn.zoom * Pt2),
      P2.uniform2f(F2.uDrift, escape.driftX * Pt2, escape.driftY * Pt2),
      P2.uniform1f(F2.uMBlur, escape.mblur * Pt2),
      P2.uniform1f(F2.uSpin, pushIn.spin * Pt2),
      P2.uniform1f(
        F2.uEdgeBl,
        escape.edgeBl *
          smoothstep(
            clamp(
              (mt2 - escape.edgeAt) / Math.max(0.02, 1 - escape.edgeAt),
              0,
              1,
            ),
          ),
      ),
      P2.uniform1f(
        F2.uSeam,
        tear.seam *
          smoothstep(clamp(mt2 / 0.55, 0, 1)) *
          (1 - smoothstep(clamp((mt2 - 0.55) / 0.4, 0, 1))),
      ),
      P2.uniform2f(F2.uSeamWH, tear.seamW, tear.seamH),
      P2.uniform3f(F2.uSeamCol, 0.898, 0.882, 0.839),
      P2.uniform1f(F2.uSeamSoft, Math.max(2e-3, tear.seamSoft)));
    let Ft2 = tear.at + tear.zoomAt * tear.len,
      It2 = smoothstep(clamp((Fe3 - Ft2) / Math.max(1e-4, 1 - Ft2), 0, 1)),
      Lt2 = 1 + tear.zoom * (1 - smoothstep(mt2)) + tear.zoomPan * It2;
    ((platePosition.x = innerWidth * (818 / 1328)),
      P2.uniform1f(F2.uPlateZ, Lt2),
      P2.uniform1i(F2.uShape, tear.shape | 0));
    let Rt2 = c3 > 0 ? (1 - 1 / c3) * (1 - ht2) : 0;
    if (
      (c3 > 0 && P2.uniform1f(F2.uPan, Rt2),
      profileStep(`uni`),
      at2 <= 0.2 && renderWork(ht2, c3, Rt2, t3, mt2),
      profileStep(`plate`),
      at2 > 0 && rt2 < 0.999)
    ) {
      let e3 = Math.min(88, Math.round(at2 * 88));
      if ((ve2.aim(e3), ve2.ready && !debugOptions.noscrub)) {
        let t4 = ve2.near(e3);
        t4 &&
          t4 !== Ve2 &&
          _3 > 0 &&
          (_3--,
          (Ve2 = t4),
          Te2(3, we2.E, t4),
          P2.uniform2f(F2.uResE, t4.naturalWidth, t4.naturalHeight));
      }
    }
    if (
      ((Ye2 = ve2.ready ? Math.min(1, Ye2 + 0.055) : 0),
      P2.uniform1f(
        F2.uCoda,
        smoothstep(clamp(at2 / CODA_CROSSFADE, 0, 1)) * Ye2,
      ),
      P2.uniform1f(
        F2.uFlat,
        smoothstep(clamp((at2 - PAPER_START) / (1 - PAPER_START), 0, 1)),
      ),
      (readout.coda = at2),
      (readout.end = ct2),
      ct2 > 0 && ke3 < 0.7489719626168224)
    ) {
      let e3 = graftTime(ut2),
        t4 = Math.max(
          0,
          Math.min(120, Math.round(e3 * 120) - Math.round(nt2 * 36)),
        );
      if ((ye2.aim(t4), ye2.ready && !debugOptions.noscrub)) {
        let e4 = ye2.near(t4);
        e4 &&
          e4 !== qe2 &&
          _3 > 0 &&
          (_3--,
          (qe2 = e4),
          Te2(4, we2.G, e4),
          P2.uniform2f(F2.uResG, e4.naturalWidth, e4.naturalHeight));
      }
    }
    (profileStep(`tex`),
      (rt2 = renderTerms(ut2, ct2, t3)),
      profileStep(`fin`),
      (paperLighting.lit = at2 > 0.44 && rt2 < 0.55),
      P2.uniform3f(F2.uPaperC, paper.r / 255, paper.g / 255, paper.b / 255),
      P2.uniform4f(
        F2.uRay1,
        paper.speed,
        paper.drift,
        paper.jiggle,
        paper.scale,
      ),
      P2.uniform4f(
        F2.uRay2,
        paper.depth,
        paper.breathe,
        paper.rake,
        paper.cycle,
      ),
      P2.uniform4f(F2.uPap, paper.pulp, paper.fibre, paper.tooth, paper.fleck),
      P2.uniform3f(F2.uDrag, paper.lag, paper.lagD, paper.smear));
    let zt2 = clamp(
      (ke3 - (MODEL_LENGTH + WORK_LENGTH + CODA_LENGTH)) / PLAN_DURATION,
      0,
      1,
    );
    if (((readout.plan = zt2), ke3 > 0.3725233644859813 && rt2 < 0.999)) {
      let e3 = clamp(
          (ke3 - (MODEL_LENGTH + WORK_LENGTH + CODA_LENGTH)) /
            (PLAN_DURATION * PLAN_PLAYBACK),
          0,
          1,
        ),
        t4 = Math.min(120, Math.round(e3 * 120));
      if ((_e2.aim(t4), _e2.ready && !debugOptions.noscrub)) {
        let e4 = _e2.near(t4);
        e4 &&
          e4 !== Je2 &&
          _3 > 0 &&
          (_3--,
          (Je2 = e4),
          Te2(5, we2.P, e4),
          P2.uniform2f(F2.uResP, e4.naturalWidth, e4.naturalHeight));
      }
    }
    (P2.uniform4f(
      F2.uPlan2,
      Je2 ? smoothstep(clamp(zt2 / PLAN_REVEAL, 0, 1)) : 0,
      0,
      0,
      0,
    ),
      P2.uniform4f(F2.uPlan3, paper.zoom, paper.panX, paper.panY, 0),
      P2.uniform4f(
        F2.uPlan,
        smoothstep(clamp((zt2 - PLAN_RETREAT[0]) / PLAN_RETREAT[1], 0, 1)),
        bt2 ? mobilePlan.x : paper.keyX,
        bt2 ? mobilePlan.y : paper.keyY,
        bt2 ? mobilePlan.s : paper.keyS,
      ),
      renderFaq(dt2),
      profileStep(`faq`));
    let Bt2 = exitFaq(dt2),
      Vt2 = clamp(
        (ke3 -
          (MODEL_LENGTH +
            WORK_LENGTH +
            CODA_LENGTH +
            TERMS_LENGTH +
            GRAFT_LENGTH +
            FAQ_LENGTH)) /
          FLIGHT_LENGTH,
        0,
        1,
      );
    (renderFlight(Vt2),
      renderForm(
        clamp(
          (ke3 -
            (MODEL_LENGTH +
              WORK_LENGTH +
              CODA_LENGTH +
              TERMS_LENGTH +
              GRAFT_LENGTH +
              FAQ_LENGTH +
              FLIGHT_LENGTH)) /
            FORM_LENGTH,
          0,
          1,
        ),
        Vt2,
      ),
      renderFooter(
        clamp(
          (ke3 -
            (MODEL_LENGTH +
              WORK_LENGTH +
              CODA_LENGTH +
              TERMS_LENGTH +
              GRAFT_LENGTH +
              FAQ_LENGTH +
              FLIGHT_LENGTH +
              FORM_LENGTH)) /
            FOOTER_LENGTH,
          0,
          1,
        ),
      ),
      renderSignature(ut2, Bt2),
      profileStep(`sky`),
      P2.uniform1f(F2.uEnd, qe2 ? (rt2 >= 0.94 ? 1 : rt2) : 0),
      P2.uniform1f(
        F2.uScrim,
        0.18 * smoothstep(clamp((Fe3 - 0.26) / 0.08, 0, 1)),
      ),
      P2.uniform4f(
        F2.uEndF,
        closingBurn.noise,
        closingBurn.grain,
        closingBurn.dither,
        closingBurn.hash,
      ),
      P2.uniform4f(
        F2.uEndC,
        closingBurn.charW,
        closingBurn.charBack,
        closingBurn.char,
        closingBurn.glowW,
      ),
      exitWork(at2),
      !debugOptions.nogl && Vt2 <= 0.06 && P2.drawArrays(P2.TRIANGLES, 0, 3),
      profileStep(`gl`),
      !it2 &&
        (scrollState.current > 6 || t3 - ot2 > 620) &&
        ((it2 = true), startEntrance(t3, 425)),
      renderOverlay(Fe3, t3),
      renderRail(ke3),
      profileStep(`ov`),
      t3 - Re2 > 160 &&
        ((Re2 = t3),
        paperLighting.lit
          ? Pe2.classList.contains(`on-light`) ||
            ((Le2 = true), Pe2.classList.add(`on-light`))
          : ze2(
              mt2 > 0.5
                ? Ee2.naturalWidth
                  ? Ee2
                  : null
                : gt2 < 0.5
                  ? i2.readyState >= 2
                    ? i2
                    : null
                  : vt2,
            )));
  }
  requestAnimationFrame(R2);
}
export { startScenes };
