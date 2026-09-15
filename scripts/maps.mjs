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
import { geoMercator, geoEquirectangular, geoPath } from "d3-geo";
import simplify from "simplify-js";
import { feature as topoFeature } from "topojson-client";

const CACHE = new URL("../.cache/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const ASSETS = new URL("../assets/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const rootPath = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1").replace(/[\\/]$/, "");

function load(name) {
  return JSON.parse(readFileSync(CACHE + name, "utf8"));
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
  const fc = load("bd-upazilas.geojson");
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

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 840" width="640" height="840">\n`;
  const palette = ["#DCEFD6", "#F7E3C0", "#CBEAE0", "#EAD9F0", "#F5D7D2", "#D8E4F3", "#F6E3B8", "#D3ECD1"];
  let i = 0;
  for (const name of Object.keys(paths)) {
    svg += `  <path id="bd-${slug(name)}" data-name="${name}" d="${paths[name]}" fill="${palette[i % palette.length]}" stroke="#0E3B2E" stroke-width="2" stroke-linejoin="round"/>\n`;
    if (labels[name]) svg += `  <text x="${labels[name][0]}" y="${labels[name][1]}" text-anchor="middle" font-size="20" font-weight="800" fill="#0E3B2E">${escXml(name)}</text>\n`;
    i++;
  }
  svg += `</svg>\n`;

  writeFileSync(ASSETS + "bd-map.svg", svg);
  writeFileSync(
    ASSETS + "bd-map-data.js",
    "/* GENERATED by scripts/maps.mjs. WGS84 upazila source dissolved into 8 divisions. */\n" +
      "var BD_MAP = " + JSON.stringify(paths, null, 1) + ";\n" +
      "var BD_LABELS = " + JSON.stringify(labels, null, 1) + ";\n"
  );
  console.log("wrote bd-map.svg + bd-map-data.js");
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function escXml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* ---------- World ---------- */
function worldBuild() {
  const topo = load("world-110m.json");
  const geo = topoFeature(topo, topo.objects.countries);
  const feats = geo.features;
  console.log("world features:", feats.length);

  // simplify each ring defensively (skip tiny <4-point rings)
  function simplifyGeom(g) {
    if (g.type === "Polygon") return { ...g, coordinates: simplifyRing(g.coordinates) };
    if (g.type === "MultiPolygon") return { ...g, coordinates: g.coordinates.map(simplifyRing) };
    return g;
  }
  function simplifyRing(rings) {
    return rings.map((ring) => {
      if (ring.length < 6) return ring;
      const pts = ring.map(([x, y]) => ({ x, y }));
      return simplify(pts, 0.15, true).map((p) => [p.x, p.y]);
    });
  }

  const out = { type: "FeatureCollection", features: feats.map((f) => ({
    type: "Feature", id: f.id, properties: f.properties || {}, geometry: simplifyGeom(f.geometry),
  })) };

  const W = 900, H = 460;
  const proj = geoEquirectangular().fitExtent([[4, 4], [W - 4, H - 4]], out);
  const gpath = geoPath(proj);

  const paths = {};
  const labels = {};
  for (const f of out.features) {
    const id = String(f.id == null ? "" : f.id).padStart(3, "0");
    paths[id] = gpath(f.geometry) || "";
    const c = gpath.centroid(f.geometry);
    labels[id] = c ? [Math.round(c[0]), Math.round(c[1])] : null;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
  for (const id of Object.keys(paths)) {
    if (!paths[id]) continue;
    svg += `  <path id="wr-${id}" data-id="${id}" d="${paths[id]}" fill="#DCEFD6" stroke="#0E3B2E" stroke-width="0.7" stroke-linejoin="round"/>\n`;
  }
  svg += `</svg>\n`;

  writeFileSync(ASSETS + "world-map.svg", svg);
  writeFileSync(
    ASSETS + "world-map-data.js",
    "/* GENERATED by scripts/maps.mjs. Natural Earth 1:110m, ids are ISO 3166-1 numeric codes. */\n" +
      "var WORLD_MAP = " + JSON.stringify(paths, null, 1) + ";\n" +
      "var WORLD_LABELS = " + JSON.stringify(labels, null, 1) + ";\n"
  );
  console.log("wrote world-map.svg + world-map-data.js");
}

bdBuild();
worldBuild();