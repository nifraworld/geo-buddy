/* Headless-Chrome UI check. Starts dev server + headless Chrome, drives harness,
   reads HARNESS-PASS/FAIL from the page. Exits non-zero on failure. */
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\//, "").replace(/\//g, "\\");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 4173;
const CDP = 9333;
const UD = `${process.env.TEMP || "C:\\Windows\\Temp"}\\gb-chrome-${randomUUID().slice(0, 8)}`;
const APP_URL = `http://127.0.0.1:${PORT}/test/harness.html`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpJson(method, endpoint, body) {
  const res = await fetch(`http://127.0.0.1:${CDP}${endpoint}`, body ? {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  } : { method });
  return res.json();
}

function onWs(ws, msg, cb) {
  ws.addEventListener("message", (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id === msg.id) cb(m);
  });
}
function wsEval(ws, id, expr) {
  return new Promise((res) => {
    onWs(ws, { id }, (m) => {
      const r = m.result && m.result.result;
      if (r && r.exceptionDetails) res("EVAL-ERROR: " + (r.result && r.result.description || "unknown"));
      else res(r && r.value);
    });
    ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true, awaitPromise: true } }));
  });
}

let server = null;
let chrome = null;
try {
  server = spawn("node", ["scripts/serve.mjs"], { cwd: ROOT, stdio: "ignore" });
  await sleep(1200);

  chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${CDP}`, `--user-data-dir=${UD}`, "about:blank",
  ], { stdio: "ignore" });

  // wait for the DevTools endpoint
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { await fetch(`http://127.0.0.1:${CDP}/json/version`); ready = true; break; } catch { await sleep(500); }
  }
  if (!ready) throw new Error("Chrome DevTools not ready");

  const target = await cdpJson("PUT", `/json/new?${encodeURIComponent(APP_URL)}`);
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });

let out = "";
  let title = "";
  for (let i = 0; i < 100; i++) {
    await sleep(350);
    out = String(await wsEval(ws, 1, `document.querySelector("#out") ? document.querySelector("#out").textContent : ""`));
    title = String(await wsEval(ws, 2, `document.title`));
    if (/HARNESS-(PASS|FAIL)/.test(out) || /HARNESS-(PASS|FAIL)/.test(title)) break;
  }
  console.log(out.split("\n").slice(0, 40).join("\n"));
  console.log("title:", title);
  ws.close();
  chrome.kill();
  server.kill();
  if (!/HARNESS-PASS/.test(out) && !/HARNESS-PASS/.test(title)) process.exit(1);
} catch (e) {
  console.error("browser-check failed:", e.message);
  try { chrome && chrome.kill(); } catch {}
  try { server && server.kill(); } catch {}
  process.exit(1);
}
