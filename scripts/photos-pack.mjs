/* v2.2: the offline picture pack. Downloads every photo the app knows about
   (divisions, districts, countries) from Wikimedia Commons at 480 px, converts
   to WebP and writes assets/photos/<key>.webp + assets/photos/manifest.json.
   The pack is NOT precached by the service worker — the base install stays
   small; Parent Zone → "Pictures for offline" fetches it into its own cache.
   Run with `npm run photos:pack` (needs the .cache/photos*.json from
   `npm run photos` and `npm run photos:wd`). Re-runs skip files already made. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(root, ".cache");
const OUT = path.join(root, "assets", "photos");
const UA = "GeoBuddy/2.2 (https://geobuddy.nifraworld.com; educational PWA)";
const WIDTH = 400, QUALITY = 60;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => (fs.existsSync(path.join(CACHE, f)) ? JSON.parse(fs.readFileSync(path.join(CACHE, f), "utf8")) : {});

fs.mkdirSync(OUT, { recursive: true });
const divisions = read("photos.json");           // { dhaka: {file,…} }
const world = read("photos-world.json");         // { "c:050": …, "cap:050": … }
const districts = read("photos-districts.json"); // { barguna: … }

// key → Commons file name, mirroring build-data.mjs's choice (capital first)
const jobs = [];
for (const [id, ph] of Object.entries(divisions)) if (ph) jobs.push(["d-" + id, ph.file]);
for (const [id, ph] of Object.entries(districts)) if (ph) jobs.push(["z-" + id, ph.file]);
const countryIds = new Set(Object.keys(world).map((k) => k.split(":")[1]));
for (const id of countryIds) {
  const ph = world["cap:" + id] || world["c:" + id];
  if (ph) jobs.push(["c-" + id, ph.file]);
}

const manifest = {};
let made = 0, kept = 0, failed = 0;
for (const [key, file] of jobs) {
  const dest = path.join(OUT, key + ".webp");
  if (fs.existsSync(dest)) { manifest[key] = fs.statSync(dest).size; kept++; continue; }
  const url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file) + "?width=" + WIDTH;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    const webp = await sharp(buf).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    fs.writeFileSync(dest, webp);
    manifest[key] = webp.length;
    made++;
    if (made % 25 === 0) console.log(`  ${made} made…`);
  } catch (e) {
    failed++;
    console.warn(`  ! ${key} (${file}): ${e.message}`);
  }
  await sleep(120);
}
const total = Object.values(manifest).reduce((a, b) => a + b, 0);
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ v: 1, width: WIDTH, bytes: total, files: Object.keys(manifest).sort() }));
console.log(`photos pack: ${Object.keys(manifest).length} files (${made} new, ${kept} kept, ${failed} failed), ${(total / 1024 / 1024).toFixed(1)} MB`);
