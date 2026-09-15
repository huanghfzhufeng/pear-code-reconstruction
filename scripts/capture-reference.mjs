import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve(".reference");
await mkdir(root, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const response = await page.goto("https://pear.no/?hero=signal", {
    waitUntil: "domcontentloaded",
  });
  const html = await response.text();
  await writeFile(path.join(root, "original.html"), html);
  const urls = await page.evaluate(() => ({
    js: [...document.scripts].map((e) => e.src).filter(Boolean),
    css: [...document.querySelectorAll('link[rel="stylesheet"]')].map(
      (e) => e.href,
    ),
  }));
  const files = [];
  for (const type of ["js", "css"])
    for (const [i, url] of urls[type].entries()) {
      const content = await page.evaluate(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${url}`);
        return response.text();
      }, url);
      const file = `original-${i}.${type}`;
      await writeFile(path.join(root, file), content);
      files.push({
        file,
        url,
        bytes: Buffer.byteLength(content),
        sha256: createHash("sha256").update(content).digest("hex"),
      });
    }
  await page.waitForFunction(() => !document.querySelector(".boot"), {
    timeout: 90000,
  });
  const manifest = {
    capturedAt: new Date().toISOString(),
    url: page.url(),
    files,
    viewport: page.viewportSize(),
  };
  await writeFile(
    path.join(root, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  await page.screenshot({ path: path.join(root, "hero-signal-desktop.png") });
  console.log(JSON.stringify(manifest, null, 2));
} finally {
  await browser.close();
}
