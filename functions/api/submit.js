/* POST /api/submit — "Report a mistake" from the app.
     { kind:"report", itemKind:"div"|"z"|"c", itemId, itemName, field?, text,
       lang, appVersion, device, email?, bot? }
   Written to `submissions` with status 'pending'; reviewed in /admin.
   Without a D1 binding the endpoint says so and the app fails quietly. */
import { json, preflight } from "../_lib.js";

export const onRequestOptions = () => preflight();

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "backend not set up yet" }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  if (b.bot) return json({ ok: true });                       // honeypot
  const s = (v, n = 500) => (v == null || v === "" ? null : String(v).slice(0, n));
  const text = s(b.text, 1000);
  if (!text) return json({ ok: false, error: "text required" }, 400);
  try {
    await env.DB.prepare(
      `INSERT INTO submissions (kind, created, status, app_version, device, email, lang, item_kind, item_id, item_name, field, text)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind("report", new Date().toISOString(), "pending", s(b.appVersion, 20), s(b.device, 40), s(b.email, 200),
      s(b.lang, 5), s(b.itemKind, 10), s(b.itemId, 40), s(b.itemName, 100), s(b.field, 40), text).run();
  } catch (e) { return json({ ok: false, error: "write failed (run schema-1.9.sql?)" }, 500); }
  return json({ ok: true });
}
