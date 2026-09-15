/* Shared helpers for the Pages Functions. */

export const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-review-key",
};
export const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...cors } });
export const preflight = () => new Response(null, { headers: cors });

export async function sha256hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Same shape as the licence key, different salt. TP-XXXX-XXXX. */
const ALPHA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export async function teacherCodeFor(email, secret) {
  const h = await sha256hex((secret || "") + "|teacher|" + String(email || "").trim().toLowerCase());
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHA.charAt(parseInt(h.substr(i * 2, 2), 16) % 32);
  return "TP-" + out.slice(0, 4) + "-" + out.slice(4, 8);
}
export const tidy = (s) => String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, "");

/* ---- activation keys ----
   The secret that makes a key lives only here (env LICENCE_SECRET) and in the
   private key generator — never in the app or the page source. A key can't be
   worked out from the shipped files, and the same email always produces the
   same key, so a lost key is recovered by typing the email again. */
const PACKAGE_IDS = ["bd", "wr"];
export async function keyForEntry(email, pkgId, secret) {
  const salt = pkgId === "bundle" ? (secret || "") : (secret || "") + "|package:" + pkgId;
  const h = await sha256hex(salt + "|" + String(email || "").trim().toLowerCase());
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHA.charAt(parseInt(h.substr(i * 2, 2), 16) % 32);
  return "GB-" + (pkgId === "bundle" ? "" : pkgId.toUpperCase() + "-") + out.slice(0, 4) + "-" + out.slice(4, 8);
}
/* Which package a typed key unlocks for this email — "bundle" | "bd" | "wr",
   or null if it matches nothing. */
export async function packageForKey(email, key, secret) {
  const k = tidy(key);
  if (!email || !k || !secret) return null;
  if (tidy(await keyForEntry(email, "bundle", secret)) === k) return "bundle";
  for (const id of PACKAGE_IDS) {
    if (tidy(await keyForEntry(email, id, secret)) === k) return id;
  }
  return null;
}
export const PACKAGE_SET = ["bd", "wr", "bundle"];
export function mergePackages(list) {
  const out = [];
  for (const p of list || []) if (PACKAGE_SET.includes(p) && out.indexOf(p) < 0) out.push(p);
  return out.indexOf("bundle") >= 0 ? ["bundle"] : out;
}

/* Give each device on a key a status. Devices are ranked by first_seen;
   ones past the plan limit get a grace window, then drop to free.
   Owner overrides ('full' / 'free') always win. Returns the rows annotated
   with { status, rank } and may set grace_until on rows that need it. */
export function rankDevices(rows, deviceLimit, graceDays, nowISO) {
  const now = Date.parse(nowISO);
  const sorted = rows.slice().sort((a, b) => (a.first_seen < b.first_seen ? -1 : 1));
  const writes = [];
  sorted.forEach((r, i) => {
    r.rank = i + 1;
    if (r.override === "full") { r.status = "full"; return; }
    if (r.override === "free") { r.status = "free"; return; }
    if (r.rank <= deviceLimit) { r.status = "full"; return; }
    let until = r.grace_until ? Date.parse(r.grace_until) : null;
    if (!until) {
      until = now + (graceDays || 30) * 86400000;
      r.grace_until = new Date(until).toISOString();
      writes.push({ device: r.device, grace_until: r.grace_until });
    }
    r.status = now < until ? "grace" : "free";
  });
  return { devices: sorted, writes };
}