/* v2.2: pre-recorded Bangla name audio — Bangla TTS is missing or robotic on
   many cheap Android phones, so the app plays a clip when one exists and only
   falls back to the phone's own voice when it doesn't.

   Source: Google Cloud Text-to-Speech (bn-IN WaveNet). Needs an API key with
   the Text-to-Speech API enabled:  set GOOGLE_TTS_KEY=… && npm run audio
   (~470 short phrases ≈ 7,000 characters — far inside the free monthly tier).
   Output: assets/audio/bn/<hash>.ogg (Opus) + manifest.json { text → file }.
   Re-runs only synthesise phrases that have no clip yet, so fixing one name
   never re-bills the whole set. Not precached; Parent Zone → offline packs. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "assets", "audio", "bn");
const KEY = process.env.GOOGLE_TTS_KEY || "";
const VOICE = process.env.GOOGLE_TTS_VOICE || "bn-IN-Wavenet-A"; // A = female, B = male
const RATE = 0.92;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* the phrases the app speaks in Bangla: every name it can say, plus Bagha's lines */
function collectPhrases() {
  const src = fs.readFileSync(path.join(root, "geo-data.js"), "utf8");
  // geo-data.js is an ES module: `export const GEO = {…}` — evaluate it in isolation
  const geo = new Function(src.replace(/export\s+const\s+GEO\s*=/, "return ") .replace(/export\s+[^;]+;/g, ""))();
  const eng = fs.readFileSync(path.join(root, "src", "engine.js"), "utf8");
  const bnBlock = eng.slice(eng.indexOf("  bn: {"), eng.indexOf("\n  },\n", eng.indexOf("  bn: {")));
  const ui = (k) => { const m = bnBlock.match(new RegExp("\\b" + k + ':\\s*"([^"]+)"')); return m ? m[1] : null; };
  const set = new Set();
  for (const c of geo.countries) { set.add(c.bn); if (c.capitalBn) set.add(c.capitalBn); }
  for (const d of geo.divisions) { set.add(d.bn); if (d.hqBn) set.add(d.hqBn); }
  for (const d of geo.districts) set.add(d.bn);
  for (const r of geo.regions) set.add(r.bn);
  for (const k of ["hello", "helloDone", "correct", "wrong", "tipDaily", "tipWeak", "tipExplore", "again", "welcome.start"]) { const v = ui(k); if (v) set.add(v); }
  return [...set].map((s) => String(s).normalize("NFC").trim()).filter((s) => s && /[ঀ-৿]/.test(s));
}
/* same hash as the engine's audioKey(): FNV-1a 32-bit over UTF-16 code units */
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }

async function synth(text) {
  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + KEY, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { text }, voice: { languageCode: "bn-IN", name: VOICE }, audioConfig: { audioEncoding: "OGG_OPUS", speakingRate: RATE, sampleRateHertz: 24000 } }),
  });
  if (!res.ok) throw new Error("TTS HTTP " + res.status + " " + (await res.text()).slice(0, 200));
  return Buffer.from((await res.json()).audioContent, "base64");
}

fs.mkdirSync(OUT, { recursive: true });
const phrases = collectPhrases();
const manifestPath = path.join(OUT, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : { v: 1, voice: VOICE, files: {} };
const todo = phrases.filter((p) => !manifest.files[p] || !fs.existsSync(path.join(OUT, manifest.files[p])));
console.log(`audio: ${phrases.length} Bangla phrases, ${todo.length} without a clip`);
if (todo.length && !KEY) {
  console.log("  GOOGLE_TTS_KEY not set — nothing synthesised. Set it and run again to make the clips.");
  process.exit(0);
}
let n = 0, failed = 0;
for (const text of todo) {
  const file = hash(text) + ".ogg";
  try {
    fs.writeFileSync(path.join(OUT, file), await synth(text));
    manifest.files[text] = file;
    n++;
    if (n % 25 === 0) { console.log(`  ${n}/${todo.length}`); fs.writeFileSync(manifestPath, JSON.stringify(manifest)); }
  } catch (e) { failed++; console.warn(`  ! ${text}: ${e.message}`); }
  await sleep(60);
}
manifest.bytes = Object.values(manifest.files).reduce((a, f) => a + (fs.existsSync(path.join(OUT, f)) ? fs.statSync(path.join(OUT, f)).size : 0), 0);
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`audio: ${Object.keys(manifest.files).length} clips (${n} new, ${failed} failed), ${(manifest.bytes / 1024 / 1024).toFixed(1)} MB`);
