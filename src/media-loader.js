/** Bounded frame windows: scene activation and target frames drive every request. */
const CONCURRENCY = 4,
  BEHIND = 6,
  AHEAD = 14,
  KEEP_RADIUS = 18;
export const mediaStats = [];
const sequences = [];
let running = 0,
  scheduled = false;
const report = (sequence, url) =>
  window.dispatchEvent(
    new CustomEvent("pear:media-error", {
      detail: { sequence: sequence.name, url },
    }),
  );
function pump() {
  scheduled = false;
  const active = sequences
    .filter((s) => s.active)
    .sort((a, b) => b.lastAim - a.lastAim);
  for (const seq of active) {
    if (running >= CONCURRENCY) break;
    const order = [
      seq.target,
      ...Array.from({ length: AHEAD }, (_, i) => seq.target + i + 1),
      ...Array.from({ length: BEHIND }, (_, i) => seq.target - i - 1),
    ];
    for (const index of order) {
      if (running >= CONCURRENCY) break;
      if (
        index < 0 ||
        index >= seq.count ||
        seq.images[index] ||
        seq.inflight.has(index) ||
        (seq.failures.get(index) || 0) >= 2
      )
        continue;
      running++;
      seq.inflight.add(index);
      const image = new Image();
      image.decoding = "async";
      const url = seq.url(index);
      image.onload = () => {
        seq.images[index] = image;
        seq.public.loaded++;
        seq.public.ready = seq.public.loaded >= seq.minimum;
        for (let i = 0; i < seq.images.length; i++)
          if (Math.abs(i - seq.target) > KEEP_RADIUS) delete seq.images[i];
        done();
      };
      image.onerror = () => {
        seq.failures.set(index, (seq.failures.get(index) || 0) + 1);
        report(seq, url);
        done();
      };
      function done() {
        seq.inflight.delete(index);
        running--;
        queue();
      }
      image.src = url;
    }
  }
}
function queue() {
  if (!scheduled) {
    scheduled = true;
    queueMicrotask(pump);
  }
}
function makeSequence({ name, count, url, from, to, minimum = 3 }) {
  const images = [],
    output = {
      imgs: images,
      frames: images,
      N: count,
      ready: false,
      loaded: 0,
    };
  const seq = {
    name,
    count,
    url,
    from: Math.max(0, from - 0.025),
    to: Math.min(1, to + 0.025),
    minimum,
    images,
    public: output,
    active: false,
    target: 0,
    lastAim: 0,
    inflight: new Set(),
    failures: new Map(),
  };
  const aim = (index) => {
    index = Math.max(0, Math.min(count - 1, index));
    if (seq.target !== index) {
      seq.target = index;
      seq.lastAim = performance.now();
      if (seq.active) queue();
    }
  };
  const near = (index) => {
    aim(index);
    for (let d = 0; d < count; d++) {
      const image = images[index - d] || images[index + d];
      if (image?.naturalWidth) return image;
    }
    return null;
  };
  Object.assign(output, { aim, near, frameNear: near });
  sequences.push(seq);
  mediaStats.push({ name, seq: output, count });
  return output;
}
export function activateSceneLoads(progress) {
  for (const seq of sequences) {
    const active = progress >= seq.from && progress <= seq.to;
    if (active !== seq.active) {
      seq.active = active;
      if (active) {
        seq.lastAim = performance.now();
        queue();
      } else {
        for (let i = 0; i < seq.images.length; i++)
          if (i !== seq.target) delete seq.images[i];
      }
    }
  }
}
export function createSequence(base, count, minimum = 2, from = 0, to = 1) {
  const tier = matchMedia("(max-width: 820px)").matches ? "/768" : "";
  return makeSequence({
    name: base.replace("/films/", ""),
    count,
    minimum: minimum + 1,
    from,
    to,
    url: (i) => `${base}${tier}/f_${String(i + 1).padStart(3, "0")}.webp`,
  });
}
export function createReel(bridge, tier, to = 1) {
  return makeSequence({
    name: "reel",
    count: 483,
    from: 0,
    to,
    minimum: 3,
    url: (i) =>
      `/films/model/${i < 121 ? bridge : "renaissance"}/${tier}/f_${String(i < 121 ? i + 1 : i - 120).padStart(3, "0")}.webp`,
  });
}
export function loaderState() {
  return {
    running,
    concurrency: CONCURRENCY,
    sequences: sequences.map((s) => ({
      name: s.name,
      active: s.active,
      target: s.target,
      loaded: s.public.loaded,
      retained: s.images.filter(Boolean).length,
      failures: s.failures.size,
    })),
  };
}
