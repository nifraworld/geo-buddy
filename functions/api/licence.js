/* GET /api/licence?email=..&device=..&ak=..&tc=..
   The app calls this on launch. Returns THIS device's status on the key
   (full / grace / free / revoked), the plan, the packages the key unlocks,
   and whether the supplied teacher code (tc) is valid.

   `ak` is the stored activation key: when present and valid, `akValid` is
   true and `packages` is authoritative (the app then trusts it fully,
   including a shorter list than before). Fail-open: on any error the device
   is treated as full. */
import { json, preflight, teacherCodeFor, tidy, rankDevices, packageForKey, mergePackages } from "../_lib.js";

export const onRequestOptions = () => preflight();

export async function onRequestGet({ request, env }) {
  const p = new URL(request.url).searchParams;
  const email = String(p.get("email") || "").trim().toLowerCase();
  const device = String(p.get("device") || "").slice(0, 40);
  const tc = tidy(p.get("tc") || "");
  const ak = p.get("ak") || "";
  if (!email || email.indexOf("@") < 0) return json({ ok: false, error: "email required" }, 400);

  let isTeacher = false;
  if (tc && env.LICENCE_SECRET) {
    try { isTeacher = tidy(await teacherCodeFor(email, env.LICENCE_SECRET)) === tc; } catch (e) {}
  }

  /* the key can be checked without the database — do it first so the answer
     is right even if D1 is unavailable */
  let akPkg = null;
  if (ak && env.LICENCE_SECRET) {
    try { akPkg = await packageForKey(email, ak, env.LICENCE_SECRET); } catch (e) {}
  }
  const akPackages = akPkg ? (akPkg === "bundle" ? ["bundle"] : [akPkg]) : [];

  if (!env.DB) {
    return json({
      ok: true, status: "full", plan: "Home", deviceLimit: 3, deviceCount: 0,
      revoked: false, isTeacher, akValid: !!akPkg, packages: mergePackages(akPackages), pending: true,
    });
  }

  try {
    const plan = await env.DB.prepare(
      "SELECT device_limit, plan, grace_days, revoked, packages FROM plans WHERE email = ?"
    ).bind(email).first();
    const limit = plan ? plan.device_limit : 3;
    const graceDays = plan ? plan.grace_days : 30;
    const revoked = plan ? !!plan.revoked : false;
    let planPackages = [];
    try { planPackages = JSON.parse(plan && plan.packages ? plan.packages : "[]"); }
    catch (e) { planPackages = []; }
    if (!Array.isArray(planPackages)) planPackages = [];

    const packages = mergePackages(akPackages.concat(planPackages));

    const rows = ((await env.DB.prepare(
      "SELECT device, first_seen, grace_until, override FROM devices WHERE email = ?"
    ).bind(email).all()).results) || [];

    const now = new Date().toISOString();
    const { devices, writes } = rankDevices(rows, limit, graceDays, now);
    for (const w of writes) {
      await env.DB.prepare("UPDATE devices SET grace_until = ? WHERE email = ? AND device = ?")
        .bind(w.grace_until, email, w.device).run();
    }

    const me = devices.find((d) => d.device === device);
    const status = revoked ? "revoked" : (me ? me.status : "full");

    return json({
      ok: true,
      email, status, isTeacher, revoked,
      akValid: !!akPkg,
      packages,
      plan: plan ? plan.plan : "Home",
      deviceLimit: limit,
      deviceCount: devices.length,
      graceUntil: me && me.status === "grace" ? me.grace_until : null,
    });
  } catch (e) {
    return json({
      ok: true, status: "full", plan: "Home", deviceLimit: 3, deviceCount: 0,
      revoked: false, isTeacher, akValid: !!akPkg, packages: mergePackages(akPackages), pending: true,
    });
  }
}