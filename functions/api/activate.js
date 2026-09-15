/* POST /api/activate   { email, key, device?, appVersion? }

   The app calls this when someone enters an activation key. The server
   checks the key against LICENCE_SECRET (which is NOT in the app) and
   answers with the packages it unlocks (bd / wr / bundle) plus the plan
   and device limit recorded for the email. First activation needs one
   online moment; after that the app runs offline on what it stored.

   Fail-soft: if the D1 database is unavailable the key is still checked
   and the entitlement returned — only the device census / plan lookup is
   skipped. A revoked key is refused. */
import { json, preflight, packageForKey, mergePackages } from "../_lib.js";

export const onRequestOptions = () => preflight();

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false, error: "bad json" }, 400); }
  const email = String(b.email || "").trim().toLowerCase();
  const key = String(b.key || "");
  const device = String(b.device || "").slice(0, 40);
  if (!email || email.indexOf("@") < 0 || !key)
    return json({ ok: false, error: "email and key required" }, 400);
  if (!env.LICENCE_SECRET)
    return json({ ok: false, error: "server not configured" }, 503);

  const pkg = await packageForKey(email, key, env.LICENCE_SECRET);
  if (!pkg) return json({ ok: false, error: "no match" });

  let packages = pkg === "bundle" ? ["bundle"] : [pkg];
  let plan = "Home", deviceLimit = 3;

  if (env.DB) {
    const now = new Date().toISOString();
    try {
      if (device) {
        await env.DB.prepare(
          `INSERT INTO devices (email, device, first_seen, last_seen, child_n, app_version)
           VALUES (?,?,?,?,0,?)
           ON CONFLICT(email, device) DO UPDATE SET
             last_seen = excluded.last_seen, app_version = excluded.app_version`
        ).bind(email, device, now, now, String(b.appVersion || "").slice(0, 20)).run();
      }

      const row = await env.DB.prepare(
        "SELECT device_limit, plan, revoked, packages FROM plans WHERE email = ?"
      ).bind(email).first();

      if (row && row.revoked) return json({ ok: false, error: "revoked", revoked: true });

      if (row) {
        plan = row.plan || "Home";
        deviceLimit = row.device_limit != null ? row.device_limit : 3;
        let extra = [];
        try { extra = JSON.parse(row.packages || "[]"); } catch (e) { extra = []; }
        packages = mergePackages(packages.concat(Array.isArray(extra) ? extra : []));
      }

      /* remember the entitlement so any later /api/licence check returns the
         full set even though the app only stores one key */
      await env.DB.prepare(
        `INSERT INTO plans (email, packages, updated) VALUES (?,?,?)
         ON CONFLICT(email) DO UPDATE SET packages = excluded.packages, updated = excluded.updated`
      ).bind(email, JSON.stringify(packages), now).run();
    } catch (e) {
      /* schema not migrated, or a transient D1 error — fall through with the
         key-only entitlement, which is still correct */
    }
  }

  return json({ ok: true, pkg, packages, plan, deviceLimit });
}