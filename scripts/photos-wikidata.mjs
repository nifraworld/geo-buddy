/* v2.1: one photo per country, capital and Bangladesh district from Wikidata's
   "image" property (P18), resolved against Wikimedia Commons for the thumbnail
   URL, author and licence. Writes .cache/photos-world.json (keyed "c:<id>" and
   "cap:<id>") and .cache/photos-districts.json (keyed by district id).
   Run with `npm run photos:wd`. Online only; the app never bundles the images.
   Policy: landscapes, buildings and skylines only — P18 on a place is nearly
   always that; anything that looks like a person, map or emblem is skipped. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DISTRICTS } from "./districts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(root, ".cache");
const UA = "GeoBuddy/2.1 (https://geobuddy.nifraworld.com; educational PWA)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const stripTags = (html) => String(html || "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/* things P18 sometimes is that we don't want as "the photo" */
const BAD_FILE = /\b(map|locator|flag|coat[_ ]of[_ ]arms|emblem|seal|logo|montage|collage|portrait|\.svg|\.gif)\b/i;
/* filenames that smell of people, events or animals (category fallback only) — policy: places, not people */
const BAD_PEOPLE = /\b(minister|ambassador|visit|family|speech|meeting|conference|ceremony|award|team|students?|people|festival|rally|election|MP|MLA|PID|wedding|birthday|a man|a woman|girl|boy|goat|cow|bird|wagtail|lark|sparrow|duck|dog|cat)\b/i;

async function sparql(query) {
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), { headers: { "User-Agent": UA, Accept: "application/sparql-results+json" } });
  if (!res.ok) throw new Error("SPARQL HTTP " + res.status);
  return (await res.json()).results.bindings;
}
const fileOf = (uri) => decodeURIComponent(String(uri).replace(/^.*Special:FilePath\//, "")).replace(/_/g, " ");

async function lookup(file) {
  const title = "File:" + file.replace(/ /g, "_");
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=900&titles=" + encodeURIComponent(title);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const json = await res.json();
  const page = Object.values(json.query?.pages || {})[0];
  if (!page || page.missing !== undefined || !page.imageinfo?.[0]) return null;
  const info = page.imageinfo[0];
  const m = info.extmetadata || {};
  const get = (k) => (m[k] ? stripTags(m[k].value) : "");
  if (info.width && info.height && info.width < info.height * 0.9) return null; // portrait framing → likely a person or poster
  return {
    file, url: info.thumburl || info.url, page: info.descriptionurl, width: info.thumbwidth || info.width, height: info.thumbheight || info.height,
    artist: (get("Artist") || get("Credit") || "Wikimedia Commons").slice(0, 80),
    license: get("LicenseShortName") || get("UsageTerms") || "See file page",
    licenseUrl: m.LicenseUrl ? m.LicenseUrl.value : "",
  };
}

async function resolveMany(candidates, label) {
  // candidates: { key: [file, file…] }
  const out = {};
  let n = 0;
  for (const [key, files] of Object.entries(candidates)) {
    out[key] = null;
    for (const f of files.filter(Boolean)) {
      if (BAD_FILE.test(f)) continue;
      try { out[key] = await lookup(f); } catch (e) { console.warn(`  ! ${key}: ${f} — ${e.message}`); }
      if (out[key]) break;
      await sleep(80);
    }
    n++;
    if (n % 25 === 0) console.log(`  ${label}: ${n}/${Object.keys(candidates).length}`);
    await sleep(60);
  }
  return out;
}

const countries = JSON.parse(fs.readFileSync(path.join(CACHE, "countries.json"), "utf8")).filter((c) => c.unMember);
const byIso3 = new Map(countries.map((c) => [c.cca3, c]));

const ONLY = process.argv[2] || "all"; // "world" | "districts" | "all"
if (ONLY !== "districts") {
console.log("wikidata: countries + capitals…");
const rows = await sparql(`
SELECT ?iso ?img ?capLabel ?capImg WHERE {
  ?c wdt:P298 ?iso .
  OPTIONAL { ?c wdt:P18 ?img . }
  OPTIONAL { ?c wdt:P36 ?cap . OPTIONAL { ?cap wdt:P18 ?capImg . } ?cap rdfs:label ?capLabel FILTER(LANG(?capLabel) = "en") }
}`);
const cCand = {}, capCand = {};
for (const r of rows) {
  const c = byIso3.get(r.iso.value);
  if (!c) continue;
  const id = String(c.ccn3).padStart(3, "0");
  (cCand["c:" + id] ||= []).push(r.img ? fileOf(r.img.value) : null);
  if (r.capImg) (capCand["cap:" + id] ||= []).push(fileOf(r.capImg.value));
}
for (const c of countries) { const id = String(c.ccn3).padStart(3, "0"); cCand["c:" + id] ||= []; capCand["cap:" + id] ||= []; }
console.log(`  ${Object.values(cCand).filter((a) => a.some(Boolean)).length} country images, ${Object.values(capCand).filter((a) => a.length).length} capital images from Wikidata`);
for (const files of [...Object.values(cCand), ...Object.values(capCand)]) {
  const keep = files.filter((f) => !f || !BAD_PEOPLE.test(f.replace(/[_.]/g, " ")));
  files.length = 0; files.push(...keep);
}
const world = { ...(await resolveMany(cCand, "countries")), ...(await resolveMany(capCand, "capitals")) };
fs.writeFileSync(path.join(CACHE, "photos-world.json"), JSON.stringify(world, null, 1));
console.log(`photos-world.json: ${Object.values(world).filter(Boolean).length}/${Object.keys(world).length} resolved`);
}
if (ONLY !== "world") {

console.log("wikidata: Bangladesh districts…");
const drows = await sparql(`
SELECT ?dLabel ?img ?hqImg ?cat WHERE {
  ?d wdt:P31 wd:Q152732 .
  OPTIONAL { ?d wdt:P18 ?img . }
  OPTIONAL { ?d wdt:P36 ?hq . ?hq wdt:P18 ?hqImg . }
  OPTIONAL { ?d wdt:P373 ?cat . }
  ?d rdfs:label ?dLabel FILTER(LANG(?dLabel) = "en")
}`);
/* fallback for districts without P18: the first few photos in their Commons category */
async function categoryFiles(cat) {
  const url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&list=categorymembers&cmtype=file&cmlimit=30&cmtitle=" + encodeURIComponent("Category:" + cat);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.query?.categorymembers || []).map((m) => m.title.replace(/^File:/, "")).filter((f) => /[.](jpe?g|png|webp)$/i.test(f));
}
const norm = (s) => s.toLowerCase().replace(/ district$/, "").replace(/[^a-z]/g, "");
const ALIAS = { chittagong: "chattogram", comilla: "cumilla", jessore: "jashore", bogra: "bogura", barisal: "barishal", chapainawabganj: "nawabganj", nawabganj: "nawabganj", coxsbazar: "coxsbazar", brahmanbaria: "brahmanbaria", maulvibazar: "maulvibazar", moulvibazar: "maulvibazar", netrakona: "netrokona", jhalakati: "jhalokati", jhalokathi: "jhalokati", sirajganj: "sirajgonj", khagrachhari: "khagrachari", lakshmipur: "lakshmipur", laxmipur: "lakshmipur" };
const dCand = {};
for (const d of DISTRICTS) dCand[d.id] = [];
for (const r of drows) {
  const k = norm(r.dLabel.value);
  const id = ALIAS[k] || DISTRICTS.find((d) => norm(d.en) === k || d.id === k)?.id;
  if (!id) { console.log("  ? unmatched district item:", r.dLabel.value); continue; }
  if (r.img) dCand[id].push(fileOf(r.img.value));
  if (r.hqImg) dCand[id].push(fileOf(r.hqImg.value));
  if (r.cat) (dCand[id].cats ||= new Set()).add(r.cat.value);
}
for (const [id, files] of Object.entries(dCand)) {
  if (files.length || !files.cats) continue;
  const d = DISTRICTS.find((x) => x.id === id);
  let found = [];
  for (const cat of files.cats) { found.push(...(await categoryFiles(cat))); await sleep(80); }
  found = found.filter((f) => !BAD_PEOPLE.test(f.replace(/[_.]/g, " ")));
  // files that name the district first — far more likely to be "the place"
  const re = new RegExp(d.en.replace(/[^a-z]/gi, ".?"), "i");
  found.sort((a, b) => (re.test(b) ? 1 : 0) - (re.test(a) ? 1 : 0));
  files.push(...found);
}
/* last resort: the district town's own Wikidata item (searched by name, must be
   described as a city/town in Bangladesh) and its P18. Never free-text search —
   that once returned a politician's portrait for Gopalganj. */
const TOWN_QID = { chattogram: "Q376749", coxsbazar: "Q949746", narayanganj: "Q1990163", gopalganj: "Q1964065" }; // checked by hand
/* hand-picked Commons files (places, no people) where the automatic paths kept
   returning crowds, officials or animals — tried before anything else */
const MANUAL = {
  chattogram: ["Golden Hour View of the Bay of Bengal from Patenga Beach 01.jpg", "At the mouth of Karnaphuli river 01.jpg", "Boats at Patenga(111).JPG"],
  coxsbazar: ["City of Cox's Bazar in 2019.02.jpg", "Inani Beach (Cox's Bazar).jpg", "Beach View During Main Driveway of Inani beach.jpg"],
  gopalganj: ["Nobinbag,gopalgang.jpg", "Gopalganj Municipal New Market 20250731 124101.jpg"],
  natore: ["Natore Uttara GanoBhaban1 (Prime Minister's Residence).JPG", "N6 (Bangladesh) at Natore.jpg"],
  gaibandha: ["Gaibandha ghagot river.jpg", "Ghaghoth river in Gaibandha 01.jpg", "Paddy field in Gaibandha.JPG"],
  nilphamari: ["Nilphamari City.jpg", "Nilsagar.jpg", "Nilphamari Zilla Stadium.jpg"],
  patuakhali: ["Gazipur Bandar, Bazaar. - panoramio.jpg"],
};
async function cityImages(name, id) {
  let hits = [];
  if (TOWN_QID[id]) hits = [{ id: TOWN_QID[id] }];
  else {
    const r = await fetch("https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=8&search=" + encodeURIComponent(name), { headers: { "User-Agent": UA } });
    if (!r.ok) return [];
    hits = ((await r.json()).search || []).filter((h) => /bangladesh/i.test(h.description || "") && /city|town|municipal|metropol/i.test(h.description || ""));
  }
  const out = [];
  for (const h of hits.slice(0, 2)) {
    const c = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&entity=${h.id}`, { headers: { "User-Agent": UA } });
    if (!c.ok) continue;
    const claims = (await c.json()).claims || {};
    for (const cl of claims.P18 || []) { const v = cl.mainsnak?.datavalue?.value; if (v) out.push(v); }
    // the town's Commons category, district-named files first
    for (const cl of claims.P373 || []) {
      const cat = cl.mainsnak?.datavalue?.value;
      if (!cat) continue;
      const re = new RegExp(name.replace(/[^a-z]/gi, ".?"), "i");
      const files = (await categoryFiles(cat)).sort((a, b) => (re.test(b) ? 1 : 0) - (re.test(a) ? 1 : 0));
      out.push(...files);
      await sleep(80);
    }
    await sleep(80);
  }
  return out.filter((f) => !BAD_PEOPLE.test(f.replace(/[_.]/g, " ")));
}
for (const [id, files] of Object.entries(dCand)) {
  const keep = files.filter((f) => !BAD_PEOPLE.test(f.replace(/[_.]/g, " ")));
  files.length = 0; files.push(...(MANUAL[id] || []), ...keep);
}
let districts = await resolveMany(dCand, "districts");
const retry = {};
for (const d of DISTRICTS) {
  if (districts[d.id]) continue;
  retry[d.id] = await cityImages(d.en, d.id);
  await sleep(80);
}
if (Object.keys(retry).length) districts = { ...districts, ...Object.fromEntries(Object.entries(await resolveMany(retry, "towns")).filter(([, v]) => v)) };
fs.writeFileSync(path.join(CACHE, "photos-districts.json"), JSON.stringify(districts, null, 1));
console.log(`photos-districts.json: ${Object.values(districts).filter(Boolean).length}/${DISTRICTS.length} resolved`);
console.log("  missing:", Object.entries(districts).filter(([, v]) => !v).map(([k]) => k).join(", ") || "none");
}
