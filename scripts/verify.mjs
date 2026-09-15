import assert from "node:assert/strict";
import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  mkdtemp,
  rm,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  checkFaq,
  checkPalette,
  checkArtifacts,
  checkKnownMedia,
  sha256,
} from "./guards.mjs";
import { FAQ_DATA } from "../src/data/faq.js";
import { CONTENT } from "../src/data/site.js";
import { renderScene } from "../src/components/scene.js";
import { readerMarkup } from "../src/components/collections.js";
const results = [];
const run = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, status: "pass", detail });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, status: "fail", error: e.message });
    console.error("FAIL", name, e.message);
  }
};
const html = await readFile("dist/index.html", "utf8");
await run(
  "A1/D1/D2 / initial HTML content, native form, one FAQ source",
  () => {
    checkFaq(html, FAQ_DATA);
    for (const text of [
      "reader-model",
      "reader-work",
      "reader-terms",
      "reader-questions",
      "reader-application",
      "data-local-form",
      "No application has been sent",
    ])
      assert(html.includes(text), text);
  },
);
await run("S1/S2 / semantic palette and defined style variables", async () => {
  const styles = {};
  for (const f of await readdir("src/styles"))
    styles[f] = await readFile("src/styles/" + f, "utf8");
  const { defined, used } = checkPalette(styles);
  for (const file of [
    "src/engine.js",
    "src/components/scene.js",
    "src/components/collections.js",
  ]) {
    const s = await readFile(file, "utf8");
    for (const m of s.matchAll(/setProperty\([`"'](--[\w-]+)/g))
      defined.add(m[1]);
    for (const m of s.matchAll(/["'](--[\w-]+)["']\s*:/g)) defined.add(m[1]);
    for (const m of s.matchAll(/(--[\w-]+):/g)) defined.add(m[1]);
  }
  assert.deepEqual(
    [...used].filter((v) => !defined.has(v)),
    [],
  );
  return { variables: defined.size };
});
await run(
  "Code boundary / no captured application runtime or React shipped",
  async () => {
    const scripts = (await readdir("dist/assets")).filter((x) =>
      x.endsWith(".js"),
    );
    const text = (
      await Promise.all(
        scripts.map((x) => readFile("dist/assets/" + x, "utf8")),
      )
    ).join("\n");
    assert(
      !text.includes("react-dom") &&
        !text.includes("__reactFiber") &&
        !text.includes("turnstile"),
    );
    assert(!html.includes("index-BhJdAf8K"));
    const shader = await readFile("src/shaders/stage.js", "utf8");
    for (const algorithm of [
      "bayer4",
      "glyphRows",
      "fbm",
      "coverFit",
      "uRay1",
      "uPap",
    ])
      assert(shader.includes(algorithm));
    return { browserBundles: scripts };
  },
);
await run(
  "P1/P3 / source media identity and explicit derived-video budget",
  async () => {
    const ledger = JSON.parse(
      await readFile("docs/reference-assets.json", "utf8"),
    );
    let bytes = 0;
    for (const [file, r] of Object.entries(ledger.records)) {
      const b = await readFile(file);
      assert.equal(sha256(b), r.sha256, `Source changed: ${file}`);
      bytes += b.length;
    }
    const videos = JSON.parse(
      await readFile("docs/video-provenance.json", "utf8"),
    );
    async function mediaFiles(dir) {
      const files = [];
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...await mediaFiles(file));
        else files.push(file);
      }
      return files;
    }
    checkKnownMedia(await mediaFiles("films"), new Set([
      ...Object.keys(ledger.records), ...videos.records.map(record => record.file),
    ]));
    for (const r of videos.records) {
      const b = await readFile(r.file);
      assert.equal(sha256(b), r.sha256, r.file);
      assert.equal(r.nb_read_frames, "600");
      assert.equal(r.r_frame_rate, "60/1");
      assert(Math.abs(r.width / r.height - 16 / 9) < 0.001);
      assert(
        r.bytes < (r.file.includes("/mobile/") ? 9 : 14) * 1048576,
        "Video exceeds declared ceiling: " + r.file,
      );
    }
    return {
      verifiedPictureFiles: Object.keys(ledger.records).length,
      pictureBytes: bytes,
      videos: videos.records.length,
    };
  },
);
await run(
  "B2 / artifact hashes match current source and recorded build",
  async () => {
    const manifest = JSON.parse(
      await readFile("dist/build-manifest.json", "utf8"),
    );
    await checkArtifacts(manifest);
    return {
      sourceDigest: manifest.sourceDigest,
      artifactCount: Object.keys(manifest.artifacts).length,
    };
  },
);
await run(
  "B3 / guards fail when their protected inputs are damaged",
  async () => {
    assert.throws(() =>
      checkFaq(
        html.replace(
          '"acceptedAnswer":{"@type":"Answer","text":"Nothing upfront',
          '"acceptedAnswer":{"@type":"Answer","text":"Old upfront',
        ),
        FAQ_DATA,
      ),
    );
    assert.throws(() => checkPalette({ "fixture.css": "p {color:#ff0000}" }));
    assert.throws(() =>
      checkKnownMedia(
        ["films/unreviewed-effect-video.mp4"],
        new Set(["films/signal.mp4"]),
      ),
    );
    const dir = await mkdtemp(path.join(os.tmpdir(), "pear-guard-"));
    const file = path.join(dir, "artifact.html");
    try {
      await writeFile(file, "verified");
      const manifest = {
        sources: {},
        artifacts: { [file]: { sha256: sha256("verified") } },
      };
      await checkArtifacts(manifest);
      await writeFile(file, "wrong version");
      await assert.rejects(() => checkArtifacts(manifest));
      await writeFile(file, "verified");
      await checkArtifacts(manifest);
    } finally {
      await rm(dir, { recursive: true });
    }
    return { negativeCases: 4, restoredArtifactPass: true };
  },
);
await run("D1 / one CTA edit updates animated faces and readable content", () => {
  const original = CONTENT.hero.cta;
  try {
    CONTENT.hero.cta = "Verified shared action";
    assert.equal(renderScene().html.split("Verified shared action").length - 1, 2);
    assert(readerMarkup().includes("Verified shared action"));
  } finally {
    CONTENT.hero.cta = original;
  }
});
await mkdir("verification/generated", { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  results,
  passed: results.filter((x) => x.status === "pass").length,
  failed: results.filter((x) => x.status === "fail").length,
};
await writeFile(
  "verification/generated/guards.json",
  JSON.stringify(report, null, 2),
);
if (report.failed) process.exitCode = 1;
