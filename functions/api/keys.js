/* /api/keys — the admin page's data endpoint. Gated by REVIEW_KEY
   (header x-review-key or ?key=).

   GET                      -> every customer (plans ∪ devices): plan, key for
                               their scope, teacher code, devices with status
   POST { action: "make", email, scope?, phone?, note?, device_limit?, plan? }
                            -> derive the key server-side (LICENCE_SECRET never
                               leaves Cloudflare), upsert the customer row,
                               return { key, teacher_code }
   POST { action: "check", email, key }   -> { valid, scope }
   POST { action: "customer", email, phone?, paid?, amount?, pay_via?, note?,
          device_limit?, plan?, grace_days?, revoked?, packages?, scope? }
                            -> update those fields only
   POST { action: "delete", email }       -> remove plan + device rows
   POST { email, device, override }       -> per-device override (legacy shape)
   POST { email, device_limit, ... }      -> set the plan (legacy shape) */
import { json, preflight, teacherCodeFor, rankDevices, keyForEntry, packageForKey } from "../_lib.js";

export const onRequestOptions = () => preflight();

const ALLOWED = ["bd", "wr", "bundle"];
const SCOPES = ["bundle", "bd", "wr"];

export async function onRequest({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "backend not set up yet" }, 503);
  const url = new URL(request.url);
  const key = request.headers.get("x-review-key") || url.searchParams.get("key");
  if (!env.REVIEW_KEY || key !== env.REVIEW_KEY) return json({ ok: false, error: "unauthorized" }, 401);

  if (request.method === "GET") return list(env);
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);

  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  if (!email || email.indexOf("@") < 0) return json({ ok: false, error: "email required" }, 400);
  const now = new Date().toISOString();

  if (b.action === "make") {
    if (!env.LICENCE_SECRET) return json({ ok: false, error: "LICENCE_SECRET not set" }, 503);
    const scope = SCOPES.includes(b.scope) ? b.scope : "bundle";
    const limit = clampInt(b.device_limit, 1, 99999, 3);
    const plan = String(b.plan || planName(limit)).slice(0, 40);
    const packages = JSON.stringify(scope === "bundle" ? ["bundle"] : [scope]);
    await env.DB.prepare(
      `INSERT INTO plans (email, device_limit, plan, packages, scope, phone, note, created, updated)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(email) DO UPDATE SET
         device_limit = excluded.device_limit, plan = excluded.plan, packages = excluded.packages,
         scope = excluded.scope, updated = excluded.updated,
         phone = COALESCE(NULLIF(excluded.phone, ''), plans.phone),
         note  = COALESCE(NULLIF(excluded.note, ''), plans.note)`
    ).bind(email, limit, plan, packages, scope, str(b.phone, 40), str(b.note, 500), now, now).run();
    return json({
      ok: true, email, scope, plan, device_limit: limit,
      key: await keyForEntry(email, scope, env.LICENCE_SECRET),
      teacher_code: await teacherCodeFor(email, env.LICENCE_SECRET),
    });
  }

  if (b.action === "check") {
    if (!env.LICENCE_SECRET) return json({ ok: false, error: "LICENCE_SECRET not set" }, 503);
    const scope = await packageForKey(email, b.key, env.LICENCE_SECRET);
    return json({ ok: true, valid: !!scope, scope, bundleKey: await keyForEntry(email, "bundle", env.LICENCE_SECRET) });
  }

  if (b.action === "customer") {
    const sets = [], vals = [];
    const put = (col, v) => { sets.push(col + " = ?"); vals.push(v); };
    if (b.phone !== undefined) put("phone", str(b.phone, 40));
    if (b.paid !== undefined) put("paid", b.paid ? 1 : 0);
    if (b.amount !== undefined) put("amount", str(b.amount, 40));
    if (b.pay_via !== undefined) put("pay_via", str(b.pay_via, 20));
    if (b.note !== undefined) put("note", str(b.note, 500));
    if (b.device_limit !== undefined) put("device_limit", clampInt(b.device_limit, 1, 99999, 3));
    if (b.plan !== undefined) put("plan", String(b.plan || "Home").slice(0, 40));
    if (b.grace_days !== undefined) put("grace_days", clampInt(b.grace_days, 0, 365, 30));
    if (b.revoked !== undefined) put("revoked", b.revoked ? 1 : 0);
    if (b.packages !== undefined) put("packages", JSON.stringify(normalisePackages(b.packages)));
    if (b.scope !== undefined) put("scope", SCOPES.includes(b.scope) ? b.scope : "bundle");
    if (!sets.length) return json({ ok: false, error: "nothing to update" }, 400);
    put("updated", now);
    // upsert: create the row if the customer was only ever seen through /api/activate
    await env.DB.prepare("INSERT OR IGNORE INTO plans (email, created, updated) VALUES (?,?,?)").bind(email, now, now).run();
    await env.DB.prepare(`UPDATE plans SET ${sets.join(", ")} WHERE email = ?`).bind(...vals, email).run();
    return json({ ok: true });
  }

  if (b.action === "delete") {
    await env.DB.prepare("DELETE FROM devices WHERE email = ?").bind(email).run();
    await env.DB.prepare("DELETE FROM plans WHERE email = ?").bind(email).run();
    return json({ ok: true });
  }

  if (b.device !== undefined) {                       // per-device override (legacy)
    const ov = b.override === "full" || b.override === "free" ? b.override : null;
    await env.DB.prepare("UPDATE devices SET override = ?, grace_until = NULL WHERE email = ? AND device = ?")
      .bind(ov, email, String(b.device).slice(0, 40)).run();
    return json({ ok: true });
  }

  // legacy: set the plan
  const limit = clampInt(b.device_limit, 1, 99999, 3);
  const plan = String(b.plan || "Home").slice(0, 40);
  const grace = clampInt(b.grace_days, 0, 365, 30);
  const revoked = b.revoked ? 1 : 0;
  const note = str(b.note, 500);
  const packages = JSON.stringify(normalisePackages(b.packages));
  await env.DB.prepare(
    `INSERT INTO plans (email, device_limit, plan, grace_days, packages, revoked, note, created, updated)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(email) DO UPDATE SET
       device_limit = excluded.device_limit, plan = excluded.plan,
       grace_days = excluded.grace_days, packages = excluded.packages,
       revoked = excluded.revoked, note = excluded.note, updated = excluded.updated`
  ).bind(email, limit, plan, grace, packages, revoked, note, now, now).run();
  return json({ ok: true });
}

async function list(env) {
  let devs, plans;
  try {
    devs = ((await env.DB.prepare(
      "SELECT email, device, first_seen, last_seen, child_n, app_version, grace_until, override FROM devices ORDER BY email, first_seen"
    ).all()).results) || [];
    plans = ((await env.DB.prepare("SELECT * FROM plans").all()).results) || [];
  } catch (e) {
    return json({ ok: true, keys: [], pending: "Run functions/schema.sql (fresh) or functions/migrate-1.8.sql (existing) in the D1 console." });
  }
  const planBy = {};
  for (const p of plans) planBy[p.email] = p;
  const byEmail = {};
  for (const d of devs) (byEmail[d.email] || (byEmail[d.email] = [])).push(d);
  const emails = new Set([...Object.keys(planBy), ...Object.keys(byEmail)]);

  const now = new Date().toISOString();
  const keys = [];
  for (const email of emails) {
    const p = planBy[email] || {};
    const limit = p.device_limit != null ? p.device_limit : 3;
    const graceDays = p.grace_days != null ? p.grace_days : 30;
    const scope = SCOPES.includes(p.scope) ? p.scope : "bundle";
    const { devices } = rankDevices(byEmail[email] || [], limit, graceDays, now);
    keys.push({
      email,
      plan: p.plan || "Home",
      device_limit: limit,
      grace_days: graceDays,
      packages: parsePackages(p.packages),
      scope,
      revoked: !!p.revoked,
      note: p.note || "",
      phone: p.phone || "",
      paid: !!p.paid,
      amount: p.amount || "",
      pay_via: p.pay_via || "",
      created: p.created || (devices[0] && devices[0].first_seen) || "",
      key: env.LICENCE_SECRET ? await keyForEntry(email, scope, env.LICENCE_SECRET) : "(set LICENCE_SECRET)",
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
  keys.sort((a, b) => (b.over - a.over) || ((b.created || "") < (a.created || "") ? -1 : 1));
  return json({ ok: true, keys });
}

function str(v, max) { return String(v == null ? "" : v).slice(0, max); }
function clampInt(v, lo, hi, dflt) { const n = parseInt(v, 10); return isNaN(n) ? dflt : Math.max(lo, Math.min(hi, n)); }
function planName(limit) { return limit <= 3 ? "Home" : limit <= 10 ? "Family" : "Coaching"; }
function parsePackages(raw) {
  let out = [];
  try { out = JSON.parse(raw || "[]"); } catch (e) { out = []; }
  return Array.isArray(out) ? out.filter((p) => ALLOWED.includes(p)) : [];
}
function normalisePackages(input) {
  if (!Array.isArray(input)) return [];
  if (input.includes("bundle")) return ["bundle"];
  return ALLOWED.filter((p) => input.includes(p) && p !== "bundle");
}
