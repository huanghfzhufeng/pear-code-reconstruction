import { readFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import vm from "node:vm";
import assert from "node:assert/strict";
const source = await readFile("src/engine.js", "utf8");
const ast = parse(source, { sourceType: "module" });
const node = ast.program.body.find(
  (n) => n.type === "FunctionDeclaration" && n.id.name === "renderFlight",
);
const fn = source.slice(node.start, node.end);
function exercise(code) {
  const first = { id: "earlier-frame" },
    exact = { id: "requested-frame" },
    draws = [];
  let delivered = first;
  const context = {
    Nn: { style: {} },
    Pn: { style: {} },
    Rn: 0,
    er: true,
    In: -1,
    Ln: null,
    Fn: {
      ready: true,
      aim() {},
      near() {
        return delivered;
      },
    },
    drawFrame(_, image) {
      draws.push(image.id);
    },
    smoothstep: (x) => x * x * (3 - 2 * x),
    clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
    flightFraming: () => ({ dw: 1440, dh: 900, ox: 0, oy: 0 }),
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  context.renderFlight(0.5);
  delivered = exact;
  context.renderFlight(0.5);
  return draws;
}
assert.deepEqual(exercise(fn), ["earlier-frame", "requested-frame"]);
const old = fn.replace("Fn.ready)", "Fn.ready && t3 !== In)");
assert.notEqual(old, fn, "Regression mutation was not applied");
assert.throws(() =>
  assert.deepEqual(exercise(old), ["earlier-frame", "requested-frame"]),
);
console.log(
  "PASS late source frame refresh without scrolling; restored old gate fails.",
);
