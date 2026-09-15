/* Generate PWA icons (192, 512, maskable-512) from a simple SVG drawn in code. */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "assets", "icons");
fs.mkdirSync(outDir, { recursive: true });

const GREEN = "#0E3B2E";
const CREAM = "#FBF3E2";
const SUN = "#E5281E";
const SAFFRON = "#F49B1F";

function svg(size, maskable) {
  const pad = maskable ? size * 0.09 : 0; // maskable safe-zone padding
  const cx = size / 2;
  const cy = size / 2;
  const rGlobe = size * 0.28;
  const rSun = size * 0.10;
  const sunX = cx - rGlobe * 0.35;
  const sunY = cy - rGlobe * 0.35;
  const r = maskable ? 0 : size * 0.20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${maskable ? "" : `<rect width="${size}" height="${size}" fill="${GREEN}"/>`}
  <rect x="${pad}" y="${pad}" width="${size - 2 * pad}" height="${size - 2 * pad}" rx="${r}" fill="${GREEN}"/>
  <circle cx="${cx}" cy="${cy}" r="${rGlobe}" fill="${CREAM}"/>
  <circle cx="${sunX}" cy="${sunY}" r="${rSun}" fill="${SUN}"/>
  <circle cx="${sunX}" cy="${sunY}" r="${rSun}" fill="${SUN}" opacity="0.95"/>
  <circle cx="${cx + rGlobe * 0.32}" cy="${cy + rGlobe * 0.38}" r="${rGlobe * 0.42}" fill="none" stroke="${SAFFRON}" stroke-width="${size * 0.05}" stroke-linecap="round"/>
  <path d="M${cx + rGlobe * 0.3} ${cy + rGlobe * 0.1} q${rGlobe * 0.55} ${rGlobe * 0.55} 0 ${rGlobe * 0.8} q${-rGlobe * 0.55} ${-rGlobe * 0.62} 0 ${-rGlobe * 0.8}Z" fill="${GREEN}" opacity="0.9"/>
</svg>`;
}

async function render(size, name, maskable) {
  const buf = Buffer.from(svg(size, maskable));
  await sharp(buf).png().toFile(path.join(outDir, name));
  console.log("wrote", name);
}

await render(192, "icon-192.png", false);
await render(512, "icon-512.png", false);
await render(512, "maskable-512.png", true);
console.log("icons done");