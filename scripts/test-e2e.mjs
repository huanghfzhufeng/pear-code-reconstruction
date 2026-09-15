import { chromium, webkit } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";

const run = new Date().toISOString().replace(/[:.]/g, "-"),
  port = 4193;
const output = path.resolve("verification/generated");
await mkdir(output, { recursive: true });
const inbox = path.resolve(".local", `e2e-${run}`, "inbox");
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: { ...process.env, PORT: String(port), PEAR_INBOX_DIR: inbox },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverOutput = "";
server.stdout.on("data", (b) => (serverOutput += b));
server.stderr.on("data", (b) => (serverOutput += b));
const base = `http://127.0.0.1:${port}`;
const results = [];
const browsers = [];
const check = async (name, fn) => {
  if (
    process.env.CASE_FILTER &&
    !name.match(new RegExp(process.env.CASE_FILTER))
  )
    return;
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({
      name,
      status: "pass",
      milliseconds: Date.now() - start,
      detail,
    });
    console.log("PASS", name);
  } catch (e) {
    results.push({
      name,
      status: "fail",
      milliseconds: Date.now() - start,
      error: e.stack,
    });
    console.error("FAIL", name, e.message);
  }
};
const startPage = async (browser, options = {}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...options,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  return { page, context };
};
const ready = async (page, hero = "signal") => {
  await page.goto(`${base}/?hero=${hero}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.documentElement.classList.contains("is-enhanced") &&
      !!window.__READOUT &&
      !document.querySelector(".boot"),
    { timeout: 20000 },
  );
  await page.waitForTimeout(200);
};
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
    if (i === 99) throw new Error(serverOutput);
  }
  const chrome = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  browsers.push(chrome);
  const { page, context } = await startPage(chrome);
  const errors = [];
  const requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  await check("desktop / initial scene, no runtime errors", async () => {
    await ready(page);
    assert.equal(
      await page.locator("#cinematic h1").innerText(),
      "Pear makes you appear.",
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, "desktop-hero.png") });
    return {
      viewport: page.viewportSize(),
      height: await page.evaluate(() => document.documentElement.scrollHeight),
    };
  });
  await check(
    "first screen / bounded source-frame requests, no external requests",
    async () => {
      const frames = requests.filter((u) => /f_\d+\.webp/.test(u));
      assert(frames.length <= 24, `eager frames: ${frames.length}`);
      assert(
        requests.every((u) => u.startsWith(base)),
        `external requests: ${requests.filter((u) => !u.startsWith(base))}`,
      );
      return { frameRequests: frames.length, resourceCount: requests.length };
    },
  );
  await check(
    "keyboard / visible focus and menu focus containment",
    async () => {
      await page.keyboard.press("Tab");
      assert.equal(
        await page.evaluate(() => document.activeElement.className),
        "mode-link",
      );
      const focus = await page
        .locator(".mode-link")
        .evaluate((e) => ({
          top: e.getBoundingClientRect().top,
          outline: getComputedStyle(e).outlineStyle,
        }));
      assert(focus.top >= 0 && focus.outline !== "none");
      await page.locator(".menu").click();
      await page.waitForFunction(() => document.activeElement.closest(".nvm"));
      assert.equal(
        await page.locator(".nvm").getAttribute("aria-hidden"),
        "false",
      );
      for (let i = 0; i < 7; i++) await page.keyboard.press("Tab");
      assert(
        await page.evaluate(
          () =>
            !!document.activeElement.closest(".nvm") ||
            document.activeElement.classList.contains("menu"),
        ),
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator(".menu").getAttribute("aria-expanded"),
        "false",
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.className),
        "menu",
      );
    },
  );
  await check(
    "navigation / all four chapter links land and close menu",
    async () => {
      for (const id of ["model", "work", "terms", "questions"]) {
        await page.locator(".menu").click();
        const link = page.locator(`.nvm a[href="#${id}"]`);
        const at = Number(await link.getAttribute("data-at"));
        await link.click();
        await page.waitForFunction(
          (at) =>
            Math.abs(
              scrollY / (document.documentElement.scrollHeight - innerHeight) -
                at,
            ) < 0.002,
          at,
        );
        assert.equal(
          await page.locator(".menu").getAttribute("aria-expanded"),
          "false",
        );
      }
      return { chapters: 4 };
    },
  );
  await check(
    "application / native validation, local receipt and persistent write",
    async () => {
      await page.locator(".apply").click();
      const form = page.locator("form.cf-in");
      await page.waitForFunction(
        () => document.querySelector(".cf").inert === false,
      );
      await form.locator('[type="submit"]').click();
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "application-name",
      );
      await form.locator('[name="name"]').fill("Pear acceptance");
      await form.locator('[name="email"]').fill("acceptance@example.test");
      await form
        .locator('[name="message"]')
        .fill("Local-only acceptance record.");
      await form.locator('[type="submit"]').click();
      await page.waitForFunction(
        () => document.querySelector("form.cf-in").dataset.receipt,
      );
      const receipt = await form.getAttribute("data-receipt");
      const rows = (
        await readFile(path.join(inbox, "applications.ndjson"), "utf8")
      )
        .trim()
        .split("\n")
        .map(JSON.parse);
      assert(
        rows.some((r) => r.id === receipt && r.destination === "local-review"),
      );
      assert.match(
        await form.locator('[role="status"]').innerText(),
        /Nothing was sent to Pear/,
      );
      await page.screenshot({ path: path.join(output, "form-received.png") });
      return { receipt, localInbox: true };
    },
  );
  await check(
    "application / failed network preserves fields and retries",
    async () => {
      await ready(page);
      await page.locator(".apply").click();
      await page.waitForFunction(() => !document.querySelector(".cf").inert);
      const form = page.locator("form.cf-in");
      await form.locator('[name="name"]').fill("Retry test");
      await form.locator('[name="email"]').fill("retry@example.test");
      await form.locator('[name="message"]').fill("Retain this text.");
      await page.route("**/api/apply", (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: '{"ok":false,"error":"test-unavailable"}',
        }),
      );
      await form.locator('[type="submit"]').click();
      await form
        .locator('[role="status"]')
        .filter({ hasText: "Receipt not confirmed" })
        .waitFor();
      assert.equal(
        await form.locator('[name="message"]').inputValue(),
        "Retain this text.",
      );
      assert.equal(await form.getAttribute("data-receipt"), null);
      await page.unroute("**/api/apply");
      await form.locator('[type="submit"]').click();
      await page.waitForFunction(
        () => document.querySelector("form.cf-in").dataset.receipt,
      );
    },
  );
  await check(
    "API / concurrent duplicate requests store once; conflict rejected",
    async () => {
      const payload = {
        requestId: randomUUID(),
        name: "Idempotence test",
        email: "idempotence@example.test",
        message: "One durable local entry.",
      };
      const submit = (p) =>
        context.request.post(base + "/api/apply", { data: p });
      const responses = await Promise.all([submit(payload), submit(payload)]);
      for (const r of responses) assert.equal(r.status(), 200);
      const receipts = await Promise.all(responses.map((r) => r.json()));
      assert.equal(receipts[0].receiptId, receipts[1].receiptId);
      const text = await readFile(
        path.join(inbox, "applications.ndjson"),
        "utf8",
      );
      assert.equal(
        text.split("\n").filter((l) => l.includes(payload.requestId)).length,
        1,
      );
      assert.equal(
        (await submit({ ...payload, message: "Changed payload" })).status(),
        409,
      );
      assert.equal(
        (
          await submit({
            ...payload,
            requestId: randomUUID(),
            email: "invalid",
          })
        ).status(),
        422,
      );
      assert.equal(
        (
          await context.request.post(base + "/api/apply", {
            headers: { Origin: "https://example.invalid" },
            data: payload,
          })
        ).status(),
        403,
      );
    },
  );
  await check(
    "reduced motion / full content, zero video requests, static FAQ and local form",
    async () => {
      const { page: p, context: c } = await startPage(chrome, {
        reducedMotion: "reduce",
      });
      let videoRequests = 0;
      p.on("request", (r) => {
        if (/\.mp4/.test(r.url())) videoRequests++;
      });
      await p.goto(base);
      await p.locator(".reader h1").waitFor({ state: "visible" });
      await p.waitForTimeout(250);
      assert.equal(
        await p.evaluate(() =>
          document.documentElement.classList.contains("is-enhanced"),
        ),
        false,
      );
      assert.equal(videoRequests, 0);
      await p.locator("#reader-questions summary").first().click();
      assert(
        (await p
          .locator("#reader-questions details")
          .first()
          .getAttribute("open")) !== null,
      );
      await p.screenshot({
        path: path.join(output, "reduced-motion.png"),
        fullPage: true,
      });
      await c.close();
      return { videoRequests };
    },
  );
  await check("no JavaScript / readable chapters and native FAQ", async () => {
    const { page: p, context: c } = await startPage(chrome, {
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    await p.goto(base);
    assert(await p.locator(".reader h1").isVisible());
    assert(await p.locator(".reader-form button").isDisabled());
    assert.equal(await p.locator(".reader section").count(), 5);
    await p.locator("#reader-questions summary").first().click();
    assert(
      (await p
        .locator("#reader-questions details")
        .first()
        .getAttribute("open")) !== null,
    );
    assert(
      await p
        .locator("#reader-application")
        .innerText()
        .then((t) => t.includes("No application has been sent")),
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await p.screenshot({
      path: path.join(output, "no-js-mobile.png"),
      fullPage: true,
    });
    await c.close();
  });
  await check(
    "dynamic reduced motion / renderer stops and media pause",
    async () => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() => window.__pearStopped === true);
      assert(await page.locator(".reader h1").isVisible());
      assert(
        await page.evaluate(() =>
          [...document.querySelectorAll("video")].every((v) => v.paused),
        ),
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
    },
  );
  await check(
    "media error / complete readable recovery, no false success",
    async () => {
      const { page: p, context: c } = await startPage(chrome);
      await p.route("**/*.mp4", (r) => r.abort());
      await p.goto(base);
      await p.locator(".reader h1").waitFor({ state: "visible" });
      await p.waitForFunction(() =>
        document
          .querySelector("#experience-notice")
          .textContent.includes("could not load"),
      );
      assert.equal(await p.locator("form[data-receipt]").count(), 0);
      await c.close();
    },
  );
  await check("WebGL unavailable / complete readable recovery", async () => {
    const { page: p, context: c } = await startPage(chrome);
    await p.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type === "webgl" ? null : original.call(this, type, ...args);
      };
    });
    await p.goto(base);
    await p.waitForFunction(() =>
      document
        .querySelector("#experience-notice")
        .textContent.includes("unavailable"),
    );
    assert(await p.locator(".reader h1").isVisible());
    await c.close();
  });
  await check(
    "slow network / content remains available while film is delayed",
    async () => {
      const { page: p, context: c } = await startPage(chrome);
      await p.route("**/*.mp4", async (r) => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        try {
          await r.abort();
        } catch {}
      });
      await p.goto(base);
      await p.waitForFunction(() => window.__pearStopped === true, {
        timeout: 15000,
      });
      assert(await p.locator(".reader h1").isVisible());
      await c.close();
    },
  );
  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
  ])
    await check(
      `responsive / ${viewport.width}×${viewport.height}`,
      async () => {
        const { page: p, context: c } = await startPage(chrome, { viewport });
        await ready(p);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await p.locator(".cta").click();
        await p.waitForFunction(() => !document.querySelector(".cf").inert);
        const rect = await p.locator("#application-email").boundingBox();
        assert(
          rect && rect.x >= -1 && rect.x + rect.width <= viewport.width + 2,
        );
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await p.screenshot({
          path: path.join(output, `responsive-${viewport.width}.png`),
        });
        await c.close();
        return { input: rect };
      },
    );
  await check("accessibility / reader WCAG A and AA", async () => {
    const { page: p, context: c } = await startPage(chrome);
    await p.goto(base + "/?reader=1");
    const audit = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    await writeFile(
      path.join(output, "axe-reader.json"),
      JSON.stringify(audit.violations, null, 2),
    );
    assert.equal(
      audit.violations.length,
      0,
      audit.violations.map((v) => v.id + ": " + v.nodes.length).join(", "),
    );
    await c.close();
  });
  await check(
    "URLs / canonical, noindex, review redirect and real missing response",
    async () => {
      const r = await context.request.get(base);
      assert.equal(
        (await r.text()).match(/rel="canonical" href="([^"]+)"/)?.[1],
        "http://127.0.0.1:4187/",
      );
      assert.match(r.headers()["x-robots-tag"], /noindex/);
      assert.equal(
        (await context.request.get(base + "/not-a-page")).status(),
        404,
      );
      const missing = await context.request.get(
        base + "/evidence/results/not-created-yet.png",
      );
      assert.equal(missing.status(), 404);
      assert.match(missing.headers()["cache-control"], /no-store/);
      const redirect = await context.request.get(base + "/review", {
        maxRedirects: 0,
      });
      assert.equal(redirect.status(), 308);
      assert.equal(redirect.headers().location, "/review/");
    },
  );

  await check(
    "late image / requested frame replaces earlier frame without further scroll",
    async () => {
      const { page: p, context: c } = await startPage(chrome);
      await p.route("**/films/flysky/f_060.webp", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        await route.continue();
      });
      await ready(p);
      await p.evaluate(() => window.__pearReview.seek(0.71));
      await p.waitForTimeout(350);
      await p.evaluate(() => window.__pearReview.seek(0.775));
      await p.waitForFunction(() =>
        document
          .querySelector("canvas.fly")
          .dataset.frameSource?.endsWith("f_060.webp"),
      );
      await c.close();
    },
  );
  await check(
    "wheel / forward, reverse and leaving-scene video pause",
    async () => {
      const { page: p, context: c } = await startPage(chrome);
      await ready(p);
      await p.mouse.wheel(0, 1600);
      await p.waitForFunction(() => scrollY > 1550);
      const first = await p.evaluate(() => scrollY);
      await p.mouse.wheel(0, -800);
      await p.waitForFunction((first) => scrollY < first - 300, first);
      await p.evaluate(() => window.__pearReview.seek(1));
      await p.waitForFunction(
        () => !document.querySelector("video.foot").paused,
      );
      assert(await p.locator("video.src").evaluate((v) => v.paused));
      await p.evaluate(() => window.__pearReview.seek(0));
      await p.waitForFunction(
        () => document.querySelector("video.foot").paused,
      );
      await c.close();
    },
  );
  await check(
    "early CTA / navigation intent survives delayed hero loading",
    async () => {
      const { page: p, context: c } = await startPage(chrome);
      await p.route("**/films/signal.mp4", async (r) => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try {
          await r.continue();
        } catch {}
      });
      await p.goto(base + "/?hero=signal", { waitUntil: "domcontentloaded" });
      await p.waitForFunction(() => !!window.__pearReview);
      await p.locator(".apply").click();
      await p.waitForFunction(() => !document.querySelector(".cf").inert);
      assert((await p.evaluate(() => window.__READOUT.raw)) > 0.8);
      await c.close();
    },
  );
  await context.close();
  await check("WebKit / desktop and mobile cinematic rendering", async () => {
    const browser = await webkit.launch();
    browsers.push(browser);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const { page: p, context: c } = await startPage(browser, { viewport });
      const problems = [];
      p.on("pageerror", (e) => problems.push(e.message));
      await ready(p);
      await p.locator(".cta").click();
      await p.waitForFunction(() => !document.querySelector(".cf").inert);
      assert.deepEqual(problems, []);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      await p.screenshot({
        path: path.join(output, `webkit-${viewport.width}.png`),
      });
      await c.close();
    }
  });
} catch (e) {
  results.push({ name: "test infrastructure", status: "fail", error: e.stack });
  console.error(e);
} finally {
  for (const browser of browsers) await browser.close();
  server.kill("SIGTERM");
  const report = {
    run,
    base,
    results,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    limitations: [
      "Browser emulation is not a physical iPhone Safari test.",
      "No external form delivery or production deployment is tested.",
    ],
  };
  await writeFile(
    path.join(output, "e2e.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify({ passed: report.passed, failed: report.failed }));
  if (report.failed) process.exitCode = 1;
}
