import { mkdir, readdir, readFile, writeFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";
const files = [];
async function include(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (p.includes("/recordings/")) continue;
    if (entry.isDirectory()) {
      if (entry.name !== "recordings") await include(p);
    } else files.push(p);
  }
}
for (const dir of [
  "src",
  "scripts",
  "review",
  "docs",
  "films",
  "fonts",
  "art",
  ".github/workflows",
  "verification/generated",
])
  await include(dir);
for (const file of [
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  "README.md",
  "source-origin.json",
  "favicon.svg",
  "favicon-32.png",
  "apple-touch-icon.png",
  "og.jpg",
  ".reference/media-motion-audit.jpg",
  ".reference/manifest.json",
])
  files.push(file);
await mkdir("delivery", { recursive: true });
const zip = "delivery/pear-reconstruction-20260915.zip";
const result = spawnSync("zip", ["-q", "-1", zip, "-@"], {
  input: files.join("\n") + "\n",
  encoding: "utf8",
});
if (result.status !== 0) throw new Error(result.stderr);
const bytes = await readFile(zip);
const manifest = {
  createdAt: new Date().toISOString(),
  file: zip,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  files: files.length,
  excluded: [
    ".local (private inbox and transient task state)",
    "node_modules",
    "dist (rebuild with npm run build)",
    "raw browser recordings",
    "captured third-party application bundle",
  ],
};
await writeFile("delivery/manifest.json", JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
