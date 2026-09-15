export const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
export const CHECKPOINTS = [
  ["hero", 0, "首屏"],
  ["ring", 0.0045, "首屏进入场景的环形转场"],
  ["grafting", 0.035, "嫁接"],
  ["fruit", 0.095, "结果与采摘"],
  ["cut", 0.16, "切开的梨"],
  ["tear", 0.191, "撕裂与推近"],
  ["work-entry", 0.235, "搭建场景进入"],
  ["work-mid", 0.28, "长图平移与服务说明"],
  ["work-end", 0.327, "长图结束"],
  ["coda", 0.35, "递出图纸"],
  ["plan-in", 0.409, "平面图与纸张"],
  ["terms-one", 0.475, "合作条款"],
  ["terms-two", 0.535, "适合的合作伙伴"],
  ["tree", 0.59, "树与果实"],
  ...[0, 1, 2, 3, 4].map((i) => [
    "faq-" + (i + 1),
    (3300 + 600 * (0.187 + 0.16575 * i)) / 5350,
    "问答 " + (i + 1),
  ]),
  ["flight", 0.775, "穿越树冠与天空"],
  ["application", 0.84, "悬浮申请表单"],
  ["footer-transition", 0.94, "页脚转场"],
  ["footer", 1, "页脚"],
].map(([id, progress, label]) => ({ id, progress, label }));
export async function installCaptureClock(page) {
  await page.addInitScript(() => {
    const raf = requestAnimationFrame.bind(window),
      now = performance.now.bind(performance),
      play = HTMLMediaElement.prototype.play;
    window.__captureImages = [];
    const NativeImage = window.Image;
    window.Image = function (...args) {
      const image = new NativeImage(...args);
      window.__captureImages.push(image);
      return image;
    };
    window.Image.prototype = NativeImage.prototype;
    window.requestAnimationFrame = (callback) =>
      raf((time) => callback(window.__captureTime ?? time));
    Object.defineProperty(performance, "now", {
      value: () => window.__captureTime ?? now(),
    });
    HTMLMediaElement.prototype.play = function () {
      if (window.__captureTime !== undefined) {
        this.pause();
        return Promise.resolve();
      }
      return play.call(this);
    };
  });
}
export async function prepare(page, url) {
  page.setDefaultTimeout(30000);
  await installCaptureClock(page);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => !!window.__READOUT && !document.querySelector(".boot"),
    null,
    { timeout: 90000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);
}
export async function seekAndFreeze(page, progress) {
  await page.evaluate((p) => {
    delete window.__captureTime;
    const target = p * (document.documentElement.scrollHeight - innerHeight);
    if (window.__pearReview) window.__pearReview.seek(p);
    else scrollTo(0, target);
  }, progress);
  await page.waitForFunction(
    (p) =>
      Math.abs(
        scrollY - p * (document.documentElement.scrollHeight - innerHeight),
      ) < 2,
    progress,
  );
  await page.waitForTimeout(1600);
  await page.evaluate(async () => {
    window.__captureTime = 600000;
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = 600000;
    }
    for (const video of document.querySelectorAll("video"))
      if (video.readyState >= 2) {
        video.pause();
        if (video.currentTime === 0 && !video.seeking) continue;
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 2000);
          video.addEventListener(
            "seeked",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
          video.currentTime = 0;
        });
      }
  });
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const visible = (e) => {
      for (let n = e; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (
          s.display === "none" ||
          s.visibility === "hidden" ||
          +s.opacity < 0.08
        )
          return false;
      }
      return true;
    };
    const geometry = {};
    for (const selector of [
      "h1",
      ".cta",
      ".col-stand .stand",
      ".pf-h",
      ".pf-b",
      ".fin-h",
      ".fin-l",
      ".fq h3",
      ".fq p",
      ".cf-f",
      ".cf-cta",
      ".ft-mark",
      ".ft-tag",
    ])
      geometry[selector] = [...document.querySelectorAll(selector)]
        .filter(visible)
        .map((e) => ({
          text: (e.matches(".cf-f")
            ? e.querySelector("input,textarea")?.getAttribute("placeholder") ||
              ""
            : e.textContent
          )
            .trim()
            .replace(/\s+/g, " "),
          ...e.getBoundingClientRect().toJSON(),
        }));
    return {
      progress: scrollY / (document.documentElement.scrollHeight - innerHeight),
      sceneProgress: window.__READOUT?.raw,
      readout: window.__READOUT,
      geometry,
      videoTimes: [...document.querySelectorAll("video")]
        .filter((v) => v.readyState >= 2)
        .map((v) => ({
          src: v.currentSrc,
          time: v.currentTime,
          width: v.videoWidth,
          height: v.videoHeight,
        })),
      images: {
        created: window.__captureImages.length,
        loaded: window.__captureImages.filter(
          (i) => i.complete && i.naturalWidth,
        ).length,
      },
    };
  });
}
