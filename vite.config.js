import { defineConfig } from "vite";
import {
  readFile,
  writeFile,
  cp,
  mkdir,
  readdir,
  stat,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { renderScene } from "./src/components/scene.js";
import { readerMarkup } from "./src/components/collections.js";
import { FAQ_DATA } from "./src/data/faq.js";
import { localInbox } from "./src/local-api.mjs";
const port = Number(process.env.PORT || 4187);
const documents = [
  "ACCEPTANCE.md",
  "IMPLEMENTATION.md",
  "DESIGN-HANDOFF.md",
  "DESIGN-SCALES.md",
  "VERIFICATION.md",
];
const types = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".js": "text/javascript",
  ".css": "text/css",
};
function register(server) {
  server.middlewares.use(
    localInbox({
      directory: process.env.PEAR_INBOX_DIR || path.resolve(".local/inbox"),
    }),
  );
  server.middlewares.use(async (req, res, next) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (pathname === "/review") {
      res.writeHead(308, { Location: "/review/" });
      res.end();
      return;
    }
    let base, relative;
    if (pathname.startsWith("/evidence/reference/")) {
      base = ".reference";
      relative = pathname.slice("/evidence/reference/".length);
    }
    if (pathname.startsWith("/evidence/results/")) {
      base = "verification/generated";
      relative = pathname.slice("/evidence/results/".length);
    }
    if (pathname.startsWith("/documents/")) {
      base = "docs";
      relative = pathname.slice("/documents/".length);
      if (!documents.includes(relative)) {
        res.writeHead(404, { "Cache-Control": "no-store" });
        res.end("Not found");
        return;
      }
    }
    if (base) {
      const file = path.resolve(base, relative);
      if (!file.startsWith(path.resolve(base) + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      try {
        const bytes = await readFile(file);
        const headers = {
          "Content-Type":
            types[path.extname(file)] || "application/octet-stream",
          "Cache-Control": "no-store",
          "Accept-Ranges": "bytes",
        };
        const range = String(req.headers.range || "").match(
          /^bytes=(\d*)-(\d*)$/,
        );
        if (range && (range[1] || range[2])) {
          let start = range[1]
              ? Number(range[1])
              : Math.max(0, bytes.length - Number(range[2])),
            end = range[1]
              ? range[2]
                ? Number(range[2])
                : bytes.length - 1
              : bytes.length - 1;
          end = Math.min(end, bytes.length - 1);
          if (start > end || start >= bytes.length) {
            res.writeHead(416, {
              ...headers,
              "Content-Range": `bytes */${bytes.length}`,
            });
            res.end();
            return;
          }
          res.writeHead(206, {
            ...headers,
            "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
            "Content-Length": end - start + 1,
          });
          res.end(bytes.subarray(start, end + 1));
        } else {
          res.writeHead(200, { ...headers, "Content-Length": bytes.length });
          res.end(bytes);
        }
      } catch {
        res.writeHead(404, { "Cache-Control": "no-store" });
        res.end("Not found");
      }
      return;
    }
    if (
      !path.extname(pathname) &&
      !["/", "/review/"].includes(pathname) &&
      !pathname.startsWith("/@")
    ) {
      res.writeHead(404, { "Cache-Control": "no-store" });
      res.end("Not found");
      return;
    }
    if (pathname === "/" || pathname === "/review/")
      res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });
}
async function fileHashes(directory) {
  let out = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(out, await fileHashes(file));
    else {
      const bytes = await readFile(file);
      out[file.replaceAll(path.sep, "/")] = {
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      };
    }
  }
  return out;
}
export default defineConfig({
  publicDir: false,
  server: { host: "127.0.0.1", port, strictPort: true },
  preview: { host: "127.0.0.1", port, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve("index.html"),
        review: path.resolve("review/index.html"),
      },
    },
  },
  plugins: [
    {
      name: "static-pear-reconstruction",
      configureServer: register,
      configurePreviewServer: register,
      transformIndexHtml(html, ctx) {
        if (ctx.path.startsWith("/review")) return html;
        const schema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_DATA.map(([name, , text]) => ({
            "@type": "Question",
            name,
            acceptedAnswer: { "@type": "Answer", text },
          })),
        };
        return html
          .replace("<!--SCENE-->", renderScene().html)
          .replace("<!--READER-->", readerMarkup())
          .replace(
            "<!--FAQ-SCHEMA-->",
            `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`,
          )
          .replaceAll("__SITE_ORIGIN__", `http://127.0.0.1:${port}`);
      },
      async writeBundle() {
        for (const dir of ["films", "fonts", "art"])
          await cp(dir, path.join("dist", dir), { recursive: true });
        for (const file of [
          "favicon.svg",
          "favicon-32.png",
          "apple-touch-icon.png",
          "og.jpg",
        ])
          await cp(file, path.join("dist", file));
        await writeFile(
          "dist/robots.txt",
          "User-agent: *\nDisallow:\n# Internal study. Pages carry X-Robots-Tag and meta noindex.\n",
        );
        let sources = {};
        for (const dir of ["src", "scripts", "review"])
          Object.assign(sources, await fileHashes(dir));
        for (const f of [
          "package.json",
          "package-lock.json",
          "vite.config.js",
          "index.html",
          "review/index.html",
          "source-origin.json",
        ]) {
          const b = await readFile(f);
          sources[f] = {
            bytes: b.length,
            sha256: createHash("sha256").update(b).digest("hex"),
          };
        }
        const artifacts = await fileHashes("dist");
        delete artifacts["dist/build-manifest.json"];
        const hasGit = await stat(".git")
          .then(() => true)
          .catch(() => false);
        const origin = hasGit
          ? {
              branch: execFileSync("git", ["branch", "--show-current"], {
                encoding: "utf8",
              }).trim(),
              baseCommit: execFileSync("git", ["rev-parse", "HEAD"], {
                encoding: "utf8",
              }).trim(),
            }
          : JSON.parse(await readFile("source-origin.json", "utf8"));
        const manifest = {
          builtAt: new Date().toISOString(),
          branch: origin.branch,
          baseCommit: origin.baseCommit,
          checkoutKind: hasGit ? "git-worktree" : "source-export",
          sourceDigest: createHash("sha256")
            .update(JSON.stringify(sources))
            .digest("hex"),
          sources,
          artifacts,
        };
        await writeFile(
          "dist/build-manifest.json",
          JSON.stringify(manifest, null, 2),
        );
      },
    },
  ],
});
