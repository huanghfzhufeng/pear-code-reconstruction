import { readFile, writeFile } from "node:fs/promises";
import postcss from "postcss";
import { format } from "prettier";
const all = await readFile(".reference/readable.css", "utf8");
const css = postcss.parse(
  all.slice(all.indexOf("@font-face {\n  font-family: Flecha L;")),
);
const colors = new Map(),
  type = new Map(),
  radii = new Map(),
  spaces = new Map();
const known = {
  "#0b0a09": "--press",
  "#f2f1ed": "--paper",
  "#1d1c19": "--ink",
  "#fff": "--on-dark",
  "#000": "--mask-ink",
  "#0000": "--transparent",
  "#fff0": "--transparent-white",
  "#fffaea": "--star-core",
  "#3a2c10": "--metal-shadow",
  "#d9be86": "--metal-light",
  "#c2a365": "--metal-mid",
  "#a98a4e": "--metal-deep",
  "#eff4fa": "--glass-light",
  "#dce6f2": "--glass-mid",
  "#2e2109": "--metal-ink",
};
function colorName(v) {
  if (known[v]) return known[v];
  if (v.startsWith("#ffffff")) return "--on-dark-" + v.slice(7);
  if (v.startsWith("#1d1c19")) return "--ink-" + v.slice(7);
  return (
    "--" +
    (/#(?:ff|d9|c2|a9|3c|2e)/.test(v)
      ? "warm-light"
      : /#(?:e2|06|08)/.test(v)
        ? "sky-shade"
        : "surface-shade") +
    "-" +
    v.slice(1)
  );
}
css.walkDecls((d) => {
  if (d.prop.startsWith("--") && d.parent.selector === ":root") return;
  d.value = d.value.replace(/#[0-9a-fA-F]{3,8}\b/g, (v) => {
    const n = colorName(v.toLowerCase());
    colors.set(n, v);
    return `var(${n})`;
  });
  const store =
    d.prop === "font-size"
      ? type
      : d.prop === "border-radius"
        ? radii
        : ["gap", "row-gap", "column-gap"].includes(d.prop)
          ? spaces
          : null;
  if (store && !d.value.includes("var(")) {
    const role = store === type ? "type" : store === radii ? "radius" : "gap";
    if (!store.has(d.value))
      store.set(d.value, `--${role}-scene-${store.size + 1}`);
    d.value = `var(${store.get(d.value)})`;
  }
});
let tokens =
  "/* Semantic palette. Scene typography retains measured art-directed scales; see docs/DESIGN-SCALES.md. */\n:root {\n";
for (const [k, v] of colors)
  if (!["--press", "--paper", "--ink"].includes(k)) tokens += ` ${k}:${v};\n`;
for (const store of [type, radii, spaces])
  for (const [v, k] of store) tokens += ` ${k}:${v};\n`;
tokens +=
  " --focus-ring: #ffe2a6; --status-error: #a72f23; --status-success: #225d40; --reader-bg:#f2f1ed; --reader-ink:#1d1c19;\n --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px;\n --type-label:12px; --type-body:16px; --type-lead:20px; --type-heading:32px; --type-title:48px;\n}\n";
const reset =
  "*,::before,::after{box-sizing:border-box;border:0 solid;margin:0;padding:0} html{line-height:1.5;-webkit-text-size-adjust:100%} body{margin:0}button,input,textarea{font:inherit;color:inherit;background:transparent} button,a{cursor:pointer} a{color:inherit;text-decoration:inherit} h1,h2,h3,p{margin:0} h1,h2,h3{font-size:inherit;font-weight:inherit} img,svg,video,canvas{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}button{border-radius:0}svg{overflow:visible}";
await writeFile(
  "src/styles/tokens.css",
  await format(tokens, { parser: "css" }),
);
await writeFile(
  "src/styles/scene.css",
  await format(reset + "\n" + css.toString(), { parser: "css" }),
);
await writeFile(
  "docs/DESIGN-SCALES.md",
  "# 设计刻度与例外\n\n普通阅读和评审界面使用 4/8/12/16/24/32/48/64 间距与 12/16/20/32/48 字号。\n\n以下是现站实测的电影场景字号：场景整体缩放时参与图文配准，为保留原站画面而逐项列为展示层刻度例外；不能在普通 UI 任意使用。\n\n" +
    [...type].map(([v, k]) => `- \`${k}\`：\`${v}\``).join("\n") +
    "\n\n舞台坐标、SVG 路径、纹理像素、着色器几何量属于画面几何数据，不作为 UI 间距。颜色集中在 tokens.css 和 scene.css 的 :root 定义，所有状态颜色引用语义变量。\n",
);
console.log(
  "Scene styles normalized",
  colors.size,
  "palette entries",
  type.size,
  "documented scene type values",
);
