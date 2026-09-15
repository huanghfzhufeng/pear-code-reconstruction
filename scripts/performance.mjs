import { chromium } from "playwright-core";
import { writeFile, readFile } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const report = {
  measuredAt: new Date().toISOString(),
  environment:
    "Local preview, Chrome, one active test page, DPR 1. Not a public-network Core Web Vitals claim.",
  viewports: [],
};
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__metrics = { lcp: null, cls: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__metrics.lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            if (!e.hadRecentInput) window.__metrics.cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}
    });
    await page.goto("http://127.0.0.1:4187/?hero=signal");
    await page.waitForFunction(
      () => window.__READOUT && !document.querySelector(".boot"),
    );
    const first = await page.evaluate(() => ({
      ...window.__metrics,
      transferBytes: performance
        .getEntriesByType("resource")
        .reduce((s, r) => s + r.transferSize, 0),
      fonts: performance
        .getEntriesByType("resource")
        .filter((r) => /\.woff2?/.test(r.name)).length,
      frameRequests: performance
        .getEntriesByType("resource")
        .filter((r) => /f_\d+\.webp/.test(r.name)).length,
    }));
    const scenes = [];
    for (const [label, p] of [
      ["hero", 0],
      ["tear", 0.191],
      ["paper", 0.475],
      ["faq", 0.675],
      ["form", 0.84],
    ]) {
      await page.evaluate(
        (p) => window.__pearReview.seek(window.__pearReview.scrollProgress(p)),
        p,
      );
      await page.waitForTimeout(600);
      const cadence = await page.evaluate(
        () =>
          new Promise((resolve) => {
            let prior = performance.now(),
              start = prior,
              samples = [];
            function frame(t) {
              samples.push(t - prior);
              prior = t;
              if (t - start < 1600) requestAnimationFrame(frame);
              else {
                samples = samples.filter((x) => x > 0).sort((a, b) => a - b);
                resolve({
                  samples: samples.length,
                  medianMs: samples[Math.floor(samples.length * 0.5)],
                  p95Ms: samples[Math.floor(samples.length * 0.95)],
                  over50ms: samples.filter((x) => x > 50).length,
                });
              }
            }
            requestAnimationFrame(frame);
          }),
      );
      scenes.push({ label, ...cadence });
    }
    report.viewports.push({ viewport, first, scenes });
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(
    "verification/generated/performance.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
