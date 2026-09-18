/* Build pass 2: maps.
   - Bangladesh: upazila polygons -> dissolved (full resolution) per division ->
     topologically simplified with mapshaper -> projected -> SVG + data.
   - World: Natural Earth 110m TopoJSON -> GeoJSON -> simplified -> projected.
   Outputs: assets/bd-map.svg, assets/bd-map-data.js, assets/world-map.svg,
   assets/world-map-data.js
*/
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import * as turf from "@turf/turf";
import { geoMercator, geoEquirectangular, geoEqualEarth, geoGraticule, geoArea, geoPath } from "d3-geo";
import simplify from "simplify-js";
import { feature as topoFeature } from "topojson-client";
import { DISTRICTS } from "./districts.mjs";

const CACHE = new URL("../.cache/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ASSETS = new URL("../assets/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const rootPath = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1").replace(/[\\/]$/, "");

function load(name) {
  return JSON.parse(readFileSync(CACHE + name, "utf8"));
}

/* Upstream tagging fixes. The source GeoJSON name-matches upazilas, so
   Noakhali's Companiganj is tagged Sylhet (there is one of each), and the
   untagged coastal upazilas next to it (Hatiya, Subarnachar, …) then get
   attached to the nearest tagged neighbour — Sylhet — which draws a Sylhet
   island in the Meghna estuary. Keyed by source_name; `near` is [lon, lat]
   and must be within ~0.5° of the centroid for the fix to apply. */
const UPAZILA_FIX = [
  { name: "Companiganj", near: [91.29, 22.80], district: "Noakhali",   division: "Chattogram" },
  { name: "Hatiya",      near: [91.07, 22.32], district: "Noakhali",   division: "Chattogram" },
  { name: "Kabirhat",    near: [91.19, 22.83], district: "Noakhali",   division: "Chattogram" },
  { name: "Subarnachar", near: [91.21, 22.57], district: "Noakhali",   division: "Chattogram" },
  { name: "Senbagh",     near: [91.21, 22.98], district: "Noakhali",   division: "Chattogram" },
  { name: "Kamalnagar",  near: [90.89, 22.75], district: "Lakshmipur", division: "Chattogram" },
  { name: "Roypur",      near: [90.73, 22.99], district: "Lakshmipur", division: "Chattogram" },
];
function loadUpazilas() {
  const fc = load("bd-upazilas.geojson");
  let fixed = 0;
  for (const f of fc.features) {
    const p = f.properties || {};
    const fix = UPAZILA_FIX.find((x) => x.name === String(p.source_name || p.name || "").trim());
    if (!fix) continue;
    const c = turf.centroid(f).geometry.coordinates;
    if (Math.abs(c[0] - fix.near[0]) > 0.5 || Math.abs(c[1] - fix.near[1]) > 0.5) continue;
    if (p.district_name === fix.district && p.division_name === fix.division) continue;
    p.district_name = fix.district; p.division_name = fix.division; fixed++;
  }
  if (fixed) console.log("upazila tag fixes applied:", fixed);
  return fc;
}

/* ---------- Bangladesh divisions ---------- */
const RENAME = {                  // legacy spellings -> official 2026
  "Chittagong": "Chattogram", "Barisal": "Barishal",
};

function dissolveDivision(feats) {
  // explode MultiPolygons into Polygons first (turf.dissolve rejects MultiPolygon),
  // then union everything for that division at FULL resolution.
  const exploded = [];
  for (const f of feats) {
    if (!f || !f.geometry) continue;
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) exploded.push(turf.polygon(poly, f.properties));
  }
  if (!exploded.length) return [];
  const diss = turf.dissolve(turf.featureCollection(exploded));
  const out = [];
  const ds = diss.type === "FeatureCollection" ? diss.features : [diss];
  for (const sf of ds) {
    if (!sf || !sf.geometry) continue;
    const polys = sf.geometry.type === "Polygon" ? [sf.geometry.coordinates] : sf.geometry.coordinates;
    for (const poly of polys) out.push(turf.polygon(poly, sf.properties));
  }
  return out;
}

function bdBuild() {
  const fc = loadUpazilas();
  const named = {}, unnamed = [];
  for (const f of fc.features) {
    const raw = String(f.properties.division_name || "").trim();
    if (!raw) { unnamed.push(f); continue; }
    const name = RENAME[raw] || raw;
    (named[name] ||= []).push(f);
  }
  const names = Object.keys(named).sort();
  console.log("divisions:", names.join(", "), "| unnamed city polygons:", unnamed.length);

  const dissolved = {};
  for (const name of names) {
    const start = Date.now();
    dissolved[name] = dissolveDivision(named[name]);
    console.log("  dissolve", name, "->", dissolved[name].length, "shape(s) in", ((Date.now() - start) / 1000).toFixed(1), "s");
  }

  // assign unnamed city polygons to the division that contains (or is nearest to) them
  if (unnamed.length) {
    const divFeat = Object.entries(dissolved).map(([n, feats]) => ({ n, feats }));
    let assigned = 0;
    for (const f of unnamed) {
      const pt = turf.centroid({ type: "Feature", properties: {}, geometry: f.geometry });
      let hit = divFeat.find((x) => x.feats.some((poly) => turf.booleanPointInPolygon(pt, poly)));
      if (!hit) {
        let best = null, bestD = Infinity;
        for (const x of divFeat) {
          for (const poly of x.feats) {
            const d = turf.pointToPolygonDistance(pt, poly, { units: "kilometers" });
            if (d < bestD) { bestD = d; best = x; }
          }
        }
        hit = best;
      }
      if (hit) { (named[hit.n] ||= []).push(f); assigned++; }
    }
    console.log("assigned", assigned, "city polygons to divisions");
  }

  // final dissolve per division (named + assigned city polygons), stamped
  // with a division property so mapshaper can simplify while keeping shapes
  const allDiv = [];
  for (const name of names) {
    const parts = dissolveDivision(named[name]);
    for (const p of parts) {
      p.properties = { division: name };
      allDiv.push(p);
    }
  }
  const divFc = { type: "FeatureCollection", features: allDiv };
  writeFileSync(CACHE + "bd-divisions.json", JSON.stringify(divFc));
  console.log("  dissolved FC:", allDiv.length, "features,", (JSON.stringify(divFc).length / 1024).toFixed(0), "KB");

  // topological simplification via mapshaper CLI (keeps division shapes intact)
  execSync(
    `node "${rootPath}\\node_modules\\mapshaper\\bin\\mapshaper" "${CACHE}bd-divisions.json" -simplify 2% keep-shapes -clean -o format=geojson "${CACHE}bd-simplified.json"`,
    { cwd: rootPath, stdio: ["ignore", "ignore", "pipe"] }
  );
  const simp = load("bd-simplified.json");
  console.log("  simplified:", simp.features.length, "features,", (JSON.stringify(simp).length / 1024).toFixed(0), "KB");

  // d3 renders a ring as *exterior* when it is clockwise in the projected plane
  // (opposite of the RFC 7946 / turf convention: CCW outer). Left alone, every
  // division would render as "the whole map minus the division". Reversing every
  // ring flips the outer ring to clockwise AND keeps holes as holes.
  for (const f of simp.features) {
    const c = f.geometry?.coordinates;
    if (!c) continue;
    const polygons = f.geometry.type === "Polygon" ? [c] : c;
    for (const poly of polygons) for (const ring of poly) ring.reverse();
  }

  // group simplified features back into divisions
  const byDiv = {};
  for (const f of simp.features) {
    const name = String(f.properties?.division || "").trim();
    if (!name) continue;
    (byDiv[name] ||= []).push(f);
  }

  // project (use only the simplified geometry to fit the extent)
  const all = { type: "FeatureCollection", features: Object.values(byDiv).flat() };
  const proj = geoMercator().fitExtent([[6, 6], [634, 834]], all);

  const paths = {};
  const labels = {};
  const gpath = geoPath(proj);
  for (const name of Object.keys(byDiv).sort()) {
    // combine all features of a division into one MultiPolygon
    const parts = [];
    for (const f of byDiv[name]) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === "Polygon") parts.push(g.coordinates);
      else if (g.type === "MultiPolygon") parts.push(...g.coordinates);
    }
    const full = { type: "MultiPolygon", coordinates: parts };
    const d = gpath(full) || "";
    const c = gpath.centroid(full) || gpath.bounds(full)[0];
    paths[name] = d;
    labels[name] = c ? [Math.round(c[0]), Math.round(c[1])] : [320, 420];
  }

  const rivers = bdRivers(proj, gpath, all.features);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 840" width="640" height="840">\n`;
  const palette = ["#DCEFD6", "#F7E3C0", "#CBEAE0", "#EAD9F0", "#F5D7D2", "#D8E4F3", "#F6E3B8", "#D3ECD1"];
  let i = 0;
  for (const name of Object.keys(paths)) {
    svg += `  <path id="bd-${slug(name)}" data-name="${name}" d="${paths[name]}" fill="${palette[i % palette.length]}" stroke="#0E3B2E" stroke-width="2" stroke-linejoin="round"/>\n`;
    if (labels[name]) svg += `  <text x="${labels[name][0]}" y="${labels[name][1]}" text-anchor="middle" font-size="20" font-weight="800" fill="#0E3B2E">${escXml(name)}</text>\n`;
    i++;
  }
  for (const r of rivers) svg += `  <path d="${r.d}" fill="none" stroke="#3E8EC4" stroke-width="2.5" stroke-linecap="round"/>\n`;
  svg += `</svg>\n`;

  writeFileSync(ASSETS + "bd-map.svg", svg);
  writeFileSync(
    ASSETS + "bd-map-data.js",
    "/* GENERATED by scripts/maps.mjs. WGS84 upazila source dissolved into 8 divisions. */\n" +
      "var BD_RIVERS = " + JSON.stringify(rivers) + ";\n" +
      "var BD_MAP = " + JSON.stringify(paths, null, 1) + ";\n" +
      "var BD_LABELS = " + JSON.stringify(labels, null, 1) + ";\n"
  );
  console.log("wrote bd-map.svg + bd-map-data.js");
}
/* v2.1: rivers of Bangladesh for the division/district maps. Natural Earth 10m
   has the Ganges (Padma), Brahmaputra (Jamuna) and Teesta; the other big rivers
   a Bangladeshi child learns are traced by hand from well-known waypoints —
   schoolbook centerlines, not survey data (marked approx:true). */
const BD_BOX = [87.9, 20.6, 92.75, 26.75];
const BD_RIVER_NAMES = { Ganges: ["Padma", "পদ্মা"], Brahmaputra: ["Jamuna", "যমুনা"], Tista: ["Teesta", "তিস্তা"] };
const BD_HAND_RIVERS = [
  { en: "Meghna", bn: "মেঘনা", pts: [[91.05, 24.55], [90.98, 24.05], [90.85, 23.75], [90.7, 23.45], [90.65, 23.23], [90.62, 23.0], [90.68, 22.75], [90.75, 22.5], [90.85, 22.3], [90.9, 22.1]] },
  { en: "Karnaphuli", bn: "কর্ণফুলী", pts: [[92.3, 22.75], [92.2, 22.65], [92.1, 22.5], [91.95, 22.42], [91.85, 22.36], [91.8, 22.3], [91.78, 22.23]] },
  { en: "Surma", bn: "সুরমা", pts: [[92.3, 25.17], [92.1, 25.0], [91.87, 24.9], [91.6, 24.98], [91.4, 25.07], [91.2, 24.9], [91.05, 24.6]] },
  { en: "Rupsha–Pashur", bn: "রূপসা–পশুর", pts: [[89.55, 22.85], [89.56, 22.65], [89.6, 22.48], [89.58, 22.25], [89.55, 22.0], [89.52, 21.8]] },
];
function bdRivers(proj, gpath, landFeatures) {
  // "inside" = on Bangladeshi land (not just in the frame): the Ganges' Indian
  // distributaries west of the border must not appear
  const land = landFeatures.filter((f) => f.geometry).map((f) => ({ f, b: turf.bbox(f) }));
  const inBox = (pt) => {
    const [x, y] = pt;
    if (!(x >= BD_BOX[0] && x <= BD_BOX[2] && y >= BD_BOX[1] && y <= BD_BOX[3])) return false;
    for (const { f, b } of land) {
      if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
      if (turf.booleanPointInPolygon(pt, f)) return true;
    }
    return false;
  };
  const out = [];
  const src = load("ne-rivers-10m.geojson");
  for (const f of src.features) {
    const p = f.properties || {};
    const nm = p.name_en || p.name;
    if (!nm || !BD_RIVER_NAMES[nm]) continue;
    const lines = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
    // keep only the stretch inside the Bangladesh frame (plus one point past the edge so the line reaches it)
    const clipped = [];
    for (const line of lines) {
      let cur = [];
      line.forEach((pt, i) => {
        const inside = inBox(pt);
        if (inside) { if (!cur.length && i > 0) cur.push(line[i - 1]); cur.push(pt); }
        else if (cur.length) { cur.push(pt); clipped.push(cur); cur = []; }
      });
      if (cur.length > 1) clipped.push(cur);
    }
    if (!clipped.length) continue;
    const d = gpath({ type: "MultiLineString", coordinates: clipped });
    if (d) out.push({ en: BD_RIVER_NAMES[nm][0], bn: BD_RIVER_NAMES[nm][1], d, approx: false });
  }
  for (const r of BD_HAND_RIVERS) {
    const d = gpath({ type: "LineString", coordinates: r.pts });
    if (d) out.push({ en: r.en, bn: r.bn, d, approx: true });
  }
  // label anchor: the middle vertex of the longest run, in map px
  for (const r of out) {
    const nums = r.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const mid = Math.floor(nums.length / 4) * 2;
    r.lx = Math.round(nums[mid]); r.ly = Math.round(nums[mid + 1]);
  }
  return out;
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function escXml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* ---------- World ---------- */
/* v2.1: Natural Earth 1:50m (was 110m) so Singapore, Malta, Bahrain, Mauritius…
   exist as polygons; Equal Earth projection (the "atlas look", no giant
   Greenland); a dot marker for every country too small to tap; rivers, lakes
   and ocean/continent labels as extra layers for the explorer. The paths are
   still baked into a 900×460 box, which the engine relies on. */
const W = 900, H = 460;
const OCEAN_LABELS = [
  // [lon, lat, en, bn, kind]
  [-150, 10, "Pacific Ocean", "প্রশান্ত মহাসাগর", "ocean"],
  [-35, 5, "Atlantic Ocean", "আটলান্টিক মহাসাগর", "ocean"],
  [78, -20, "Indian Ocean", "ভারত মহাসাগর", "ocean"],
  [-20, 78, "Arctic Ocean", "উত্তর মহাসাগর", "ocean"],
  [20, -66, "Southern Ocean", "দক্ষিণ মহাসাগর", "ocean"],
  [88.5, 15, "Bay of Bengal", "বঙ্গোপসাগর", "sea"],
  [64, 15, "Arabian Sea", "আরব সাগর", "sea"],
  [18, 36, "Mediterranean Sea", "ভূমধ্যসাগর", "sea"],
  [-100, 46, "North America", "উত্তর আমেরিকা", "continent"],
  [-60, -15, "South America", "দক্ষিণ আমেরিকা", "continent"],
  [20, 8, "Africa", "আফ্রিকা", "continent"],
  [22, 54, "Europe", "ইউরোপ", "continent"],
  [95, 48, "Asia", "এশিয়া", "continent"],
  [134, -24, "Australia", "অস্ট্রেলিয়া", "continent"],
  [20, -82, "Antarctica", "অ্যান্টার্কটিকা", "continent"],
];
/* countries absent even at 50m: drawn as a small square at their coordinates */
const MISSING_AT_50M = { "798": [179.2, -8.5] /* Tuvalu */ };

function worldBuild() {
  const topo = load("world-50m.json");
  const geo = topoFeature(topo, topo.objects.countries);
  const feats = geo.features;
  console.log("world features:", feats.length);

  // simplify each ring defensively (skip tiny <6-point rings)
  function simplifyGeom(g, tol) {
    if (g.type === "Polygon") return { ...g, coordinates: simplifyRing(g.coordinates, tol) };
    if (g.type === "MultiPolygon") return { ...g, coordinates: g.coordinates.map((r) => simplifyRing(r, tol)) };
    return g;
  }
  function simplifyRing(rings, tol) {
    return rings.map((ring) => {
      if (ring.length < 6) return ring;
      const pts = ring.map(([x, y]) => ({ x, y }));
      const out = simplify(pts, tol, true).map((p) => [p.x, p.y]);
      // a ring collapsed to a sliver (3 distinct points) reads to d3 as "the whole
      // sphere except this" and paints the planet green — keep the original then
      if (out.length < 5 || geoArea({ type: "Polygon", coordinates: [out] }) > Math.PI) return ring;
      return out;
    }).filter((ring) => geoArea({ type: "Polygon", coordinates: [ring] }) <= Math.PI);
  }
  function simplifyLine(g, tol) {
    const one = (line) => line.length < 4 ? line : simplify(line.map(([x, y]) => ({ x, y })), tol, true).map((p) => [p.x, p.y]);
    if (g.type === "LineString") return { ...g, coordinates: one(g.coordinates) };
    if (g.type === "MultiLineString") return { ...g, coordinates: g.coordinates.map(one) };
    return g;
  }

  // world-atlas gives a dependency its sovereign's id (Ashmore and Cartier Is.
  // = 036 like Australia) and no id at all to disputed areas (Kosovo, Somaliland,
  // N. Cyprus, Siachen). Merge same-id features into one MultiPolygon; drop the
  // id-less ones (they can't be asked about anyway).
  const byId = new Map();
  for (const f of feats) {
    if (f.id == null) continue;
    const id = String(f.id).padStart(3, "0");
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
    const cur = byId.get(id);
    if (cur) cur.geometry.coordinates.push(...polys);
    else byId.set(id, { type: "Feature", id, properties: f.properties || {}, geometry: { type: "MultiPolygon", coordinates: [...polys] } });
  }
  const out = { type: "FeatureCollection", features: [...byId.values()].map((f) => ({
    ...f, geometry: simplifyGeom(f.geometry, 0.08),
  })) };

  // fit the *sphere* so the projection frame is stable and Antarctica keeps its place
  const proj = geoEqualEarth().fitExtent([[4, 4], [W - 4, H - 4]], { type: "Sphere" });
  const gpath = geoPath(proj);
  const rnd = (n) => Math.round(n * 10) / 10;

  const paths = {};
  const labels = {};
  const dots = {};
  for (const f of out.features) {
    const id = String(f.id == null ? "" : f.id).padStart(3, "0");
    paths[id] = gpath(f.geometry) || "";
    // label the mainland: the centroid of a MultiPolygon is dragged by far-off
    // territories (French Guiana pulled France into the Bay of Biscay, Alaska
    // pulled the USA west, Svalbard pulled Norway north)
    let g = f.geometry;
    if (g.type === "MultiPolygon") {
      const biggest = g.coordinates.reduce((best, poly) => {
        const a = gpath.area({ type: "Polygon", coordinates: poly });
        return a > best.a ? { a, poly } : best;
      }, { a: -1, poly: null });
      if (biggest.poly) g = { type: "Polygon", coordinates: biggest.poly };
    }
    const c = gpath.centroid(g);
    labels[id] = c ? [Math.round(c[0]), Math.round(c[1])] : null;
    // too small to tap at 900 px wide → the engine also draws a marker dot
    const mb = gpath.bounds(g);
    if (mb && (mb[1][0] - mb[0][0] < 5 || mb[1][1] - mb[0][1] < 5) && c) dots[id] = [rnd(c[0]), rnd(c[1])];
  }
  for (const [id, lonlat] of Object.entries(MISSING_AT_50M)) {
    if (paths[id]) continue;
    const [x, y] = proj(lonlat);
    paths[id] = `M${rnd(x - 1.2)},${rnd(y - 1.2)}L${rnd(x + 1.2)},${rnd(y - 1.2)}L${rnd(x + 1.2)},${rnd(y + 1.2)}L${rnd(x - 1.2)},${rnd(y + 1.2)}Z`;
    labels[id] = [Math.round(x), Math.round(y)];
    dots[id] = [rnd(x), rnd(y)];
  }

  // sphere outline (so the atlas shape reads as a globe on the water)
  const sphere = gpath({ type: "Sphere" });
  // graticule every 30°
  const grat = gpath(geoGraticule().step([30, 30])());

  // rivers: the important ones (scalerank ≤ 4), simplified; keep names for a future "which river?"
  const riversSrc = load("ne-rivers-50m.geojson");
  const rivers = [];
  for (const f of riversSrc.features) {
    const p = f.properties || {};
    if (p.scalerank > 4) continue;
    const d = gpath(simplifyLine(f.geometry, 0.12));
    if (!d) continue;
    rivers.push({ n: p.name || "", d });
  }
  // lakes: anything that covers ≥ 6 px² on this map
  const lakesSrc = load("ne-lakes-50m.geojson");
  const lakes = [];
  for (const f of lakesSrc.features) {
    const a = gpath.area(f.geometry);
    if (a < 6) continue;
    const d = gpath(simplifyGeom(f.geometry, 0.08));
    if (d) lakes.push({ n: (f.properties || {}).name || "", d });
  }
  const oceanLabels = OCEAN_LABELS.map(([lon, lat, en, bn, kind]) => {
    const [x, y] = proj([lon, lat]);
    return { x: Math.round(x), y: Math.round(y), en, bn, kind };
  });

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
  svg += `  <path d="${sphere}" fill="#CFE8F3"/>\n`;
  for (const id of Object.keys(paths)) {
    if (!paths[id]) continue;
    svg += `  <path id="wr-${id}" data-id="${id}" d="${paths[id]}" fill="#DCEFD6" stroke="#0E3B2E" stroke-width="0.5" stroke-linejoin="round"/>\n`;
  }
  for (const l of lakes) svg += `  <path d="${l.d}" fill="#CFE8F3"/>\n`;
  for (const r of rivers) svg += `  <path d="${r.d}" fill="none" stroke="#6FB7DA" stroke-width="0.6"/>\n`;
  svg += `</svg>\n`;

  writeFileSync(ASSETS + "world-map.svg", svg);
  writeFileSync(
    ASSETS + "world-map-data.js",
    "/* GENERATED by scripts/maps.mjs. Natural Earth 1:50m, Equal Earth projection, ids are ISO 3166-1 numeric codes. */\n" +
      "var WORLD_MAP = " + JSON.stringify(paths, null, 1) + ";\n" +
      "var WORLD_LABELS = " + JSON.stringify(labels, null, 1) + ";\n" +
      "var WORLD_DOTS = " + JSON.stringify(dots) + ";\n" +
      "var WORLD_SPHERE = " + JSON.stringify(sphere) + ";\n" +
      "var WORLD_GRAT = " + JSON.stringify(grat) + ";\n" +
      "var WORLD_RIVERS = " + JSON.stringify(rivers) + ";\n" +
      "var WORLD_LAKES = " + JSON.stringify(lakes) + ";\n" +
      "var WORLD_TEXT = " + JSON.stringify(oceanLabels) + ";\n"
  );
  console.log(`wrote world-map.svg + world-map-data.js (${Object.keys(paths).length} countries, ${Object.keys(dots).length} dots, ${rivers.length} river segments, ${lakes.length} lakes)`);
}

/* ---------- Bangladesh districts ---------- */
const DISTRICT_RENAME = {
  "Chittagong": "Chattogram", "Barisal": "Barishal",
};
// Map official GeoJSON district_name -> slug id (must match districts.mjs)
const DISTRICT_SLUG = {
  "Bagerhat":"bagerhat","Bandarban":"bandarban","Barguna":"barguna","Barishal":"barishal",
  "Bhola":"bhola","Bogura":"bogura","Brahmanbaria":"brahmanbaria","Chandpur":"chandpur",
  "Chattogram":"chattogram","Chuadanga":"chuadanga","Cumilla":"cumilla",
  "Cox's Bazar":"coxsbazar","Dhaka":"dhaka","Dinajpur":"dinajpur","Faridpur":"faridpur",
  "Feni":"feni","Gaibandha":"gaibandha","Gazipur":"gazipur","Gopalganj":"gopalganj",
  "Habiganj":"habiganj","Jaipurhat":"joypurhat","Jamalpur":"jamalpur","Jashore":"jashore",
  "Jhalokati":"jhalokati","Jhenaidah":"jhenaidah","Khagrachari":"khagrachari",
  "Khulna":"khulna","Kishoreganj":"kishoreganj","Kurigram":"kurigram","Kushtia":"kushtia",
  "Lakshmipur":"lakshmipur","Lalmonirhat":"lalmonirhat","Madaripur":"madaripur",
  "Magura":"magura","Manikganj":"manikganj","Maulvibazar":"maulvibazar",
  "Meherpur":"meherpur","Munshiganj":"munshiganj","Mymensingh":"mymensingh",
  "Naogaon":"naogaon","Narail":"narail","Narayanganj":"narayanganj",
  "Narsingdi":"narsingdi","Natore":"natore","Netrokona":"netrokona",
  "Nilphamari":"nilphamari","Noakhali":"noakhali","Pabna":"pabna","Panchagarh":"panchagarh",
  "Patuakhali":"patuakhali","Pirojpur":"pirojpur","Rajbari":"rajbari","Rajshahi":"rajshahi",
  "Rangamati":"rangamati","Rangpur":"rangpur","Satkhira":"satkhira",
  "Shariatpur":"shariatpur","Sherpur":"sherpur","Sirajgonj":"sirajgonj",
  "Sunamganj":"sunamganj","Sylhet":"sylhet","Tangail":"tangail",
  "Thakurgaon":"thakurgaon","Nawabganj":"nawabganj",
};
function bdDistrictBuild() {
  const fc = loadUpazilas();
  const named = {}, unnamed = [];
  for (const f of fc.features) {
    const raw = String(f.properties.district_name || "").trim();
    if (!raw) { unnamed.push(f); continue; }
    const name = DISTRICT_RENAME[raw] || raw;
    (named[name] ||= []).push(f);
  }
  const names = Object.keys(named).sort();
  console.log("districts:", names.length, names.join(", "));

  const dissolved = {};
  for (const name of names) {
    const start = Date.now();
    dissolved[name] = dissolveDivision(named[name]);
    console.log("  dissolve", name, "->", dissolved[name].length, "shape(s) in", ((Date.now() - start) / 1000).toFixed(1), "s");
  }

  // assign unnamed city polygons to nearest district
  if (unnamed.length) {
    const distFeat = Object.entries(dissolved).map(([n, feats]) => ({ n, feats }));
    let assigned = 0;
    for (const f of unnamed) {
      const pt = turf.centroid({ type: "Feature", properties: {}, geometry: f.geometry });
      let hit = distFeat.find((x) => x.feats.some((poly) => turf.booleanPointInPolygon(pt, poly)));
      if (!hit) {
        let best = null, bestD = Infinity;
        for (const x of distFeat) {
          for (const poly of x.feats) {
            const d = turf.pointToPolygonDistance(pt, poly, { units: "kilometers" });
            if (d < bestD) { bestD = d; best = x; }
          }
        }
        hit = best;
      }
      if (hit) { (named[hit.n] ||= []).push(f); assigned++; }
    }
    console.log("assigned", assigned, "city polygons to districts");
  }

  // final dissolve + stamp district property
  const allDist = [];
  for (const name of names) {
    const parts = dissolveDivision(named[name]);
    for (const p of parts) { p.properties = { district: name }; allDist.push(p); }
  }
  const distFc = { type: "FeatureCollection", features: allDist };
  writeFileSync(CACHE + "bd-districts-dissolved.json", JSON.stringify(distFc));
  console.log("  dissolved FC:", allDist.length, "features,", (JSON.stringify(distFc).length / 1024).toFixed(0), "KB");

  // topological simplification (1% keeps tighter boundaries for 64 districts)
  execSync(
    `node "${rootPath}\\node_modules\\mapshaper\\bin\\mapshaper" "${CACHE}bd-districts-dissolved.json" -simplify 1% keep-shapes -clean -o format=geojson "${CACHE}bd-districts-simplified.json"`,
    { cwd: rootPath, stdio: ["ignore", "ignore", "pipe"] }
  );
  const simp = load("bd-districts-simplified.json");
  console.log("  simplified:", simp.features.length, "features,", (JSON.stringify(simp).length / 1024).toFixed(0), "KB");

  // reverse winding for d3 rendering (same as division build)
  for (const f of simp.features) {
    const c = f.geometry?.coordinates;
    if (!c) continue;
    const polygons = f.geometry.type === "Polygon" ? [c] : c;
    for (const poly of polygons) for (const ring of poly) ring.reverse();
  }

  // group by district
  const byDist = {};
  for (const f of simp.features) {
    const name = String(f.properties?.district || "").trim();
    if (!name) continue;
    (byDist[name] ||= []).push(f);
  }

  // project (use same extent as division map for consistent viewport)
  const all = { type: "FeatureCollection", features: Object.values(byDist).flat() };
  const proj = geoMercator().fitExtent([[6, 6], [634, 834]], all);
  const paths = {};
  const labels = {};
  const gpath = geoPath(proj);
  for (const name of Object.keys(byDist).sort()) {
    const parts = [];
    for (const f of byDist[name]) {
      const g = f.geometry;
      if (!g) continue;
      if (g.type === "Polygon") parts.push(g.coordinates);
      else if (g.type === "MultiPolygon") parts.push(...g.coordinates);
    }
    const full = { type: "MultiPolygon", coordinates: parts };
    const d = gpath(full) || "";
    const c = gpath.centroid(full) || gpath.bounds(full)[0];
    const slug = DISTRICT_SLUG[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    paths[slug] = d;
    labels[slug] = c ? [Math.round(c[0]), Math.round(c[1])] : [320, 420];
  }

  // district palette: per-division colour with light tint for each district inside
  const divPalette = {
    barishal:"#E9C46A", chattogram:"#2FA56A", dhaka:"#F49B1F",
    khulna:"#2C6E8A", mymensingh:"#6A5ACD", rajshahi:"#C0392B",
    rangpur:"#189AB4", sylhet:"#8D6E63",
  };
  // lightness offset per district within its division (0..5 shades)
  const divCount = {};
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 840" width="640" height="840">\n`;
  for (const slug of Object.keys(paths).sort()) {
    if (!paths[slug]) continue;
    // find division for this district (from districts.mjs data)
    const drec = DISTRICTS.find((d) => d.id === slug);
    const divId = drec ? drec.div : "";
    const base = divPalette[divId] || "#DCEFD6";
    // compute tint: each district within division gets slightly lighter
    const idx = (divCount[divId] = (divCount[divId] || 0));
    divCount[divId] = idx + 1;
    const light = 1 - idx * 0.06;
    const fill = adjustLightness(base, light);
    svg += `  <path id="bd-${slug}" data-name="${slug}" d="${paths[slug]}" fill="${fill}" stroke="#0E3B2E" stroke-width="1.3" stroke-linejoin="round"/>\n`;
  }
  svg += `</svg>\n`;
  writeFileSync(ASSETS + "bd-district-map.svg", svg);
  writeFileSync(
    ASSETS + "bd-district-map-data.js",
    "/* GENERATED by scripts/maps.mjs. WGS84 upazila source dissolved into 64 districts. */\n" +
      "var BD_MAP_D = " + JSON.stringify(paths, null, 1) + ";\n" +
      "var BD_LABELS_D = " + JSON.stringify(labels, null, 1) + ";\n"
  );
  console.log("wrote bd-district-map.svg + bd-district-map-data.js");
}

// Simple hex color lightness adjustment: light=1 = original, <1 = lighter
function adjustLightness(hex, light) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const nr = Math.round(r + (255 - r) * (1 - light));
  const ng = Math.round(g + (255 - g) * (1 - light));
  const nb = Math.round(b + (255 - b) * (1 - light));
  return `#${nr.toString(16).padStart(2,"0")}${ng.toString(16).padStart(2,"0")}${nb.toString(16).padStart(2,"0")}`;
}

bdBuild();
bdDistrictBuild();
worldBuild();