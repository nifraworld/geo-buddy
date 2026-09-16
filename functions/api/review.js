/* /api/review — the admin page's Submissions tab. Gated by REVIEW_KEY.
     GET  ?status=pending|accepted|rejected|all   -> { rows }
     POST { ids:[...], status:"accepted"|"rejected"|"pending", note? } */
import { json, preflight } from "../_lib.js";

export const onRequestOptions = () => preflight();

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "backend not set up yet" }, 503);
  const url = new URL(request.url);
  const key = request.headers.get("x-review-key") || url.searchParams.get("key");
  if (!env.REVIEW_KEY || key !== env.REVIEW_KEY) return json({ ok: false, error: "unauthorized" }, 401);

  if (request.method === "GET") {
    const st = url.searchParams.get("status") || "pending";
    try {
      const q = st === "all"
        ? env.DB.prepare("SELECT * FROM submissions ORDER BY id DESC LIMIT 500")
        : env.DB.prepare("SELECT * FROM submissions WHERE status = ? ORDER BY id DESC LIMIT 500").bind(st);
      return json({ ok: true, rows: ((await q.all()).results) || [] });
    } catch (e) { return json({ ok: true, rows: [], pending: "Run functions/schema-1.9.sql in the D1 console." }); }
  }
  if (request.method === "POST") {
    let b;
    try { b = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
    const ids = Array.isArray(b.ids) ? b.ids.map((x) => parseInt(x, 10)).filter((n) => n > 0).slice(0, 200) : [];
    const status = ["accepted", "rejected", "pending"].includes(b.status) ? b.status : null;
    if (!ids.length || !status) return json({ ok: false, error: "ids + status required" }, 400);
    const note = b.note == null ? null : String(b.note).slice(0, 500);
    for (const id of ids) {
      await env.DB.prepare("UPDATE submissions SET status = ?, resolved = ?, note = COALESCE(?, note) WHERE id = ?")
        .bind(status, new Date().toISOString(), note, id).run();
    }
    return json({ ok: true });
  }
  return json({ ok: false, error: "method not allowed" }, 405);
}
