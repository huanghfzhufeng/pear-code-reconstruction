import { chromium } from "playwright-core";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const records = [];
try {
  const page = await browser.newPage();
  await page.goto("https://pear.no/?hero=signal", {
    waitUntil: "domcontentloaded",
  });
  for (const file of [
    "films/signal.mp4",
    "films/colossus.mp4",
    "films/reveal.mp4",
    "films/footer-loop.mp4",
    "art/scaffold_expand.jpg",
    "films/model/renaissance/1440/f_181.webp",
    "films/plan/f_061.webp",
    "films/flysky/f_061.webp",
  ]) {
    const result = await page.evaluate(async (file) => {
      const r = await fetch("/" + file);
      if (!r.ok) throw new Error(`${r.status} ${file}`);
      const bytes = new Uint8Array(await r.arrayBuffer());
      let s = "";
      for (let i = 0; i < bytes.length; i += 32768)
        s += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return btoa(s);
    }, file);
    const bytes = Buffer.from(result, "base64"),
      sha256 = createHash("sha256").update(bytes).digest("hex");
    const local = await readFile(file);
    const same = createHash("sha256").update(local).digest("hex") === sha256;
    const dest = path.join(".reference/assets", file);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
    records.push({
      file,
      url: "https://pear.no/" + file,
      bytes: bytes.length,
      sha256,
      localBytes: local.length,
      localIdentical: same,
    });
    console.log(file, bytes.length, same ? "identical" : "differs");
  }
  await writeFile(
    ".reference/asset-provenance.json",
    JSON.stringify({ capturedAt: new Date().toISOString(), records }, null, 2),
  );
} finally {
  await browser.close();
}
