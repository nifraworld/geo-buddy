/* Assemble geo-data.js from all source data.
   Run last in the build pipeline (`npm run data`). */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRY_BN, REGION_BN } from "./bn.mjs";
import { DIVISIONS, NATIONAL } from "./divisions.mjs";
import { DISTRICTS } from "./districts.mjs";
import { WORLD_LANDMARKS, BD_LANDMARKS } from "./landmarks-list.mjs";
import { geoMercator, geoEqualEarth } from "d3-geo";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const APP_VERSION = JSON.parse(read("package.json")).version; // single source of truth
const exists = (p) => fs.existsSync(path.join(root, p));

const countries = JSON.parse(read(".cache/countries.json"));

const upazilaByDistrict = (() => {
  if (!exists(".cache/bd-upazilas.geojson")) return {};
  const gj = JSON.parse(read(".cache/bd-upazilas.geojson"));
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const out = {};
  for (const f of gj.features) {
    const dn = norm(f.properties && (f.properties.district_name || f.properties.name));
    if (dn) out[dn] = (out[dn] || 0) + 1;
  }
  return out;
})();
const upazilaCount = (en) => upazilaByDistrict[String(en).toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()] || 0;
const photos = exists(".cache/photos.json")
  ? JSON.parse(read(".cache/photos.json"))
  : {};
// v2.1: Wikidata P18 photos (scripts/photos-wikidata.mjs); slimmed to what the app shows
const photosWorld = exists(".cache/photos-world.json") ? JSON.parse(read(".cache/photos-world.json")) : {};
const photosDist = exists(".cache/photos-districts.json") ? JSON.parse(read(".cache/photos-districts.json")) : {};
const slimPhoto = (ph) => ph ? { url: ph.url, page: ph.page, artist: ph.artist, license: ph.license, file: ph.file } : null;
const populations = exists(".cache/populations.json")
  ? JSON.parse(read(".cache/populations.json"))
  : [];
const popByIso3 = {};
for (const p of populations) if (p && p.iso3) popByIso3[p.iso3] = p.pop || 0;
const flagsJs = read("geo-flags.js");
const flags = (() => {
  const m = flagsJs.match(/FLAG_CODES=(\[[\s\S]*?\]);/);
  return m ? JSON.parse(m[1]) : [];
})();

// Parse map-data.js files (var X = { ... };) to extract keys + labels
function parseLabelsMap(jsText, varName) {
  const start = jsText.indexOf(`var ${varName} = `) + `var ${varName} = `.length;
  const rest = jsText.slice(start);
  let depth = 0, end = -1;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "{") depth++;
    else if (rest[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return end > 0 ? JSON.parse(rest.slice(0, end)) : {};
}
const bdLabels = parseLabelsMap(read("assets/bd-map-data.js"), "BD_LABELS");
const worldLabels = parseLabelsMap(read("assets/world-map-data.js"), "WORLD_LABELS");
const worldMapKeys = Object.keys(parseLabelsMap(read("assets/world-map-data.js"), "WORLD_MAP") || {});
const bdMapKeys = Object.keys(bdLabels);

// Regions
const regionCounts = {};
const regionOrder = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
for (const c of countries.filter((x) => x.unMember)) {
  if (!regionCounts[c.region]) regionCounts[c.region] = 0;
  regionCounts[c.region]++;
}

// Build countries array
const unMembers = countries
  .filter((c) => c.unMember)
  .sort((a, b) => a.name.common.localeCompare(b.name.common))
  .map((c) => {
    const id = String(c.ccn3).padStart(3, "0");
    const bn = COUNTRY_BN[c.cca3] || [c.name.common, c.name.common, c.capital?.[0] || "", c.capital?.[0] || ""];
    const flagCode = c.cca2.toLowerCase();
    const nativeNames = c.name?.native
      ? Object.values(c.name.native).map((n) => n.common).filter(Boolean)
      : [];
    const uniqueNative = [...new Set(nativeNames)];
    const borders = (c.borders || [])
      .map((b3) => countries.find((x) => x.cca3 === b3))
      .filter(Boolean)
      .map((x) => x.name.common)
      .sort();
    return {
      iso2: c.cca2,
      iso3: c.cca3,
      id,
      en: c.name.common,
      official: c.name.official || c.name.common,
      bn: bn[1],
      native: uniqueNative,
      capitalEn: bn[2] || (c.capital && c.capital[0]) || "",
      capitalBn: bn[3] || "",
      region: c.region,
      regionBn: REGION_BN[c.region] || c.region,
      subRegion: c.subregion || c.region,
      area: c.area || 0,
      population: popByIso3[c.cca3] || 0,
      landlocked: !!c.landlocked,
      neighbors: borders,
      latlng: c.latlng || [],
      flagCode,
      hasMap: worldMapKeys.includes(id),
      // v2.1 facts (all from the same dataset): currency, languages, dial code, demonym
      currency: c.currencies ? Object.entries(c.currencies).slice(0, 2).map(([code, v]) => ({ code, name: v.name, symbol: v.symbol || "" })) : [],
      languages: c.languages ? Object.values(c.languages).slice(0, 4) : [],
      dial: c.idd && c.idd.root ? c.idd.root + ((c.idd.suffixes || []).length === 1 ? c.idd.suffixes[0] : "") : "",
      demonym: (c.demonyms && c.demonyms.eng && c.demonyms.eng.m) || "",
      tld: (c.tld && c.tld[0]) || "",
      // the capital's photo first (a skyline reads as "a place"), else the country's
      photo: slimPhoto(photosWorld["cap:" + id] || photosWorld["c:" + id]),
    };
  });

// v2.1: the 56 non-UN entities in the dataset — territories, dependencies and
// a few independent-but-not-UN places (Kosovo, Taiwan, Palestine, Western
// Sahara). Explore-only ("Territories & others"); never asked in a quiz.
const extras = countries
  .filter((c) => !c.unMember)
  .sort((a, b) => a.name.common.localeCompare(b.name.common))
  .map((c) => {
    const bn = COUNTRY_BN[c.cca3];
    return {
      id: "x-" + c.cca2.toLowerCase(),
      iso2: c.cca2, iso3: c.cca3,
      en: c.name.common, official: c.name.official || c.name.common,
      bn: (bn && bn[1]) || c.name.common,
      capitalEn: (c.capital && c.capital[0]) || "",
      region: c.region, regionBn: REGION_BN[c.region] || c.region, subRegion: c.subregion || c.region,
      area: c.area || 0,
      flagCode: c.cca2.toLowerCase(),
      status: c.independent ? "independent" : "territory",
    };
  });

// v2.3: landmarks — curated list + Wikidata coords/photo (.cache/landmarks.json),
// pre-projected onto the two maps with the parameters the map builder exported
const lmCache = exists(".cache/landmarks.json") ? JSON.parse(read(".cache/landmarks.json")) : {};
const projOf = (file, name) => {
  const m = read(file).match(new RegExp("var " + name + " = (\\{[^;]*\\});"));
  if (!m) return null;
  const P = JSON.parse(m[1]);
  return (P.type === "mercator" ? geoMercator() : geoEqualEarth()).scale(P.scale).translate(P.translate);
};
const bdProj = projOf("assets/bd-map-data.js", "BD_PROJ");
const worldProj = projOf("assets/world-map-data.js", "WORLD_PROJ");
const iso3ToId = Object.fromEntries(countries.filter((c) => c.unMember).map((c) => [c.cca3, String(c.ccn3).padStart(3, "0")]));
const landmarks = [...WORLD_LANDMARKS.map((l) => ({ ...l, scope: "world" })), ...BD_LANDMARKS.map((l) => ({ ...l, scope: "bd" })) ]
  .map((l) => {
    const r = lmCache[l.id];
    if (!r || !r.coord) return null;
    const pt = l.scope === "bd" ? bdProj([r.coord.lng, r.coord.lat]) : worldProj([r.coord.lng, r.coord.lat]);
    const dist = l.scope === "bd" ? DISTRICTS.find((d) => d.id === l.c) : null;
    return {
      id: l.id, en: l.en, bn: l.bn, kind: l.kind, scope: l.scope,
      country: l.scope === "world" ? iso3ToId[l.c] || null : null,   // world: country id
      dist: dist ? dist.id : null, div: dist ? dist.div : null,       // bd: district + division
      factEn: l.factEn, factBn: l.factBn,
      lat: r.coord.lat, lng: r.coord.lng,
      px: pt ? [Math.round(pt[0] * 10) / 10, Math.round(pt[1] * 10) / 10] : null,
      photo: slimPhoto(r.photo),
    };
  }).filter(Boolean);
if (landmarks.some((l) => l.scope === "world" && !l.country)) console.warn("landmarks without a country id:", landmarks.filter((l) => l.scope === "world" && !l.country).map((l) => l.id).join(", "));

const divisions = DIVISIONS.map((d) => ({
  ...d,
  photo: photos[d.id] || null,
}));

const districts = DISTRICTS.map((d) => ({
  ...d,
  photo: slimPhoto(photosDist[d.id]),
  upazilas: upazilaCount(d.en) || 0,
  density: Math.round(d.pop / d.areaKm2),
}));
// Normalise each district population so that per-division district sums
// reconcile exactly with the authoritative BBS division totals (districts
// source overstates by ~2-3% on some divisions).
for (const dv of DIVISIONS) {
  const group = districts.filter((d) => d.div === dv.id);
  const sum = group.reduce((s, d) => s + d.pop, 0);
  if (!group.length || !sum) continue;
  const scale = dv.pop / sum;
  let alloc = 0;
  group.forEach((d, i) => {
    const n = i === group.length - 1 ? dv.pop - alloc : Math.round(d.pop * scale);
    alloc += n;
    d.pop = n;
    d.density = Math.round(d.pop / d.areaKm2);
  });
}

const geoData = `/* GENERATED by scripts/build-data.mjs — do not edit.
   Country data: mledoze/countries (ODbL) + curated Bangla names (Geo Buddy).
   Flag artwork: lipis/flag-icons (MIT). Division photos: Wikimedia Commons.
   Division + district stats: BBS 2022 Population and Housing Census.
   Built: ${new Date().toISOString().split("T")[0]} */
export const GEO={
  version:"${APP_VERSION}",
  updated:"${new Date().toISOString().split("T")[0]}",
  national:${JSON.stringify(NATIONAL)},
  regions:${JSON.stringify(
    regionOrder.filter((r) => regionCounts[r]).map((r) => ({
      id: r.toLowerCase(),
      en: r,
      bn: REGION_BN[r] || r,
      count: regionCounts[r] || 0,
    }))
  )},
  countries:${JSON.stringify(unMembers)},
  extras:${JSON.stringify(extras)},
  landmarks:${JSON.stringify(landmarks)},
  divisions:${JSON.stringify(divisions, null, 0)},
  districts:${JSON.stringify(districts, null, 0)},
  bdLabels:${JSON.stringify(bdLabels)},
  worldLabels:${JSON.stringify(worldLabels)},
  bdMapIds:${JSON.stringify(bdMapKeys)},
  worldMapIds:${JSON.stringify(worldMapKeys)},
};
`;

fs.writeFileSync(path.join(root, "geo-data.js"), geoData);
console.log(`geo-data.js: ${unMembers.length} countries, ${extras.length} extras, ${landmarks.length} landmarks, ${divisions.length} divisions, ${districts.length} districts, ${worldMapKeys.length} map paths`);
