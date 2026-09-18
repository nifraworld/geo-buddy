/* v2.3: resolve the curated landmarks (scripts/landmarks-list.mjs) against
   Wikidata — item id, coordinates (P625), image (P18) — and Wikimedia Commons
   for the photo's thumbnail URL, author and licence. Writes
   .cache/landmarks.json keyed by landmark id. Run with `npm run landmarks`.
   Re-runs only look up entries that are missing or lack a photo/coords. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WORLD_LANDMARKS, BD_LANDMARKS } from "./landmarks-list.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(root, ".cache");
const OUT = path.join(CACHE, "landmarks.json");
const UA = "GeoBuddy/2.3 (https://geobuddy.nifraworld.com; educational PWA)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripTags = (h) => String(h || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const BAD_FILE = /\b(map|locator|flag|coat[_ ]of[_ ]arms|emblem|seal|logo|montage|collage|portrait|plan|diagram|\.svg|\.gif)\b/i;
const BAD_PEOPLE = /\b(minister|ambassador|visit|family|speech|meeting|conference|ceremony|award|team|students?|people|festival|rally|election|wedding|a man|a woman|girl|boy|selfie|tourists?)\b/i;
const okFile = (f) => f && !BAD_FILE.test(f) && !BAD_PEOPLE.test(f.replace(/[_.]/g, " "));

async function wd(params) {
  const res = await fetch("https://www.wikidata.org/w/api.php?format=json&" + params, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("wikidata " + res.status);
  return res.json();
}
async function findItem(l) {
  if (l.q) return l.q;
  const j = await wd("action=wbsearchentities&language=en&limit=8&search=" + encodeURIComponent(l.wd || l.en));
  const hits = j.search || [];
  // prefer an exact label match that is not a film / song / disambiguation
  const good = hits.filter((h) => !/film|song|album|disambiguation|novel|band|video game|painting|person|footballer|actor|singer|politician/i.test(h.description || ""));
  // a landmark is a place: take the first candidate whose coordinates (P625)
  // fall inside its own country ("Petra" alone finds a street in Hamburg)
  for (const h of good.slice(0, 6)) {
    const j2 = await wd("action=wbgetclaims&property=P625&entity=" + h.id);
    const v = j2.claims && j2.claims.P625 && j2.claims.P625[0].mainsnak?.datavalue?.value;
    if (v && inCountry(l, v.latitude, v.longitude)) return h.id;
    await sleep(60);
  }
  return l.lat != null ? (good[0] || {}).id || null : null; // hand-supplied coords: the item itself has none
}
const all = [...WORLD_LANDMARKS.map((l) => ({ ...l, scope: "world" })), ...BD_LANDMARKS.map((l) => ({ ...l, scope: "bd" }))];
const countries = JSON.parse(fs.readFileSync(path.join(CACHE, "countries.json"), "utf8"));
const BIG = new Set(["RUS", "CAN", "USA", "CHN", "BRA", "AUS", "IND", "ARG", "KAZ", "DZA", "COD", "SAU", "MEX", "IDN", "CHL", "FRA"]);
function inCountry(l, lat, lng) {
  if (l.scope === "bd" || /^[a-z]/.test(l.c)) return lat > 20.5 && lat < 26.8 && lng > 88 && lng < 92.8;
  const c = countries.find((x) => x.cca3 === l.c);
  if (!c || !c.latlng) return true;
  const d = Math.hypot(lat - c.latlng[0], (lng - c.latlng[1]) * Math.cos(lat * Math.PI / 180)) * 111; // km, rough
  return d < (BIG.has(l.c) ? 4500 : 1800);
}
async function claims(qid) {
  const j = await wd("action=wbgetclaims&entity=" + qid);
  const c = j.claims || {};
  const val = (p) => (c[p] || []).map((x) => x.mainsnak?.datavalue?.value).filter((v) => v != null);
  const coord = val("P625")[0];
  return { images: val("P18"), coord: coord ? { lat: coord.latitude, lng: coord.longitude } : null, cats: val("P373"), label: null };
}
async function categoryFiles(cat) {
  const res = await fetch("https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtype=file&cmlimit=30&cmtitle=" + encodeURIComponent("Category:" + cat), { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.query?.categorymembers || []).map((m) => m.title.replace(/^File:/, "")).filter((f) => /[.](jpe?g|png|webp)$/i.test(f));
}
async function lookup(file, curated = false) {
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=900&titles=" + encodeURIComponent("File:" + file.replace(/ /g, "_"));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const page = Object.values((await res.json()).query?.pages || {})[0];
  if (!page || page.missing !== undefined || !page.imageinfo?.[0]) return null;
  const info = page.imageinfo[0];
  if (!curated && info.width && info.height && info.width < info.height * 0.6) return null; // category finds: prefer landscape; P18 is editor-chosen
  const m = info.extmetadata || {};
  const get = (k) => (m[k] ? stripTags(m[k].value) : "");
  return { file, url: info.thumburl || info.url, page: info.descriptionurl, artist: (get("Artist") || get("Credit") || "Wikimedia Commons").slice(0, 80), license: get("LicenseShortName") || get("UsageTerms") || "See file page" };
}

const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
for (const [k, v] of Object.entries(out)) {
  const l = all.find((x) => x.id === k);
  if (!l || !v.coord || !v.photo || !inCountry(l, v.coord.lat, v.coord.lng)) delete out[k]; // redo anything incomplete or misplaced
  else if (l && l.file && !l.file.includes(v.photo.file)) delete out[k]; // a hand-picked photo was added since
}
let n = 0;
for (const l of all) {
  const cur = out[l.id];
  if (cur && cur.qid && cur.coord && cur.photo) continue;
  try {
    const qid = (cur && cur.qid) || await findItem(l);
    if (!qid) { console.warn("  ? no item:", l.en); continue; }
    const c = await claims(qid);
    if (!c.coord && l.lat != null) c.coord = { lat: l.lat, lng: l.lng }; // hand-supplied when the item has none
    let photo = null;
    const cands = [...(l.file || []), ...c.images.filter(okFile)]; // hand-picked files first
    if (!cands.length) for (const cat of c.cats.slice(0, 1)) { const files = await categoryFiles(cat); const re = new RegExp(l.en.split(/[ ,]/)[0], "i"); cands.push(...files.filter(okFile).sort((a, b) => (re.test(b) ? 1 : 0) - (re.test(a) ? 1 : 0)).slice(0, 5)); }
    for (const f of cands) { photo = await lookup(f, c.images.includes(f) || (l.file || []).includes(f)); if (photo) break; await sleep(60); }
    out[l.id] = { qid, coord: c.coord, photo, scope: l.scope };
    n++;
    console.log(`  ${l.id}: ${qid} ${c.coord ? "📍" : "no-coord"} ${photo ? "🖼 " + photo.file : "no-photo"}`);
    if (n % 20 === 0) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  } catch (e) { console.warn(`  ! ${l.id}: ${e.message}`); }
  await sleep(120);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const done = Object.values(out);
console.log(`landmarks: ${done.length}/${all.length} resolved, ${done.filter((x) => x.photo).length} with photo, ${done.filter((x) => x.coord).length} with coordinates`);
console.log("  missing photo:", all.filter((l) => !out[l.id]?.photo).map((l) => l.id).join(", ") || "none");
console.log("  missing coord:", all.filter((l) => !out[l.id]?.coord).map((l) => l.id).join(", ") || "none");
