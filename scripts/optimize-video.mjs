import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, stat, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const run = (args) => {
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "info", ...args],
    { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 },
  );
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stderr;
};
const probe = (file) =>
  JSON.parse(
    spawnSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-count_frames",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,r_frame_rate,nb_read_frames,duration",
        "-of",
        "json",
        file,
      ],
      { encoding: "utf8" },
    ).stdout,
  ).streams[0];
const hash = async (f) =>
  createHash("sha256")
    .update(await readFile(f))
    .digest("hex");
await mkdir("films/mobile", { recursive: true });
const records = [];
for (const name of ["signal", "colossus", "reveal", "footer-loop"]) {
  const source = `.reference/assets/films/${name}.mp4`;
  for (const mobile of [false, true]) {
    const file = `films/${mobile ? "mobile/" : ""}${name}.mp4`;
    run([
      "-y",
      "-i",
      source,
      "-an",
      "-vf",
      mobile ? "scale=1440:-2" : "null",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      mobile ? "22" : "20",
      "-threads",
      "2",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      file,
    ]);
    const dimensions = probe(file),
      original = probe(source);
    if (
      dimensions.r_frame_rate !== original.r_frame_rate ||
      dimensions.nb_read_frames !== original.nb_read_frames ||
      Math.abs(
        dimensions.width / dimensions.height - original.width / original.height,
      ) > 0.001
    )
      throw new Error("Frame or aspect mismatch " + file);
    const log = run([
      "-i",
      source,
      "-i",
      file,
      "-lavfi",
      `[0:v]scale=${dimensions.width}:${dimensions.height}[ref];[ref][1:v]ssim`,
      "-threads",
      "2",
      "-f",
      "null",
      "-",
    ]);
    const ssim = Number(log.match(/All:([\d.]+)/)?.[1]);
    if (!Number.isFinite(ssim) || ssim < 0.975)
      throw new Error(`Unexpected visual loss ${file}: ${ssim}`);
    records.push({
      file,
      sourceUrl: `https://pear.no/films/${name}.mp4`,
      sourceSha256: await hash(source),
      sha256: await hash(file),
      sourceBytes: (await stat(source)).size,
      bytes: (await stat(file)).size,
      ...dimensions,
      ssim,
      settings: {
        codec: "libx264",
        preset: "medium",
        crf: mobile ? 22 : 20,
        framerate: "preserved",
        aspect: "preserved",
      },
    });
    if (!mobile && records.at(-1).bytes > records.at(-1).sourceBytes) {
      await copyFile(source, file);
      Object.assign(records.at(-1), {
        bytes: records.at(-1).sourceBytes,
        sha256: records.at(-1).sourceSha256,
        ssim: 1,
        settings: {
          strategy: "original is smaller and preserves every source pixel",
          codec: "source unchanged",
          framerate: "preserved",
          aspect: "preserved",
        },
      });
    }
    console.log(
      file,
      dimensions.width + "×" + dimensions.height,
      (records.at(-1).bytes / 1048576).toFixed(2) + " MiB",
      "SSIM",
      ssim,
    );
    await writeFile(
      "docs/video-provenance.json",
      JSON.stringify({ createdAt: new Date().toISOString(), records }, null, 2),
    );
  }
}
