/* Downloads the raw geographic data sources into .cache/ (not shipped).
   Sources are fixed versions where possible; each file records provenance. */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const CACHE_DIR = new URL("../.cache/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(CACHE_DIR, { recursive: true });

const SOURCES = {
  // Download link normalized (HTML unescape + trim).
  "bd-upazilas.geojson": {
    url: "https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/src/data/bangladesh.geojson",
    desc: "Bangladesh upazila-level polygons in WGS84 (CRS84). Source: ifahimreza/bangladesh-geojson (BSD-3).",
  },
  "world-110m.json": {
    url: "https://unpkg.com/world-atlas@2.0.2/countries-110m.json",
    desc: "Natural Earth 1:110m country boundaries as TopoJSON. Public domain (Natural Earth).",
  },
  "world-50m.json": {
    url: "https://unpkg.com/world-atlas@2.0.2/countries-50m.json",
    desc: "Natural Earth 1:50m country boundaries as TopoJSON. Public domain (Natural Earth). v2.1: replaces 110m so small countries exist on the map.",
  },
  "ne-rivers-50m.geojson": {
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson",
    desc: "Natural Earth 1:50m rivers and lake centerlines. Public domain (Natural Earth).",
  },
  "ne-lakes-50m.geojson": {
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson",
    desc: "Natural Earth 1:50m lakes. Public domain (Natural Earth).",
  },
  "ne-rivers-10m.geojson": {
    url: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson",
    desc: "Natural Earth 1:10m rivers and lake centerlines — clipped to Bangladesh at build time. Public domain (Natural Earth).",
  },
  "countries.json": {
    url: "https://raw.githubusercontent.com/mledoze/countries/master/dist/countries.json",
    desc: "Country facts (name, capital, region, ISO codes). Dataset (c) mledoze/countries, ODbL. Attribution shown in About.",
  },
};

function get(url) {
  return new Promise((resolve, reject) => {
    const req = createRequire(import.meta.url);
    // Use global fetch (Node >=18).
    if (!globalThis.fetch) reject(new Error("No fetch in this Node"));
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 120000);
    fetch(url, { signal: ac.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
        return r.arrayBuffer();
      })
      .then((buf) => { clearTimeout(t); resolve(Buffer.from(buf)); })
      .catch((e) => { clearTimeout(t); reject(e); });
  });
}

for (const [name, meta] of Object.entries(SOURCES)) {
  const dest = CACHE_DIR + name;
  if (existsSync(dest)) { console.log("cached:", name); continue; }
  console.log("fetching:", name, " ←", meta.url);
  const buf = await get(meta.url);
  writeFileSync(dest, buf);
  console.log("  wrote", (buf.length / 1024).toFixed(1), "KB");
  writeFileSync(CACHE_DIR + name + ".src.txt", meta.desc + "\n" + meta.url);
}

// Fetch the service takes care of flags separately (per-country, many small files).
console.log("done. cache:", ".cache/");