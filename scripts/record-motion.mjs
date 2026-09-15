import { chromium } from "playwright-core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { VIEWPORTS } from "./capture-utils.mjs";
const dir = path.resolve("verification/generated");
await mkdir(path.join(dir, "recordings"), { recursive: true });
const report = {
  recordedAt: new Date().toISOString(),
  method:
    "Real browser recordings; identical forward/reverse scroll route. Each recording has its own natural animation clock.",
  records: [],
};
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS))
    for (const hero of ["signal", "colossus", "reveal"])
      for (const side of ["reference", "local"]) {
        if (
          process.env.VIEWPORT_FILTER &&
          process.env.VIEWPORT_FILTER !== viewportName
        )
          continue;
        if (process.env.HERO_FILTER && process.env.HERO_FILTER !== hero)
          continue;
        const context = await browser.newContext({
          viewport,
          recordVideo: { dir: path.join(dir, "recordings"), size: viewport },
        });
        const page = await context.newPage();
        const url =
          (side === "reference"
            ? "https://pear.no/"
            : "http://127.0.0.1:4187/") +
          "?hero=" +
          hero;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(
          () => !!window.__READOUT && !document.querySelector(".boot"),
          null,
          { timeout: 90000 },
        );
        await page.evaluate(() => document.fonts.ready);
        // Warm the required scenes independently from the cold-load acceptance test.
        const end = hero === "signal" ? 1 : 0.07;
        for (let i = 0; i <= 25; i++) {
          await page.evaluate(
            (p) =>
              scrollTo(
                0,
                p * (document.documentElement.scrollHeight - innerHeight),
              ),
            (i / 25) * end,
          );
          await page.waitForTimeout(60);
        }
        await page.waitForTimeout(4500);
        await page.evaluate(() => {
          scrollTo(0, 0);
          window.__pearReview?.seek(0);
        });
        await page.waitForTimeout(700);
        const forward = hero === "signal" ? 60000 : 14000,
          back = hero === "signal" ? 20000 : 6000;
        const wallStart = Date.now();
        const trace = await page.evaluate(
          async ({ forward, back, end }) => {
            const trace = [],
              start = performance.now(),
              total = forward + back;
            await new Promise((resolve) => {
              let last = -1;
              function frame(now) {
                const elapsed = now - start;
                const progress =
                  elapsed <= forward
                    ? (end * elapsed) / forward
                    : end * (1 - (elapsed - forward) / back);
                const p = Math.max(0, Math.min(end, progress));
                if (window.__pearReview) window.__pearReview.seek(p);
                else
                  scrollTo(
                    0,
                    p * (document.documentElement.scrollHeight - innerHeight),
                  );
                const second = Math.floor(elapsed / 1000);
                if (second !== last) {
                  last = second;
                  trace.push({
                    seconds: elapsed / 1000,
                    progress: p,
                    sceneProgress: window.__READOUT?.raw,
                  });
                }
                if (elapsed < total) requestAnimationFrame(frame);
                else resolve();
              }
              requestAnimationFrame(frame);
            });
            return trace;
          },
          { forward, back, end },
        );
        await page.waitForTimeout(600);
        const captureSeconds = (Date.now() - wallStart) / 1000;
        const raw = await page.video().path();
        await context.close();
        const duration = Number(
          spawnSync(
            "ffprobe",
            [
              "-v",
              "error",
              "-show_entries",
              "format=duration",
              "-of",
              "default=nw=1:nk=1",
              raw,
            ],
            { encoding: "utf8" },
          ).stdout.trim(),
        );
        const start = Math.max(0, duration - captureSeconds),
          file = `motion-${viewportName}-${hero}-${side}.mp4`;
        const result = spawnSync(
          "ffmpeg",
          [
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            String(start),
            "-i",
            raw,
            "-t",
            String(captureSeconds),
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "21",
            "-threads",
            "2",
            "-movflags",
            "+faststart",
            path.join(dir, file),
          ],
          { encoding: "utf8" },
        );
        if (result.status !== 0) throw new Error(result.stderr);
        report.records.push({
          viewport: viewportName,
          hero,
          side,
          url,
          file,
          seconds: captureSeconds,
          forwardSeconds: forward / 1000,
          reverseSeconds: back / 1000,
          trace,
        });
        await writeFile(
          path.join(dir, "motion.json"),
          JSON.stringify(report, null, 2),
        );
        console.log(
          "Recorded",
          viewportName,
          hero,
          side,
          captureSeconds.toFixed(1) + "s",
        );
      }
} finally {
  await browser.close();
  await writeFile(
    path.join(dir, "motion.json"),
    JSON.stringify(report, null, 2),
  );
}
