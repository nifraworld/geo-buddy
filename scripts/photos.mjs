/* Resolve division photo candidates against Wikimedia Commons and capture the
   author + licence for each, so the app can credit correctly. Writes
   .cache/photos.json keyed by division id. Run with `npm run photos`. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIVISIONS } from "./divisions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(root, ".cache");
const UA = "GeoBuddy/1.0 (https://geo.nifraworld.com; educational PWA)";

const stripTags = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function lookup(file) {
  const title = "File:" + file.replace(/ /g, "_");
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo" +
    "&iiprop=url|extmetadata|size&iiurlwidth=1000&titles=" +
    encodeURIComponent(title);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const json = await res.json();
  const page = Object.values(json.query?.pages || {})[0];
  if (!page || page.missing !== undefined || !page.imageinfo?.[0]) return null;
  const info = page.imageinfo[0];
  const m = info.extmetadata || {};
  const get = (k) => (m[k] ? stripTags(m[k].value) : "");
  return {
    file,
    url: info.thumburl || info.url,
    page: info.descriptionurl,
    width: info.width,
    height: info.height,
    artist: get("Artist") || get("Credit") || "Wikimedia Commons",
    license: get("LicenseShortName") || get("UsageTerms") || "See file page",
    licenseUrl: m.LicenseUrl ? m.LicenseUrl.value : "",
    date: get("DateTimeOriginal"),
  };
}

const out = {};
for (const d of DIVISIONS) {
  let hit = null;
  for (const cand of d.photo) {
    try {
      hit = await lookup(cand);
    } catch (e) {
      console.warn(`  ! ${d.id}: ${cand} — ${e.message}`);
    }
    if (hit) {
      console.log(`  = ${d.id}: ${hit.file} (${hit.license})`);
      break;
    }
    console.log(`  - ${d.id}: miss ${cand}`);
  }
  if (!hit) console.warn(`  x ${d.id}: no photo resolved`);
  out[d.id] = hit;
}

fs.mkdirSync(CACHE, { recursive: true });
fs.writeFileSync(path.join(CACHE, "photos.json"), JSON.stringify(out, null, 2));
console.log(`photos: wrote .cache/photos.json (${Object.values(out).filter(Boolean).length}/${DIVISIONS.length} resolved)`);
