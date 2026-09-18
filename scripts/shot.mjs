/* Phone-sized screenshots of app screens in headless Chrome, for visual QA.
   Usage: node scripts/shot.mjs [screen[,screen…]] [--out DIR]
   Screens: any `go()` name (home, map, map:world, journey, explore, play…);
   "map:world" opens the world map, "map:dist" the district map,
   "detail:050" a country detail by numeric id, "explore:extras" the territories list.
   Writes DIR/<screen>.png (default: .shots/). Not part of the build. */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\//, "").replace(/\//g, "\\");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 4173, CDP = 9334;
const UD = `${process.env.TEMP || "C:\\Windows\\Temp"}\\gb-shot-${randomUUID().slice(0, 8)}`;
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 ? args[outIdx + 1] : ROOT + "\\.shots";
const screens = (args.filter((a, i) => a !== "--out" && !(outIdx >= 0 && i === outIdx + 1))[0] || "home,map,map:world,journey").split(",");
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let id = 0;
function send(ws, method, params = {}) {
  const msgId = ++id;
  return new Promise((res) => {
    const on = (ev) => { const m = JSON.parse(ev.data); if (m.id === msgId) { ws.removeEventListener("message", on); res(m.result); } };
    ws.addEventListener("message", on);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}
const evalJs = async (ws, expr) => (await send(ws, "Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

let server, chrome;
try {
  server = spawn("node", ["scripts/serve.mjs"], { cwd: ROOT, stdio: "ignore" });
  await sleep(1200);
  chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
    `--remote-debugging-port=${CDP}`, `--user-data-dir=${UD}`, "--window-size=390,844", "about:blank"], { stdio: "ignore" });
  for (let i = 0; i < 40; i++) { try { await fetch(`http://127.0.0.1:${CDP}/json/version`); break; } catch { await sleep(500); } }
  const target = await (await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(`http://127.0.0.1:${PORT}/`)}`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  await send(ws, "Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(1500);
  // a profile so child screens render; the engine keeps the store in localStorage
  await evalJs(ws, `(() => { try { const k = Object.keys(localStorage).find((x) => /geo/i.test(x)); } catch {} return 1; })()`);
  await evalJs(ws, `new Promise((r) => { const m = document.querySelector("[data-action=picklang][data-lang=en]"); if (m) m.click(); setTimeout(r, 500); })`);
  await evalJs(ws, `new Promise((r) => { const ok = document.querySelector("#nm-ok"); const inp = document.querySelector("#nm-inp, .modal input"); if (inp) inp.value = "Test"; if (ok) ok.click(); setTimeout(r, 500); })`);
  for (const sc of screens) {
    const [name, sub] = sc.split(":");
    const params = name === "map" && sub === "world" ? `{kind:"world"}` : name === "map" && sub === "dist" ? `{kind:"bd", level:"dist"}` : "{}";
    await evalJs(ws, `location.hash = ""; window.__go ? window.__go(${JSON.stringify(name)}, ${params}) : null; 1`);
    await evalJs(ws, `new Promise((r) => { const b = document.querySelector('[data-bnav="${name === "detail" ? "explore" : name}"], [data-nav="${name}"]'); if (b) b.click(); setTimeout(r, 300); })`);
    if (name === "map" && sub === "world") await evalJs(ws, `new Promise((r) => { const b = document.querySelector('[data-action="map-kind"][data-kind="world"]'); if (b) b.click(); setTimeout(r, 600); })`);
    if (name === "explore" && sub === "extras") { await evalJs(ws, `new Promise((r) => { const b = document.querySelector('[data-action="explore-scope"][data-scope="world"]'); if (b) b.click(); setTimeout(r, 400); })`); await evalJs(ws, `new Promise((r) => { const b = document.querySelector('[data-action="explore-region"][data-region="extras"]'); if (b) b.click(); setTimeout(r, 400); })`); await evalJs(ws, `new Promise((r) => { const b = document.querySelector('#explore-list .item'); if (b) b.click(); setTimeout(r, 400); })`); }
    if (name === "detail") { await evalJs(ws, `import("/src/engine.js").then((m) => { m.__test.go("detail", { kind: "c", id: "${sub || "050"}" }); return new Promise((r) => setTimeout(r, 700)); })`); await evalJs(ws, `window.scrollTo(0, 760); 1`); }
    if (name === "map" && sub === "dist") await evalJs(ws, `new Promise((r) => { const b = document.querySelector('[data-action="map-level"][data-level="dist"]'); if (b) b.click(); setTimeout(r, 600); })`);
    await sleep(900);
    const shot = await send(ws, "Page.captureScreenshot", { format: "png" });
    const file = `${OUT}\\${sc.replace(/[^a-z0-9]+/gi, "-")}.png`;
    writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log("wrote", file);
  }
  ws.close(); chrome.kill(); server.kill();
} catch (e) {
  console.error("shot failed:", e.message);
  try { chrome && chrome.kill(); } catch {}
  try { server && server.kill(); } catch {}
  process.exit(1);
}
