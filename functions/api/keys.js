/* /api/keys  — the admin page's "Devices & plans" section.
     GET  ?key=REVIEW_KEY        -> every key that has activated, its plan,
                                    its teacher code, and every device with status
     POST ?key=REVIEW_KEY  body:
       { email, device_limit?, plan?, grace_days?, revoked?, note? }   -> set the plan
       { email, device, override }  where override in 'full' | 'free' | 'clear'
   Gated by REVIEW_KEY. */
import { json, preflight, teacherCodeFor, rankDevices } from "../_lib.js";

export const onRequestOptions = () => preflight();

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "backend not set up yet" }, 503);
  const url = new URL(request.url);
  const key = request.headers.get("x-review-key") || url.searchParams.get("key");
  if (!env.REVIEW_KEY || key !== env.REVIEW_KEY) return json({ ok: false, error: "unauthorized" }, 401);

  if (request.method === "GET") {
    let devs, plans;
    try {
      devs = ((await env.DB.prepare(
        "SELECT email, device, first_seen, last_seen, child_n, app_version, grace_until, override FROM devices ORDER BY email, first_seen"
      ).all()).results) || [];
      plans = ((await env.DB.prepare(
        "SELECT email, device_limit, plan, grace_days, revoked, note, packages FROM plans"
      ).all()).results) || [];
    } catch (e) {
      return json({ ok: true, keys: [], pending: "Re-run functions/schema.sql in the D1 console." });
    }
    const planBy = {};
    for (const p of plans) planBy[p.email] = p;

    const byEmail = {};
    for (const d of devs) (byEmail[d.email] || (byEmail[d.email] = [])).push(d);

    const now = new Date().toISOString();
    const keys = [];
    for (const email of Object.keys(byEmail)) {
      const p = planBy[email] || {};
      const limit = p.device_limit != null ? p.device_limit : 3;
      const graceDays = p.grace_days != null ? p.grace_days : 30;
      const { devices } = rankDevices(byEmail[email], limit, graceDays, now);
      keys.push({
        email,
        plan: p.plan || "Home",
        device_limit: limit,
        grace_days: graceDays,
        packages: parsePackages(p.packages),
        revoked: !!p.revoked,
        note: p.note || "",
        teacher_code: env.LICENCE_SECRET ? await teacherCodeFor(email, env.LICENCE_SECRET) : "(set LICENCE_SECRET)",
        deviceCount: devices.length,
        over: devices.length > limit,
        devices: devices.map((d) => ({
          device: d.device, status: d.status, rank: d.rank,
          first_seen: d.first_seen, last_seen: d.last_seen,
          child_n: d.child_n, app_version: d.app_version,
          grace_until: d.grace_until, override: d.override,
        })),
      });
    }
    keys.sort((a, b) => (b.over - a.over) || (a.email < b.email ? -1 : 1));
    return json({ ok: true, keys });
  }

  if (request.method === "POST") {
    let b;
    try { b = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
    const email = String(b.email || "").trim().toLowerCase();
    if (!email || email.indexOf("@") < 0) return json({ ok: false, error: "email required" }, 400);

    if (b.device !== undefined) {                       // per-device override
      const ov = b.override === "full" || b.override === "free" ? b.override : null;
      await env.DB.prepare("UPDATE devices SET override = ?, grace_until = NULL WHERE email = ? AND device = ?")
        .bind(ov, email, String(b.device).slice(0, 40)).run();
      return json({ ok: true });
    }

    const limit = Math.max(1, Math.min(99999, parseInt(b.device_limit, 10) || 3));
    const plan = String(b.plan || "Home").slice(0, 40);
    const grace = Math.max(0, Math.min(365, parseInt(b.grace_days, 10)));
    const revoked = b.revoked ? 1 : 0;
    const note = String(b.note || "").slice(0, 500);
    const packages = JSON.stringify(normalisePackages(b.packages));
    await env.DB.prepare(
      `INSERT INTO plans (email, device_limit, plan, grace_days, packages, revoked, note, updated)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(email) DO UPDATE SET
         device_limit = excluded.device_limit, plan = excluded.plan,
         grace_days = excluded.grace_days, packages = excluded.packages,
         revoked = excluded.revoked, note = excluded.note, updated = excluded.updated`
    ).bind(email, limit, plan, isNaN(grace) ? 30 : grace, packages, revoked, note, new Date().toISOString()).run();
    return json({ ok: true });
  }

  return json({ ok: false, error: "method not allowed" }, 405);
}

const ALLOWED = ["bd", "wr", "bundle"];
function parsePackages(raw) {
  let out = [];
  try { out = JSON.parse(raw || "[]"); } catch (e) { out = []; }
  return Array.isArray(out) ? out.filter((p) => ALLOWED.includes(p)) : [];
}
function normalisePackages(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  if (input.includes("bundle")) return ["bundle"];
  for (const p of ALLOWED) if (input.includes(p)) out.push(p);
  return out;
}