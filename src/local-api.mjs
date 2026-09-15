import { appendFile, mkdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

/** Local-only acceptance inbox. No SMTP, cloud credentials or external requests. */
export function localInbox({ directory = path.resolve(".local/inbox") } = {}) {
  let writes = Promise.resolve();
  const reply = (res, status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  return async (req, res, next) => {
    if (req.url?.split("?")[0] !== "/api/apply") return next();
    if (req.method !== "POST")
      return reply(res, 405, { ok: false, error: "method_not_allowed" });
    const origin = req.headers.origin;
    if (
      origin &&
      origin !== `http://${req.headers.host}` &&
      origin !== `https://${req.headers.host}`
    )
      return reply(res, 403, { ok: false, error: "origin_mismatch" });
    if (
      !String(req.headers["content-type"] || "").startsWith("application/json")
    )
      return reply(res, 415, { ok: false, error: "json_required" });
    try {
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 8192)
          return reply(res, 413, { ok: false, error: "too_large" });
      }
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        return reply(res, 400, { ok: false, error: "invalid_json" });
      }
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const email = typeof body?.email === "string" ? body.email.trim() : "";
      const message =
        typeof body?.message === "string" ? body.message.trim() : "";
      const requestId =
        typeof body?.requestId === "string" ? body.requestId : "";
      if (!name || name.length > 100)
        return reply(res, 422, { ok: false, error: "name_required" });
      if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return reply(res, 422, { ok: false, error: "valid_email_required" });
      if (!message || message.length > 5000)
        return reply(res, 422, { ok: false, error: "message_required" });
      if (!/^[a-zA-Z0-9-]{16,64}$/.test(requestId))
        return reply(res, 422, { ok: false, error: "request_id_required" });
      let record;
      const operation = writes.then(async () => {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const file = path.join(directory, "applications.ndjson");
        const existing = await readFile(file, "utf8").catch((e) => {
          if (e.code === "ENOENT") return "";
          throw e;
        });
        record = existing
          .split("\n")
          .filter(Boolean)
          .map((x) => JSON.parse(x))
          .find((x) => x.requestId === requestId);
        if (record) {
          if (
            record.name !== name ||
            record.email !== email ||
            record.message !== message
          ) {
            const e = new Error("request_id_conflict");
            e.status = 409;
            throw e;
          }
          return;
        }
        record = {
          id: randomUUID(),
          receivedAt: new Date().toISOString(),
          requestId,
          name,
          email,
          message,
          destination: "local-review",
        };
        await appendFile(file, JSON.stringify(record) + "\n", { mode: 0o600 });
      });
      writes = operation.catch(() => {});
      await operation;
      reply(res, 200, {
        ok: true,
        receiptId: record.id,
        receivedAt: record.receivedAt,
        destination: record.destination,
      });
    } catch (e) {
      reply(res, e.status || 500, {
        ok: false,
        error:
          e.status === 409 ? "request_id_conflict" : "local_inbox_unavailable",
      });
    }
  };
}
