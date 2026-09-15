import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import postcss from "postcss";
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function checkFaq(html, faq) {
  const schemas = [
    ...html.matchAll(
      /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].map((m) => JSON.parse(m[1]));
  const data = schemas.filter((x) => x["@type"] === "FAQPage");
  assert.equal(data.length, 1, "FAQ schema must have one source");
  assert.deepEqual(
    data[0].mainEntity.map((x) => [x.name, x.acceptedAnswer.text]),
    faq.map(([q, , a]) => [q, a]),
    "FAQ schema drift",
  );
  for (const [q, , a] of faq) {
    assert(html.includes(q), "Missing visible question");
    assert(html.includes(a), "Missing visible answer");
  }
}
export function checkPalette(styles) {
  const defined = new Set(),
    used = new Set();
  for (const [file, source] of Object.entries(styles)) {
    const ast = postcss.parse(source);
    ast.walkDecls((d) => {
      if (d.prop.startsWith("--")) defined.add(d.prop);
      for (const match of d.value.matchAll(/var\((--[\w-]+)/g))
        used.add(match[1]);
      if (!d.prop.startsWith("--"))
        assert(
          !/#[0-9a-f]{3,8}\b|rgba?\([^)]*\d/i.test(d.value),
          `Literal UI color: ${file} ${d.prop}`,
        );
    });
  }
  return { defined, used };
}
export async function checkArtifacts(manifest) {
  for (const [file, expected] of Object.entries(manifest.artifacts)) {
    const bytes = await readFile(file);
    assert.equal(
      sha256(bytes),
      expected.sha256,
      `Changed build artifact: ${file}`,
    );
  }
  for (const [file, expected] of Object.entries(manifest.sources)) {
    const bytes = await readFile(file);
    assert.equal(
      sha256(bytes),
      expected.sha256,
      `Build is stale for source: ${file}`,
    );
  }
}
export function checkKnownMedia(files, known) {
  for (const file of files)
    assert(known.has(file), `Unreviewed resource: ${file}`);
}
