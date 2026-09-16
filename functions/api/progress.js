/* /api/progress — per-child progress for the class dashboards.

   POST { email, device, appVersion?, children:[ { hash, name, level, xp,
          stars, streak, accuracy, asked, correct, areas:{d,z,c:{a,ok}},
          weak:[names], badges, lastPractised } ] }
        -> upsert one row per (email, device, child). Sent by the app when
           online for an activated key. No auth: it is additive telemetry
           about the buyer's own key, and the parent can switch it off.

   GET  ?email=..&key=REVIEW_KEY     (admin page)
        ?email=..&tc=TEACHERCODE     (teacher's device)
        -> every child's latest progress for that key. */
import { json, preflight, teacherCodeFor, tidy } from "../_lib.js";

export const onRequestOptions = () => preflight();

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: true, pending: true });
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  const device = String(b.device || "").slice(0, 40);
  if (!email || email.indexOf("@") < 0 || !device) return json({ ok: false, error: "email/device required" }, 400);
  const kids = Array.isArray(b.children) ? b.children.slice(0, 60) : [];
  const now = new Date().toISOString();
  const s = (v, n) => (v == null ? null : String(v).slice(0, n));
  const i = (v) => (Number.isFinite(+v) ? Math.max(0, +v | 0) : 0);
  try {
    for (const c of kids) {
      await env.DB.prepare(
        `INSERT INTO progress (email, device, child_hash, child_name, level, xp, stars, streak, accuracy, asked, correct,
           areas_json, weak_json, badges, last_practised, app_version, updated)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON CONFLICT(email, device, child_hash) DO UPDATE SET
           child_name=excluded.child_name, level=excluded.level, xp=excluded.xp, stars=excluded.stars,
           streak=excluded.streak, accuracy=excluded.accuracy, asked=excluded.asked, correct=excluded.correct,
           areas_json=excluded.areas_json, weak_json=excluded.weak_json, badges=excluded.badges,
           last_practised=excluded.last_practised, app_version=excluded.app_version, updated=excluded.updated`
      ).bind(
        email, device, s(c.hash, 32) || "?", s(c.name, 60),
        i(c.level), i(c.xp), i(c.stars), i(c.streak), Math.min(100, i(c.accuracy)), i(c.asked), i(c.correct),
        JSON.stringify(c.areas && typeof c.areas === "object" ? c.areas : {}),
        JSON.stringify(Array.isArray(c.weak) ? c.weak.slice(0, 20).map((w) => String(w).slice(0, 60)) : []),
        i(c.badges), s(c.lastPractised, 20), s(b.appVersion, 20), now,
      ).run();
    }
  } catch (e) { return json({ ok: false, error: "write failed (run schema-1.9.sql?)" }, 500); }
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: true, children: [], pending: true });
  const p = new URL(request.url).searchParams;
  const email = String(p.get("email") || "").trim().toLowerCase();
  if (!email) return json({ ok: false, error: "email required" }, 400);
  const adminKey = p.get("key") || request.headers.get("x-review-key");
  const tc = tidy(p.get("tc") || "");
  let allowed = false;
  if (adminKey && env.REVIEW_KEY && adminKey === env.REVIEW_KEY) allowed = true;
  else if (tc && env.LICENCE_SECRET) {
    try { allowed = tidy(await teacherCodeFor(email, env.LICENCE_SECRET)) === tc; } catch (e) {}
  }
  if (!allowed) return json({ ok: false, error: "unauthorized" }, 401);
  try {
    const rows = ((await env.DB.prepare(
      "SELECT * FROM progress WHERE email = ? ORDER BY child_name, updated DESC"
    ).bind(email).all()).results) || [];
    const parse = (t, d) => { try { return JSON.parse(t || ""); } catch { return d; } };
    return json({
      ok: true, email,
      children: rows.map((r) => ({
        device: r.device, hash: r.child_hash, name: r.child_name, level: r.level, xp: r.xp, stars: r.stars,
        streak: r.streak, accuracy: r.accuracy, asked: r.asked, correct: r.correct,
        areas: parse(r.areas_json, {}), weak: parse(r.weak_json, []), badges: r.badges,
        lastPractised: r.last_practised, appVersion: r.app_version, updated: r.updated,
      })),
    });
  } catch (e) {
    return json({ ok: true, children: [], pending: "Run functions/schema-1.9.sql in the D1 console." });
  }
}
