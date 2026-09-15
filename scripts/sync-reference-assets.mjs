// Recover authored picture information only. All scene effects remain code.
// Resumable hash ledger; never assumes the older reconstruction's dimensions are correct.
import { chromium } from "playwright-core";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const hash = (b) => createHash("sha256").update(b).digest("hex");
const ledgerFile = ".reference/asset-ledger.json";
const ledger = JSON.parse(
  await readFile(ledgerFile, "utf8").catch(() => '{"records":{}}'),
);
async function list(dir) {
  let out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await list(p)));
    else if (/\.(webp|jpg|json)$/.test(p)) out.push(p);
  }
  return out;
}
const files = await list("films");
const needed = [];
for (const file of files) {
  if (ledger.records[file]?.sha256 === hash(await readFile(file))) continue;
  needed.push(file);
}
console.log("Source pictures to verify:", needed.length, "/", files.length);
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
let failed = [];
try {
  const page = await browser.newPage();
  await page.goto("https://pear.no/?hero=signal", {
    waitUntil: "domcontentloaded",
  });
  for (let offset = 0; offset < needed.length; offset += 24) {
    const batch = needed.slice(offset, offset + 24);
    const results = await page.evaluate(async (files) => {
      const results = [];
      let cursor = 0;
      await Promise.all(
        Array.from({ length: 6 }, async () => {
          while (cursor < files.length) {
            const file = files[cursor++];
            try {
              const response = await fetch("/" + file);
              if (!response.ok) throw new Error(String(response.status));
              const b = new Uint8Array(await response.arrayBuffer());
              let s = "";
              for (let i = 0; i < b.length; i += 32768)
                s += String.fromCharCode(...b.subarray(i, i + 32768));
              results.push({ file, base64: btoa(s) });
            } catch (e) {
              results.push({ file, error: e.message });
            }
          }
        }),
      );
      return results;
    }, batch);
    for (const result of results) {
      if (result.error) {
        failed.push(result);
        continue;
      }
      const bytes = Buffer.from(result.base64, "base64");
      const previous = await readFile(result.file);
      await writeFile(result.file, bytes);
      ledger.records[result.file] = {
        url: "https://pear.no/" + result.file,
        sha256: hash(bytes),
        bytes: bytes.length,
        previousSha256: hash(previous),
        changed: hash(bytes) !== hash(previous),
      };
    }
    ledger.updatedAt = new Date().toISOString();
    ledger.failed = failed;
    await writeFile(ledgerFile, JSON.stringify(ledger, null, 2));
    if (offset % 120 === 0 || offset + 24 >= needed.length)
      console.log(
        "Verified",
        Math.min(offset + 24, needed.length),
        "/",
        needed.length,
        "failures",
        failed.length,
      );
  }
} finally {
  await browser.close();
}
if (failed.length) {
  console.error(
    "Incomplete source verification:",
    JSON.stringify(failed.slice(0, 12)),
  );
  process.exitCode = 1;
}
