import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const base = process.env.REVIEW_URL || "http://127.0.0.1:4187";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/review/");
  await page.waitForFunction(
    () => document.querySelector("#reference-image").naturalWidth > 0,
  );
  assert.equal(await page.locator("#scene option").count(), 23);
  results.push("23 primary checkpoints available");
  await page.getByRole("button", { name: "手机", exact: true }).click();
  await page.selectOption("#scene", "application");
  await page.waitForFunction(
    () => document.querySelector("#reference-image").naturalWidth === 390,
  );
  await page.getByRole("button", { name: "叠加", exact: true }).click();
  await page.locator("#opacity").fill("70");
  assert.equal(
    await page.locator("#overlay-local").evaluate((e) => e.style.opacity),
    "0.7",
  );
  await page.getByRole("button", { name: "差异", exact: true }).click();
  assert(await page.locator("#difference-image").isVisible());
  results.push("Mobile / overlay / difference controls");
  for (const [label, title] of [
    ["设计师交付要求", "做出类似 Pear 的网站"],
    ["实现说明", "Pear 复刻实现说明"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.locator("dialog[open]").waitFor();
    assert(
      (await page.locator("#document-body h1").innerText()).includes(title),
    );
    await page.getByRole("button", { name: "关闭文档", exact: true }).click();
  }
  results.push("Both delivered documents open and close");
  await page.getByRole("button", { name: "一起播放", exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".video-pair video")].every(
      (v) => !v.paused && v.currentTime > 0.3,
    ),
  );
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  assert(
    await page
      .locator(".video-pair video")
      .evaluateAll((vs) => vs.every((v) => v.paused)),
  );
  await page
    .locator(".video-pair video")
    .evaluateAll((vs) => vs.forEach((v) => (v.currentTime = 6)));
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".video-pair video")].every(
      (v) => Math.abs(v.currentTime - 6) < 0.1,
    ),
  );
  results.push("Paired video playback, pause and seek");
  const video = await page.locator("#local-video").getAttribute("src");
  const partial = await page.request.get(base + video, {
    headers: { Range: "bytes=0-127" },
  });
  assert.equal(partial.status(), 206);
  assert.equal((await partial.body()).length, 128);
  results.push("Media range requests");
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.equal(
    audit.violations.length,
    0,
    audit.violations
      .map((v) => v.id + ":" + v.nodes.map((n) => n.target))
      .join("\n"),
  );
  results.push("Review accessibility audit");
  await page.setViewportSize({ width: 390, height: 844 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({ path: "verification/generated/review-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "桌面", exact: true }).click();
  await page.selectOption("#scene", "hero");
  await page.getByRole("button", { name: "并排", exact: true }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: "verification/generated/review-desktop.png" });
  assert.deepEqual(errors, []);
  results.push("Mobile layout and no script errors");
  console.log("PASS", results.join("\nPASS "));
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
  results.push({ failure: e.message });
} finally {
  await browser.close();
  await mkdir("verification/generated", { recursive: true });
  await writeFile(
    "verification/generated/review-tests.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        base,
        results,
        passed: results.filter((x) => typeof x === "string").length,
        failed: results.filter((x) => typeof x !== "string").length,
      },
      null,
      2,
    ),
  );
}
