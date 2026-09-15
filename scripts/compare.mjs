import { chromium } from "playwright-core";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import {
  VIEWPORTS,
  CHECKPOINTS,
  prepare,
  seekAndFreeze,
} from "./capture-utils.mjs";
const output = path.resolve("verification/generated");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const report = {
  capturedAt: new Date().toISOString(),
  reference: "https://pear.no/",
  local: "http://127.0.0.1:4187/",
  clock: { shaderMilliseconds: 600000, videoSeconds: 0 },
  viewports: VIEWPORTS,
  checkpoints: CHECKPOINTS,
  comparisons: [],
  notes: [
    "Pixel differences are a locator for review, not a total similarity score.",
    "Geometry, scene progression, motion recordings and manual review are separate evidence.",
    "Mobile video is a proportion-preserving 1440×810 derivative; desktop video is original.",
  ],
};
try {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    if (
      process.env.VIEWPORT_FILTER &&
      process.env.VIEWPORT_FILTER !== viewportName
    )
      continue;
    for (const hero of ["signal", "colossus", "reveal"]) {
      if (process.env.HERO_FILTER && process.env.HERO_FILTER !== hero) continue;
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
      });
      const reference = await context.newPage(),
        local = await context.newPage();
      await prepare(reference, report.reference + "?hero=" + hero);
      await prepare(local, report.local + "?hero=" + hero);
      const checkpoints =
        hero === "signal" ? CHECKPOINTS : CHECKPOINTS.slice(0, 3);
      for (const checkpoint of checkpoints) {
        if (
          process.env.POINT_FILTER &&
          !checkpoint.id.match(new RegExp(process.env.POINT_FILTER))
        )
          continue;
        const stem = `${viewportName}-${hero}-${checkpoint.id}`;
        const scrollProgress = await local.evaluate(
          (p) => window.__pearReview.scrollProgress(p),
          checkpoint.progress,
        );
        const a = await seekAndFreeze(reference, scrollProgress);
        const b = await seekAndFreeze(local, scrollProgress);
        const refFile = stem + "-reference.png",
          localFile = stem + "-local.png",
          diffFile = stem + "-diff.png";
        await reference.screenshot({ path: path.join(output, refFile) });
        await local.screenshot({ path: path.join(output, localFile) });
        const ref = PNG.sync.read(await readFile(path.join(output, refFile))),
          replica = PNG.sync.read(await readFile(path.join(output, localFile))),
          diff = new PNG({ width: ref.width, height: ref.height });
        const count = pixelmatch(
          ref.data,
          replica.data,
          diff.data,
          ref.width,
          ref.height,
          { threshold: 0.16, includeAA: false, alpha: 0.2 },
        );
        await writeFile(path.join(output, diffFile), PNG.sync.write(diff));
        const geometry = [];
        for (const [selector, boxes] of Object.entries(a.geometry)) {
          const localBoxes = b.geometry[selector];
          if (boxes.length !== localBoxes.length) {
            geometry.push({
              selector,
              issue: "visible_count",
              reference: boxes.length,
              local: localBoxes.length,
            });
            continue;
          }
          boxes.forEach((box, i) => {
            const delta = Math.max(
              ...["x", "y", "width", "height"].map((k) =>
                Math.abs(box[k] - localBoxes[i][k]),
              ),
            );
            if (delta > 1 || box.text !== localBoxes[i].text)
              geometry.push({
                selector,
                index: i,
                delta,
                textEqual: box.text === localBoxes[i].text,
                reference: box,
                local: localBoxes[i],
              });
          });
        }
        const item = {
          viewport: viewportName,
          hero,
          ...checkpoint,
          sceneProgress: checkpoint.progress,
          progress: scrollProgress,
          reference: refFile,
          local: localFile,
          diff: diffFile,
          differentPixelFraction: count / (ref.width * ref.height),
          geometryDifferences: geometry,
          referenceState: a,
          localState: b,
        };
        report.comparisons.push(item);
        await writeFile(
          path.join(output, "comparison.json"),
          JSON.stringify(report, null, 2),
        );
        console.log(
          stem,
          "pixel delta",
          item.differentPixelFraction.toFixed(4),
          "geometry differences",
          geometry.length,
        );
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(
    path.join(output, "comparison.json"),
    JSON.stringify(report, null, 2),
  );
}
