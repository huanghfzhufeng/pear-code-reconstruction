const $ = (s) => document.querySelector(s),
  state = { viewport: "desktop", hero: "signal", scene: "hero", mode: "side" },
  root = "/evidence/results/";
const read = async (file) => {
  const r = await fetch(root + file, { cache: "no-store" });
  return r.ok ? r.json() : null;
};
const [comparison, motion, guards, e2e] = await Promise.all(
  ["comparison.json", "motion.json", "guards.json", "e2e.json"].map(read),
);
let current;
function source(file) {
  return root + file;
}
function choices() {
  const items =
    comparison?.comparisons.filter(
      (c) => c.viewport === state.viewport && c.hero === state.hero,
    ) || [];
  $("#scene").replaceChildren(
    ...items.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.label;
      return option;
    }),
  );
  if (!items.some((c) => c.id === state.scene)) state.scene = "hero";
  $("#scene").value = state.scene;
}
function update() {
  current = comparison?.comparisons.find(
    (c) =>
      c.viewport === state.viewport &&
      c.hero === state.hero &&
      c.id === state.scene,
  );
  if (!current) return;
  document.body.classList.toggle("is-mobile", state.viewport === "mobile");
  for (const [selector, file] of [
    ["#reference-image", current.reference],
    ["#local-image", current.local],
    ["#overlay-reference", current.reference],
    ["#overlay-local", current.local],
    ["#difference-image", current.diff],
  ])
    $(selector).src = source(file);
  const viewport = comparison.viewports[state.viewport];
  for (const image of document.querySelectorAll(".image-pair img")) {
    image.width = viewport.width;
    image.height = viewport.height;
  }
  $("#frame-description").textContent =
    `${viewport.width} × ${viewport.height} · ${current.label} · 固定状态`;
  $("#geometry-status").textContent = current.geometryDifferences.length
    ? `有 ${current.geometryDifferences.length} 项定位差异，请查看检查记录`
    : "主要文字 / 控件：未发现超过 1px 的定位差异";
  $("#open-replica").href = `/?hero=${state.hero}`;
  $("#original-link").href = `https://pear.no/?hero=${state.hero}`;
  $("#image-pair").hidden = state.mode !== "side";
  $("#overlay-view").hidden = state.mode === "side";
  $("#difference-image").hidden = state.mode !== "diff";
  $("#overlay-local").hidden = state.mode === "diff";
  $("#opacity-control").hidden = state.mode === "diff";
  for (const side of ["reference", "local"]) {
    const record = motion?.records.find(
      (r) =>
        r.viewport === state.viewport &&
        r.hero === state.hero &&
        r.side === side,
    );
    const video = $(`#${side}-video`);
    const url = record ? source(record.file) : "";
    if (video.getAttribute("src") !== url) {
      video.pause();
      if (url) video.src = url;
      else video.removeAttribute("src");
    }
    video.poster = source(
      comparison.comparisons.find(
        (c) =>
          c.viewport === state.viewport &&
          c.hero === state.hero &&
          c.id === "hero",
      )[side],
    );
    video.playbackRate = Number($("#speed").value);
  }
  const records =
    motion?.records.filter(
      (r) => r.viewport === state.viewport && r.hero === state.hero,
    ) || [];
  $("#motion-description").textContent =
    records.length === 2
      ? `两段独立浏览器录像采用相同的正向 / 反向滚动路线；${state.hero === "signal" ? "完整首页" : "这一首屏与进入正文的过渡"}。循环与纹理相位可能不同，精确画面对照请看上面的固定帧。`
      : "这一组连续录像尚未完成，不将截图视为动效验收。";
  if ($("#live-frame").getAttribute("src")) {
    const frame = $("#live-frame");
    frame.style.width = state.viewport === "mobile" ? "390px" : "100%";
    frame.style.height = state.viewport === "mobile" ? "844px" : "900px";
    if (!frame.src.endsWith("?hero=" + state.hero))
      frame.src = "/?hero=" + state.hero;
  }
}
function segments(id, key) {
  $(id).addEventListener("click", (event) => {
    const b = event.target.closest("button[data-value]");
    if (!b) return;
    state[key] = b.dataset.value;
    for (const el of $(id).querySelectorAll("button"))
      el.setAttribute("aria-pressed", String(el === b));
    if (key === "viewport") choices();
    update();
  });
}
segments("#viewport-control", "viewport");
segments("#mode-control", "mode");
$("#hero").addEventListener("change", () => {
  state.hero = $("#hero").value;
  choices();
  update();
});
$("#scene").addEventListener("change", () => {
  state.scene = $("#scene").value;
  update();
});
$("#opacity").addEventListener("input", () => {
  $("#overlay-local").style.opacity = Number($("#opacity").value) / 100;
  $("#opacity-value").textContent = $("#opacity").value + "%";
});
const videos = () => [$("#reference-video"), $("#local-video")];
$("#play-both").addEventListener("click", () => {
  const t = Math.min(...videos().map((v) => v.currentTime));
  for (const v of videos()) {
    v.currentTime = t;
    v.play().catch(() => {});
  }
});
$("#pause-both").addEventListener("click", () =>
  videos().forEach((v) => v.pause()),
);
$("#restart-both").addEventListener("click", () =>
  videos().forEach((v) => {
    v.pause();
    v.currentTime = 0;
  }),
);
$("#speed").addEventListener("change", () =>
  videos().forEach((v) => (v.playbackRate = Number($("#speed").value))),
);
$("#show-live").addEventListener("click", () => {
  $("#live-wrap").hidden = false;
  $("#live-frame").src = `/?hero=${state.hero}`;
  $("#live-frame").style.width = state.viewport === "mobile" ? "390px" : "100%";
  $("#live-frame").style.height =
    state.viewport === "mobile" ? "844px" : "900px";
});
$("#seek-live").addEventListener("click", () =>
  $("#live-frame").contentWindow?.postMessage(
    { type: "pear:seek", progress: current.progress },
    location.origin,
  ),
);
function escape(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function inline(s) {
  return escape(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}
function markdown(s) {
  let code = false,
    list = false,
    result = "";
  for (const line of s.split("\n")) {
    if (line.startsWith("```")) {
      if (list) {
        result += "</ul>";
        list = false;
      }
      code = !code;
      result += code ? "<pre><code>" : "</code></pre>";
      continue;
    }
    if (code) {
      result += escape(line) + "\n";
      continue;
    }
    if (line.startsWith("- ")) {
      if (!list) {
        result += "<ul>";
        list = true;
      }
      result += "<li>" + inline(line.slice(2)) + "</li>";
      continue;
    }
    if (list) {
      result += "</ul>";
      list = false;
    }
    const heading = line.match(/^(#{1,3}) (.*)/);
    if (heading)
      result += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    else if (line.trim()) result += "<p>" + inline(line) + "</p>";
  }
  return result + (list ? "</ul>" : "");
}
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-doc]");
  if (!button) return;
  const file = button.dataset.doc;
  const r = await fetch("/documents/" + file, { cache: "no-store" });
  $("#document-body").innerHTML = r.ok
    ? markdown(await r.text())
    : "<p>这份检查记录尚未生成，状态为未验证。</p>";
  $("#download-document").href = "/documents/" + file;
  $("#document-dialog").showModal();
  $("#document-dialog").scrollTop = 0;
});
$("#close-document").addEventListener("click", () =>
  $("#document-dialog").close(),
);
for (const item of [
  { name: "源码 / 构建守卫", data: guards },
  { name: "浏览器 / 收件检查", data: e2e },
  { name: "固定状态对照", pairs: comparison?.comparisons.length },
]) {
  const el = document.createElement("div");
  el.className = "check";
  const strong = document.createElement("strong"),
    p = document.createElement("p");
  if (item.data) {
    strong.textContent = `${item.data.passed} 项通过${item.data.failed ? " · " + item.data.failed + " 项待修正" : ""}`;
    strong.className = item.data.failed ? "fail" : "pass";
  } else strong.textContent = item.pairs ? `${item.pairs} 组可对照` : "未验证";
  p.textContent = item.name;
  el.append(strong, p);
  $("#checks").append(el);
}
$("#capture-date").textContent = comparison
  ? "基准记录：" + new Date(comparison.capturedAt).toLocaleString("zh-CN")
  : "";
choices();
update();

let paperStarted = false;
document
  .querySelector("#material-examples")
  .addEventListener("toggle", async (event) => {
    if (!event.target.open || paperStarted) return;
    paperStarted = true;
    try {
      const { startPaperDemo } = await import("./paper-demo.js");
      if (!startPaperDemo(document.querySelector("#paper-demo")))
        throw Error("WebGL unavailable");
    } catch {
      document.querySelector("#paper-demo-note").textContent =
        "此设备无法显示动态纸感演示；右侧是实际网页结果，具体方法见实现说明。";
    }
  });
