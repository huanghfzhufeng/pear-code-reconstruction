import { Terms, Work, Menu, Application, FaqShell } from "./collections.js";
import { CONTENT } from "../data/site.js";
/**
 * Pear scene reconstruction, adapted from the live reference captured 2026-09-15.
 * Original visual direction and mathematical treatments: Pear AS.
 * This editable source is an internal technical study; no captured runtime is shipped.
 * Reference SHA and modifications are recorded in docs/IMPLEMENTATION.md.
 */
import { markup } from "./html.js";
import { FAQ_DATA } from "../data/faq.js";
const hero = {
  poster: "/films/signal-poster.jpg",
};
function SceneSurfaces() {
  return (0, markup.jsxs)(markup.Fragment, {
    children: [
      (0, markup.jsx)(`div`, {
        className: `nvs`,
        "aria-hidden": `true`,
      }),
      (0, markup.jsx)(`canvas`, {
        className: `gl`,
      }),
      (0, markup.jsx)(`img`, {
        className: `boot`,
        src: hero.poster,
        fetchPriority: `high`,
        alt: ``,
        "aria-hidden": `true`,
      }),
      (0, markup.jsxs)(`p`, {
        className: `boot-note`,
        "aria-hidden": `true`,
        children: [`The film is loading`, (0, markup.jsx)(`b`, {})],
      }),
      (0, markup.jsx)(`svg`, {
        className: `inkdef`,
        "aria-hidden": `true`,
        children: (0, markup.jsxs)(`defs`, {
          children: [
            (0, markup.jsxs)(`filter`, {
              id: `inkf`,
              x: `-18%`,
              y: `-30%`,
              width: `136%`,
              height: `160%`,
              colorInterpolationFilters: `sRGB`,
              children: [
                (0, markup.jsx)(`feTurbulence`, {
                  type: `fractalNoise`,
                  baseFrequency: `0.011 0.017`,
                  numOctaves: `4`,
                  seed: `9`,
                  result: `cl`,
                }),
                (0, markup.jsx)(`feColorMatrix`, {
                  in: `cl`,
                  type: `matrix`,
                  result: `clA`,
                  values: `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0`,
                }),
                (0, markup.jsx)(`feComponentTransfer`, {
                  in: `clA`,
                  result: `m`,
                  children: (0, markup.jsx)(`feFuncA`, {
                    type: `linear`,
                    slope: `9`,
                    intercept: `1`,
                  }),
                }),
                (0, markup.jsx)(`feDisplacementMap`, {
                  in: `SourceGraphic`,
                  in2: `cl`,
                  scale: `0`,
                  xChannelSelector: `R`,
                  yChannelSelector: `G`,
                  result: `warp`,
                }),
                (0, markup.jsx)(`feComposite`, {
                  in: `warp`,
                  in2: `m`,
                  operator: `in`,
                }),
              ],
            }),
            (0, markup.jsxs)(`filter`, {
              id: `fqTear`,
              x: `-30%`,
              y: `-30%`,
              width: `160%`,
              height: `160%`,
              colorInterpolationFilters: `sRGB`,
              children: [
                (0, markup.jsx)(`feTurbulence`, {
                  type: `fractalNoise`,
                  baseFrequency: `0.016 0.021`,
                  numOctaves: `3`,
                  seed: `11`,
                  result: `t1`,
                }),
                (0, markup.jsx)(`feDisplacementMap`, {
                  in: `SourceGraphic`,
                  in2: `t1`,
                  scale: `23`,
                  xChannelSelector: `R`,
                  yChannelSelector: `G`,
                  result: `d1`,
                }),
                (0, markup.jsx)(`feTurbulence`, {
                  type: `fractalNoise`,
                  baseFrequency: `0.075`,
                  numOctaves: `2`,
                  seed: `4`,
                  result: `t2`,
                }),
                (0, markup.jsx)(`feDisplacementMap`, {
                  in: `d1`,
                  in2: `t2`,
                  scale: `7`,
                  xChannelSelector: `R`,
                  yChannelSelector: `G`,
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
var Ji = {
    s: `m 0,0 c 0.8998,-1.65154,2.121,-3.29839,3.3735,-5.1263,-0.2787,0.96871,-1.1734,1.00844,-0.2198,5.15939,0.4113,1.79038,-0.5215,6.68874,-4.6089,3.67108,3.1181,2.66904,5.8064,0.17923,8.4005,-3.43958`,
    i: `m 0,0 c 0,0,-4.8682,5.76765,-2.7782,7.34219,1.5603,1.17547,4.6964,-3.50573,4.6964,-3.50573`,
    dot: `m 0,0 c 0.3633,-0.0304,0.4348,-0.30446,0.3157,-0.57296,-0.1562,-0.35196,-0.6165,-0.38945,-0.7951,-0.0117,-0.1647,0.34829,0.089,0.6173,0.4794,0.58463 z`,
    g1: `m 0,0 c 0.1355,-1.79073,-5.8898,-2.14856,-7.9513,2.05798,-3.8317,7.81871,4.153,5.14364,5.5971,2.69243`,
    g2: `m 0,0 c -1.1619,-0.25254,-8.6588,20.79796,-12.722,19.17658,-1.5259,-0.60889,-0.7548,-2.64348,0.2135,-4.07912,1.7572,-2.60534,12.9435,-8.17985,14.3794,-11.26214`,
    n: `m 0,0 c 0,0,2.639,-5.27928,3.8696,-4.26641,2.2794,1.87613,-3.6711,8.89662,-3.6711,8.89662,0.8673,0.0578,5.7877,-10.21518,8.8635,-8.23516,2.4603,1.58379,-4.2138,6.92561,-1.6867,8.40053,2.1168,1.23542,5.2255,-4.76251,5.2255,-4.76251`,
  },
  Yi = [
    {
      d: Ji.s,
      tf: `translate(1.455 -5.254)`,
      a: 0,
      b: 0.1027,
    },
    {
      d: Ji.i,
      tf: `translate(11.699 -8.694)`,
      a: 0.1027,
      b: 0.1526,
    },
    {
      d: Ji.dot,
      tf: `translate(13.564 -10.621)`,
      a: 0.1526,
      b: 0.1619,
    },
    {
      d: Ji.g1,
      tf: `translate(23.476 -7.671)`,
      a: 0.1619,
      b: 0.2361,
    },
    {
      d: Ji.g2,
      tf: `translate(24.318 -8.84)`,
      a: 0.2361,
      b: 0.3945,
    },
    {
      d: Ji.n,
      tf: `translate(26.188 -5.089)`,
      a: 0.3945,
      b: 0.5514,
    },
    {
      d: Ji.i,
      tf: `translate(42.087 -8.694)`,
      a: 0.5514,
      b: 0.6012,
    },
    {
      d: Ji.dot,
      tf: `translate(43.953 -10.621)`,
      a: 0.6012,
      b: 0.6106,
    },
    {
      d: Ji.n,
      tf: `translate(44.321 -5.089)`,
      a: 0.6106,
      b: 0.7674,
    },
    {
      d: Ji.g1,
      tf: `translate(66.465 -7.671)`,
      a: 0.7674,
      b: 0.8415,
    },
    {
      d: Ji.g2,
      tf: `translate(67.307 -8.84)`,
      a: 0.8415,
      b: 1,
    },
  ];
function Signature() {
  return (0, markup.jsx)(`div`, {
    className: `sign`,
    "aria-hidden": `true`,
    children: (0, markup.jsxs)(`p`, {
      children: [
        (0, markup.jsxs)(`span`, {
          className: `sg-a`,
          children: [`Asked before`, ` `],
        }),
        (0, markup.jsx)(`span`, {
          className: `sg-b`,
          children: (0, markup.jsx)(`svg`, {
            className: `sg-svg`,
            viewBox: `-0.900 -12.374 70.978 23.698`,
            fill: `none`,
            xmlns: `http://www.w3.org/2000/svg`,
            "aria-hidden": `true`,
            children: Yi.map((e2, t2) =>
              (0, markup.jsx)(
                `path`,
                {
                  d: e2.d,
                  transform: e2.tf,
                  "data-a": e2.a.toFixed(4),
                  "data-b": e2.b.toFixed(4),
                },
                t2,
              ),
            ),
          }),
        }),
      ],
    }),
  });
}
var Zi = JSON.stringify({
  "@context": `https://schema.org`,
  "@type": `FAQPage`,
  mainEntity: FAQ_DATA.map(([e2, , t2]) => ({
    "@type": `Question`,
    name: e2,
    acceptedAnswer: {
      "@type": `Answer`,
      text: t2,
    },
  })),
});
function FlightSurfaces() {
  return (0, markup.jsxs)(markup.Fragment, {
    children: [
      (0, markup.jsx)(`canvas`, {
        className: `fly`,
        "aria-hidden": `true`,
      }),
      (0, markup.jsx)(`div`, {
        className: `fly-w`,
        "aria-hidden": `true`,
      }),
    ],
  });
}
var ea = `M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z`,
  ta = () =>
    (0, markup.jsx)(`svg`, {
      viewBox: `0 0 24 24`,
      "aria-hidden": `true`,
      children: (0, markup.jsx)(`path`, {
        d: ea,
      }),
    }),
  na = ({ vertical: e2, right: t2, out: n2, style: r2, delay: i2 }) =>
    (0, markup.jsxs)(`span`, {
      className: e2 ? (t2 ? `gv gv--r` : `gv`) : `gh`,
      "data-out": n2,
      style: r2,
      children: [
        (0, markup.jsx)(`i`, {
          style: {
            animationDelay: i2,
          },
        }),
        (0, markup.jsx)(`svg`, {
          className: `wob`,
          "aria-hidden": `true`,
          children: (0, markup.jsx)(`path`, {}),
        }),
      ],
    }),
  ra = ({ lock: e2, out: t2, style: n2, delay: r2 }) =>
    (0, markup.jsx)(`i`, {
      className: e2 ? `gx gx--lock` : `gx`,
      "data-out": t2,
      style: n2,
      children: (0, markup.jsx)(`span`, {
        style: r2
          ? {
              animationDelay: r2,
            }
          : void 0,
        children: (0, markup.jsx)(`svg`, {
          viewBox: `0 0 24 24`,
          "aria-hidden": `true`,
          children: (0, markup.jsx)(`path`, {
            d: ea,
          }),
        }),
      }),
    }),
  ia = [
    `M496.175 94.1679C513.597 91.6249 528.131 103.956 523.257 122.14C516.926 145.755 476.449 142.036 479.235 112.85C480.058 104.173 487.515 95.4202 496.175 94.1679Z`,
    `M35.0131 19.7672C35.0004 20.0614 33.3707 20.8803 35.3314 20.7267C53.4873 -3.95308 89.1624 -5.01499 111.698 14.3425C145.502 43.3723 142.115 108.059 103.066 131.012C81.3831 143.768 50.0878 141.119 35.3187 119.228C33.3707 119.075 35.0004 119.919 35.0004 120.188V180H0V4.0944H35.0131C34.8348 9.3016 35.255 14.56 35.0131 19.7672ZM62.8962 32.4333C24.6237 36.553 23.8726 103.991 64.7042 107.01C111.915 110.503 112.004 27.1494 62.8962 32.4333Z`,
    `M177.005 80.3756C178.859 92.877 188.675 105.009 201.133 108.121C217.896 112.305 234.342 106.182 241.491 89.9175C244.717 91.7289 269.849 102.151 269.658 104.179C269.519 105.608 262.598 115.66 261.163 117.37C243.739 138.086 212.537 143.903 187.329 136.033C134.246 119.449 128.062 39.5927 173.017 10.3291C195.736 -4.46853 233.453 -3.75416 253.861 14.9853C271.525 31.1989 274.827 57.5285 272.897 80.3756H177.005ZM178.275 55.5002H240.818C241.428 55.0155 241.555 54.9644 241.53 54.1863C241.479 52.7448 239.46 47.6804 238.71 46.1369C225.719 19.7307 183.189 26.951 178.275 55.5002Z`,
    `M453.603 135.341H418.645V4.69977H453.603C453.502 9.04598 453.743 13.4304 453.629 17.7894C453.616 18.312 452.141 24.6082 454.226 22.5434C454.328 22.4542 454.671 20.8228 455.218 20.0453C460.112 13.15 470.345 4.0625 479.333 4.0625H490.774L491.727 5.01841V35.6076L490.774 36.5635H475.519C465.197 36.5635 453.591 52.1639 453.591 61.7358V135.341H453.603Z`,
    `M403.76 134.164C402.782 137.224 390.593 136.776 387.815 136.483C363.711 133.871 355.025 102.33 345.203 84.2014C320.258 85.7219 309.87 111.473 315.172 133.676H285.492L284.181 132.078C278.86 99.5624 298.307 65.8774 330.765 57.7875C325.13 39.444 314.741 23.5567 292.79 31.5101C295.431 24.122 295.137 10.5739 297.857 4.00458C299.931 -1.00528 318.576 1.23649 323.173 2.60104C334.795 6.07091 342.914 16.6365 348.784 26.6367C361.129 47.7483 369.757 72.5442 381.652 94.0067C386.465 102.701 390.671 110.264 402.351 106.678L403.76 107.906V134.183V134.164Z`,
  ];
function Footer() {
  return (0, markup.jsxs)(markup.Fragment, {
    children: [
      (0, markup.jsx)(`div`, {
        className: `ft`,
        "aria-hidden": `true`,
        children: (0, markup.jsxs)(`div`, {
          className: `ft-in`,
          children: [
            (0, markup.jsx)(`i`, {
              className: `ft-r h`,
              style: {
                top: 125,
              },
            }),
            (0, markup.jsx)(`i`, {
              className: `ft-r h`,
              style: {
                top: 982,
              },
            }),
            (0, markup.jsx)(`i`, {
              className: `ft-r v`,
              style: {
                left: 675,
              },
            }),
            (0, markup.jsx)(`i`, {
              className: `ft-r v`,
              style: {
                left: 1262,
              },
            }),
            (0, markup.jsx)(`svg`, {
              className: `ft-box`,
              viewBox: `0 0 587 857`,
              fill: `none`,
              children: (0, markup.jsx)(`rect`, {
                x: `0.5`,
                y: `0.5`,
                width: `586`,
                height: `856`,
              }),
            }),
            (0, markup.jsx)(`i`, {
              className: `ft-st`,
              style: {
                left: 675,
                top: 125,
              },
              children: (0, markup.jsx)(ta, {}),
            }),
            (0, markup.jsx)(`i`, {
              className: `ft-st`,
              style: {
                left: 1262,
                top: 982,
              },
              children: (0, markup.jsx)(ta, {}),
            }),
            (0, markup.jsx)(`div`, {
              className: `ft-mark`,
              children: (0, markup.jsx)(`svg`, {
                viewBox: `0 0 524.211 180`,
                fill: `none`,
                xmlns: `http://www.w3.org/2000/svg`,
                children: (0, markup.jsx)(`g`, {
                  children: ia.map((e2, t2) =>
                    (0, markup.jsx)(
                      `path`,
                      {
                        d: e2,
                        fill: `var(--footer-mark)`,
                      },
                      t2,
                    ),
                  ),
                }),
              }),
            }),
            (0, markup.jsxs)(`p`, {
              className: `ft-tag`,
              children: [
                (0, markup.jsx)(`span`, {
                  className: `ln`,
                  children: (0, markup.jsx)(`i`, {
                    children: CONTENT.footer.lines[0],
                  }),
                }),
                (0, markup.jsx)(`span`, {
                  className: `ln`,
                  children: (0, markup.jsx)(`i`, {
                    children: CONTENT.footer.lines[1],
                  }),
                }),
              ],
            }),
            (0, markup.jsx)(`p`, {
              className: `ft-meta l`,
              children: CONTENT.footer.company,
            }),
            (0, markup.jsx)(`p`, {
              className: `ft-meta r`,
              children: (0, markup.jsx)(`a`, {
                href: `mailto:info@pear.no`,
                children: CONTENT.footer.email,
              }),
            }),
          ],
        }),
      }),
      (0, markup.jsx)(`canvas`, {
        className: `trans`,
        "aria-hidden": `true`,
      }),
      (0, markup.jsx)(`video`, {
        className: `foot`,
        src: `/films/footer-loop.mp4`,
        muted: true,
        loop: true,
        playsInline: true,
        preload: `none`,
      }),
      (0, markup.jsx)(`canvas`, {
        className: `ftx`,
        "aria-hidden": `true`,
      }),
    ],
  });
}
var ua = `M153.19 22.53C168.21 23.03 182.32 28.8 193.13 38.92C202.3 47.51 208.57 58.46 211.23 70.6C220.52 112.92 237.69 155.75 262.27 197.92C273.65 217.44 279.66 239.79 279.66 262.54C279.66 296.89 266.29 329.18 242.01 353.46C217.73 377.74 185.45 391.11 151.13 391.12L149.08 391.11C80.4 390.15 23.57 333.39 22.51 264.58C22.14 240.37 28.5 216.71 40.91 196.17C63.74 158.4 80.6 116 91.02 70.15C93.73 58.21 99.95 47.41 109.01 38.92C120.33 28.33 135.27 22.5 151.08 22.5C151.79 22.5 152.49 22.51 153.19 22.53Z`;
function Overlay() {
  return (0, markup.jsxs)(`div`, {
    className: `ov`,
    children: [
      (0, markup.jsx)(na, {
        vertical: true,
        out: `l`,
        style: {
          left: `var(--v1)`,
        },
        delay: `.20s`,
      }),
      (0, markup.jsx)(na, {
        vertical: true,
        right: true,
        out: `r`,
        style: {
          left: `var(--v2)`,
        },
        delay: `.30s`,
      }),
      (0, markup.jsx)(na, {
        out: `u`,
        style: {
          top: `var(--h1)`,
        },
        delay: `.25s`,
      }),
      (0, markup.jsx)(na, {
        out: `d`,
        style: {
          top: `var(--h2)`,
        },
        delay: `.40s`,
      }),
      (0, markup.jsx)(`span`, {
        className: `fill`,
        "data-out": `d`,
        "aria-hidden": `true`,
      }),
      (0, markup.jsx)(ra, {
        out: `ld`,
        style: {
          left: `var(--v1)`,
          top: `var(--h2)`,
        },
        delay: `1.05s`,
      }),
      (0, markup.jsx)(ra, {
        out: `rd`,
        style: {
          left: `var(--v2)`,
          top: `var(--h2)`,
        },
        delay: `1.18s`,
      }),
      (0, markup.jsx)(ra, {
        lock: true,
        out: `lu`,
        style: {
          left: `var(--v1)`,
          top: `var(--h1)`,
        },
      }),
      (0, markup.jsx)(ra, {
        lock: true,
        out: `ru`,
        style: {
          left: `var(--v2)`,
          top: `var(--h1)`,
        },
      }),
      (0, markup.jsx)(`canvas`, {
        className: `lines`,
        "aria-hidden": `true`,
      }),
      (0, markup.jsx)(`a`, {
        className: `mark`,
        href: `#top`,
        "aria-label": `Pear`,
        children: (0, markup.jsx)(`svg`, {
          viewBox: `0 0 305 415`,
          fill: `none`,
          xmlns: `http://www.w3.org/2000/svg`,
          "aria-hidden": `true`,
          children: (0, markup.jsx)(`path`, {
            pathLength: `1`,
            d: ua,
            strokeWidth: `40`,
            strokeMiterlimit: `10`,
            strokeLinecap: `round`,
          }),
        }),
      }),
      (0, markup.jsxs)(`button`, {
        className: `menu`,
        type: `button`,
        "aria-label": `Menu`,
        children: [
          (0, markup.jsx)(`span`, {}),
          (0, markup.jsx)(`span`, {}),
          (0, markup.jsx)(`span`, {}),
          (0, markup.jsx)(`span`, {}),
        ],
      }),
      (0, markup.jsx)(`nav`, {
        className: `hdr label`,
        children: (0, markup.jsxs)(`a`, {
          className: `apply`,
          href: `#top`,
          children: [
            `Apply `,
            (0, markup.jsx)(`span`, {
              className: `arw`,
              children: `\u2192`,
            }),
          ],
        }),
      }),
      (0, markup.jsxs)(`nav`, {
        className: `rail`,
        "aria-label": `Chapters`,
        children: CONTENT.chapters.map((chapter) =>
          markup.jsx("a", {
            href: "#" + chapter.id,
            "data-at": chapter.at.toFixed(3),
            children: [
              markup.jsx("i", {}),
              markup.jsx("em", {
                children: chapter.label,
              }),
            ],
          }),
        ),
      }),
      (0, markup.jsxs)(`div`, {
        className: `col-head`,
        children: [
          (0, markup.jsxs)(`div`, {
            className: `bk`,
            "data-beat": `0`,
            children: [
              (0, markup.jsx)(`h1`, {
                children: (0, markup.jsx)(`span`, {
                  className: `ln`,
                  children: (0, markup.jsx)(`i`, {
                    children: CONTENT.hero.title,
                  }),
                }),
              }),
              (0, markup.jsxs)(`p`, {
                className: `subhead`,
                children: CONTENT.hero.subtitle.map((text) =>
                  markup.jsx("span", {
                    className: "ln",
                    children: markup.jsx("i", {
                      children: text,
                    }),
                  }),
                ),
              }),
              (0, markup.jsxs)(`a`, {
                className: `cta`,
                href: `#top`,
                children: [
                  (0, markup.jsxs)(`span`, {
                    className: `face`,
                    children: [
                      CONTENT.hero.cta + " ",
                      (0, markup.jsx)(`span`, {
                        className: `arw`,
                        children: `\u2192`,
                      }),
                    ],
                  }),
                  (0, markup.jsx)(`span`, {
                    className: `flood`,
                    "aria-hidden": `true`,
                    children: (0, markup.jsxs)(`span`, {
                      className: `face`,
                      children: [
                        CONTENT.hero.cta + " ",
                        (0, markup.jsx)(`span`, {
                          className: `arw`,
                          children: `\u2192`,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          ...CONTENT.beats.map((beat, index) =>
            markup.jsx("div", {
              className: "bk",
              "data-beat": String(index + 1),
              children: markup.jsx("div", {
                className: "beat",
                children: beat.titleLines.map((text) =>
                  markup.jsx("span", {
                    className: "ln",
                    children: markup.jsx("i", {
                      children: text,
                    }),
                  }),
                ),
              }),
            }),
          ),
        ],
      }),
      (0, markup.jsxs)(`div`, {
        className: `col-stand`,
        children: [
          CONTENT.hero.intro,
          ...CONTENT.beats.map((beat) => beat.description),
        ].map((text, index) =>
          markup.jsx("div", {
            className: "bk",
            "data-beat": String(index),
            children: markup.jsx("p", {
              className: "stand",
              children: text,
            }),
          }),
        ),
      }),
      (0, markup.jsx)(`span`, {
        className: `tag`,
        children: CONTENT.beatLabels[0],
      }),
    ],
  });
}
function Scene() {
  return (
    0,
    (0, markup.jsxs)(`main`, {
      id: `top`,
      children: [
        (0, markup.jsx)(`section`, {
          className: `stage`,
          children: (0, markup.jsxs)(`div`, {
            className: `pin`,
            children: [
              (0, markup.jsx)(SceneSurfaces, {}),
              (0, markup.jsx)(Signature, {}),
              (0, markup.jsx)(FaqShell, {}),
              (0, markup.jsx)(FlightSurfaces, {}),
              (0, markup.jsx)(Footer, {}),
              (0, markup.jsx)(Application, {}),
              (0, markup.jsx)(Terms, {}),
              (0, markup.jsx)(Work, {}),
              (0, markup.jsx)(Menu, {}),
              (0, markup.jsx)(Overlay, {}),
            ],
          }),
        }),
        (0, markup.jsx)(`video`, {
          className: `src`,
          muted: true,
          loop: true,
          playsInline: true,
          preload: `auto`,
          autoPlay: true,
          "aria-hidden": `true`,
        }),
      ],
    })
  );
}
function renderScene() {
  return (0, markup.jsx)(Scene, {});
}
export { renderScene };
