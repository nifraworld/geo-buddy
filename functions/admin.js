/* GET /admin — Geo Buddy's admin page. Plain HTML + inline JS; every data
   call goes to /api/keys with the REVIEW_KEY the owner types in (kept in
   sessionStorage for the tab only). Keys are made on the server, so the
   LICENCE_SECRET is never in this page. Not cached by the service worker. */
export const onRequestGet = () =>
  new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Geo Buddy — Admin</title>
<style>
:root{--paper:#FFFDF6;--ink:#22231F;--soft:#57584F;--board:#0E3B2E;--board2:#15553F;--sun:#F49B1F;--good:#2FA56A;--bad:#D64545;--line:#E2D6B8;--inset:#FBF3E2;
  --mono:ui-monospace,Menlo,Consolas,monospace;--sans:system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans Bengali",sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--board);font-family:var(--sans);color:var(--paper);padding:20px 14px 60px}
.wrap{max-width:1040px;margin:0 auto}
h1{font-size:24px;margin:0 0 2px}
.sub{color:#B8D9C8;font-size:13px;margin-bottom:16px}
.card{background:var(--paper);color:var(--ink);border-radius:16px;padding:18px;margin-bottom:14px}
label{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--soft);margin:0 0 6px}
input,select,textarea{font:inherit;font-size:14px;padding:10px 12px;border:2px solid var(--line);border-radius:10px;background:var(--inset);color:var(--ink);width:100%}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--sun)}
button{font:inherit;font-weight:800;border:0;border-radius:10px;padding:10px 14px;cursor:pointer;background:var(--inset);color:var(--ink)}
button.go{background:var(--sun);color:#3A2B00}
button.ok{background:#DFF3E8;color:#15553F}
button.danger{background:#FDE9E9;color:var(--bad)}
button.mini{padding:5px 9px;font-size:12px}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:end}
.row>*{flex:1;min-width:150px}
.row>.fix{flex:0 0 auto;min-width:0}
.tabs{display:flex;gap:6px;margin:0 0 14px}
.tabs button{background:rgba(255,255,255,.12);color:#fff}
.tabs button.on{background:var(--paper);color:var(--board)}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);padding:8px 6px;border-bottom:2px solid var(--line)}
td{padding:9px 6px;border-bottom:1px solid #EDE7D7;vertical-align:top}
tr.unpaid td{background:#FFFBEB}
tr.revoked td{background:#FDE9E9}
.k{font-family:var(--mono);font-weight:700;letter-spacing:.05em;white-space:nowrap}
.tag{display:inline-block;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;background:var(--inset);color:var(--soft);margin-right:4px}
.tag.full{background:#DFF3E8;color:#15553F}.tag.grace{background:#FFF1D6;color:#8A5A00}.tag.free{background:#FDE9E9;color:var(--bad)}
.stats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.stat{background:var(--inset);border-radius:10px;padding:8px 12px;font-weight:800;font-size:13px}
.msg{background:var(--inset);border-radius:12px;padding:12px;margin-top:10px;white-space:pre-wrap;font-size:13px;line-height:1.55}
.note{font-size:12.5px;color:var(--soft);line-height:1.55}
.hidden{display:none}
details summary{cursor:pointer;font-weight:700;font-size:13px;color:var(--board2)}
.dev{font-size:12px;color:var(--soft);font-family:var(--mono)}
@media (max-width:640px){ table,thead,tbody,tr,td,th{display:block} th{display:none} td{border:none;padding:4px 0} tr{border-bottom:1px solid var(--line);padding:10px 0} }
</style></head><body><div class="wrap">
<h1>Geo Buddy — Admin</h1>
<div class="sub">Customers, keys and devices. Keys are made here on the server; nothing secret is in this page.</div>

<div class="card" id="login">
  <label>Admin password (REVIEW_KEY)</label>
  <div class="row"><input id="pw" type="password" autocomplete="current-password" placeholder="paste the REVIEW_KEY"><button class="go fix" onclick="login()">Open</button></div>
  <div class="note" style="margin-top:8px">Kept only for this browser tab.</div>
  <div id="loginerr" class="note" style="color:var(--bad)"></div>
</div>

<div id="app" class="hidden">
<div class="tabs">
  <button class="on" data-tab="customers" onclick="tab('customers')">Customers</button>
  <button data-tab="make" onclick="tab('make')">Make a key</button>
  <button data-tab="check" onclick="tab('check')">Check a key</button>
  <button data-tab="export" onclick="tab('export')">Export</button>
  <button class="fix" style="margin-left:auto;background:transparent;color:#B8D9C8" onclick="logout()">Lock</button>
</div>

<section id="tab-customers">
  <div class="card">
    <div class="stats" id="stats"></div>
    <div class="row">
      <input id="q" placeholder="Search email, phone, note, key…" oninput="draw()">
      <select id="filt" class="fix" onchange="draw()" style="width:auto">
        <option value="all">Everyone</option><option value="unpaid">Not paid</option><option value="paid">Paid</option>
        <option value="over">Over device limit</option><option value="revoked">Revoked</option>
      </select>
      <button class="fix" onclick="load()">↻ Refresh</button>
    </div>
    <div id="list" style="margin-top:10px"></div>
  </div>
</section>

<section id="tab-make" class="hidden">
  <div class="card">
    <label>Buyer email</label>
    <input id="m-email" inputmode="email" placeholder="parent@example.com">
    <div class="row" style="margin-top:10px">
      <div><label>What they bought</label><select id="m-scope"><option value="bundle">Bundle (Bangladesh + World)</option><option value="bd">Bangladesh only</option><option value="wr">World only</option></select></div>
      <div><label>Plan</label><select id="m-limit"><option value="3">Home — 3 devices</option><option value="10">Family — 10</option><option value="25">Coaching — 25</option><option value="50">Coaching — 50</option><option value="999">Coaching — unlimited</option></select></div>
    </div>
    <div class="row" style="margin-top:10px">
      <div><label>WhatsApp</label><input id="m-phone" inputmode="tel" placeholder="017…"></div>
      <div><label>Note</label><input id="m-note" placeholder="school, referral, …"></div>
    </div>
    <button class="go" style="margin-top:12px;width:100%" onclick="make()">Make key</button>
    <div id="m-out"></div>
    <div class="note" style="margin-top:10px">The key is derived from the email, so the same buyer always gets the same key back. Making it again is harmless.</div>
  </div>
</section>

<section id="tab-check" class="hidden">
  <div class="card">
    <div class="row">
      <div><label>Email</label><input id="c-email" inputmode="email"></div>
      <div><label>Key</label><input id="c-key" class="k" placeholder="GB-XXXX-XXXX"></div>
      <button class="fix" onclick="check()">Check</button>
    </div>
    <div id="c-out" class="note" style="margin-top:10px"></div>
  </div>
</section>

<section id="tab-export" class="hidden">
  <div class="card">
    <div class="row"><button onclick="exportCSV()">Download CSV</button><button onclick="exportJSON()">Download JSON</button></div>
    <div class="note" style="margin-top:10px">Everything shown in Customers, as a file. The database in Cloudflare is the source of truth; this is your backup.</div>
  </div>
</section>
</div>

<script>
var KEY = ""; var ROWS = [];
try { KEY = sessionStorage.getItem("gbReview") || ""; } catch (e) {}
function api(method, body) {
  return fetch("/api/keys", { method: method, headers: { "content-type": "application/json", "x-review-key": KEY }, body: body ? JSON.stringify(body) : undefined })
    .then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); });
}
function login() {
  KEY = document.getElementById("pw").value.trim();
  if (!KEY) return;
  api("GET").then(function (j) {
    if (j._status === 401) { document.getElementById("loginerr").textContent = "Wrong password."; return; }
    if (j._status === 503) { document.getElementById("loginerr").textContent = j.error || "Backend not set up yet (D1 binding missing)."; return; }
    try { sessionStorage.setItem("gbReview", KEY); } catch (e) {}
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    got(j);
  }).catch(function () { document.getElementById("loginerr").textContent = "Could not reach /api/keys."; });
}
function logout() { KEY = ""; try { sessionStorage.removeItem("gbReview"); } catch (e) {} location.reload(); }
function tab(name) {
  document.querySelectorAll(".tabs [data-tab]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === name); });
  ["customers", "make", "check", "export"].forEach(function (n) { document.getElementById("tab-" + n).classList.toggle("hidden", n !== name); });
}
function load() { api("GET").then(got); }
function got(j) {
  if (!j.ok) { alert(j.error || "error"); return; }
  ROWS = j.keys || [];
  if (j.pending) document.getElementById("list").innerHTML = '<div class="note">' + esc(j.pending) + "</div>";
  draw();
}
function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function planName(n) { return n <= 3 ? "Home · 3" : n <= 10 ? "Family · " + n : n >= 999 ? "Coaching · ∞" : "Coaching · " + n; }
function waMsg(r) {
  return "Geo Buddy activation\\nEmail: " + r.email + "\\nKey: " + r.key + "\\nPlan: " + planName(r.device_limit) + (r.scope !== "bundle" ? " (" + (r.scope === "bd" ? "Bangladesh" : "World") + ")" : "") +
    "\\n\\nOpen the app → Parent Zone → Licence → type the email and key → Activate. Works offline after that.";
}
function waLink(r) {
  var ph = String(r.phone || "").replace(/[^0-9]/g, "");
  if (ph.length === 11 && ph.charAt(0) === "0") ph = "88" + ph;
  return ph ? "https://wa.me/" + ph + "?text=" + encodeURIComponent(waMsg(r)) : "";
}
function draw() {
  var q = (document.getElementById("q").value || "").trim().toLowerCase();
  var f = document.getElementById("filt").value;
  var rows = ROWS.filter(function (r) {
    if (f === "unpaid" && r.paid) return false; if (f === "paid" && !r.paid) return false;
    if (f === "over" && !r.over) return false; if (f === "revoked" && !r.revoked) return false;
    if (!q) return true;
    return (r.email + " " + r.phone + " " + r.note + " " + r.key + " " + r.plan).toLowerCase().indexOf(q) >= 0;
  });
  var paid = ROWS.filter(function (r) { return r.paid; }).length, over = ROWS.filter(function (r) { return r.over; }).length;
  var devices = ROWS.reduce(function (s, r) { return s + r.deviceCount; }, 0);
  document.getElementById("stats").innerHTML =
    '<span class="stat">' + ROWS.length + " customers</span>" + '<span class="stat">' + paid + " paid</span>" +
    '<span class="stat">' + devices + " devices</span>" + (over ? '<span class="stat" style="background:#FFF1D6">' + over + " over limit</span>" : "");
  if (!ROWS.length) { if (!document.getElementById("list").innerHTML) document.getElementById("list").innerHTML = '<div class="note">No customers yet. Make a key.</div>'; return; }
  document.getElementById("list").innerHTML = rows.length ? "<table><thead><tr><th>Customer</th><th>Key</th><th>Plan</th><th>Paid</th><th>Devices</th><th></th></tr></thead><tbody>" +
    rows.map(function (r) {
      var i = ROWS.indexOf(r);
      return '<tr class="' + (r.revoked ? "revoked" : r.paid ? "" : "unpaid") + '">' +
        "<td><b>" + esc(r.email) + "</b><br>" +
          '<input value="' + esc(r.phone) + '" placeholder="WhatsApp 017…" style="width:150px;padding:5px 8px;font-size:12px;margin-top:4px" onchange="upd(' + i + ",'phone',this.value)\\">" +
          '<input value="' + esc(r.note) + '" placeholder="note" style="width:150px;padding:5px 8px;font-size:12px;margin-top:4px" onchange="upd(' + i + ",'note',this.value)\\">" +
          '<div class="note">' + esc((r.created || "").slice(0, 10)) + "</div></td>" +
        '<td><span class="k">' + esc(r.key) + "</span> " + '<button class="mini" onclick="copy(\\'' + esc(r.key) + "\\',this)\\">Copy</button>" +
          '<div class="note">' + (r.scope === "bundle" ? "BD + World" : r.scope === "bd" ? "Bangladesh" : "World") + " · teacher " + '<span class="k" style="font-weight:600">' + esc(r.teacher_code) + "</span></div>" +
          (waLink(r) ? '<a class="mini" style="display:inline-block;margin-top:4px;background:#DFF3E8;color:#15553F;border-radius:8px;padding:4px 8px;font-size:12px;font-weight:800;text-decoration:none" target="_blank" rel="noopener" href="' + waLink(r) + '">WhatsApp key</a>' : "") + "</td>" +
        "<td>" + '<select style="padding:4px;font-size:12px;width:130px" onchange="upd(' + i + ",'device_limit',parseInt(this.value)||3)\\">" +
            [3, 10, 25, 50, 999].map(function (n) { return '<option value="' + n + '"' + (r.device_limit === n ? " selected" : "") + ">" + planName(n) + "</option>"; }).join("") + "</select>" +
          '<select style="padding:4px;font-size:12px;width:130px;margin-top:4px" onchange="upd(' + i + ",'scope',this.value)\\">" +
            [["bundle", "BD + World"], ["bd", "Bangladesh"], ["wr", "World"]].map(function (o) { return '<option value="' + o[0] + '"' + (r.scope === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
          (r.revoked ? '<div><span class="tag free">revoked</span></div>' : "") + "</td>" +
        '<td><label style="font-size:12px;font-weight:700;text-transform:none;letter-spacing:0;display:flex;gap:6px;align-items:center"><input type="checkbox" style="width:auto" ' + (r.paid ? "checked" : "") + ' onchange="upd(' + i + ",'paid',this.checked)\\"> paid</label>" +
          '<input value="' + esc(r.amount) + '" placeholder="৳" style="width:70px;padding:4px 6px;font-size:12px;margin-top:4px" onchange="upd(' + i + ",'amount',this.value)\\">" +
          '<select style="padding:4px;font-size:12px;width:90px;margin-top:4px" onchange="upd(' + i + ",'pay_via',this.value)\\">" +
            ["", "bKash", "Nagad", "Rocket", "Bank", "Cash"].map(function (v) { return '<option value="' + v + '"' + (r.pay_via === v ? " selected" : "") + ">" + (v || "via…") + "</option>"; }).join("") + "</select></td>" +
        "<td>" + r.deviceCount + " / " + (r.device_limit >= 999 ? "∞" : r.device_limit) + (r.over ? ' <span class="tag grace">over</span>' : "") +
          (r.devices.length ? "<details><summary>devices</summary>" + r.devices.map(function (d) {
            return '<div class="dev"><span class="tag ' + d.status + '">' + d.status + "</span>" + esc(d.device) + " · v" + esc(d.app_version || "?") + " · " + esc((d.last_seen || "").slice(0, 10)) +
              (d.override ? " · override " + d.override : "") +
              ' <button class="mini" onclick="ov(' + i + ",'" + esc(d.device) + "','full')\\">full</button>" + '<button class="mini" onclick="ov(' + i + ",'" + esc(d.device) + "','free')\\">free</button>" +
              (d.override ? '<button class="mini" onclick="ov(' + i + ",'" + esc(d.device) + "','clear')\\">clear</button>" : "") + "</div>";
          }).join("") + "</details>" : "") + "</td>" +
        "<td>" + '<button class="mini ' + (r.revoked ? "ok" : "danger") + '" onclick="upd(' + i + ",'revoked'," + (r.revoked ? "false" : "true") + ')">' + (r.revoked ? "Restore" : "Revoke") + "</button>" +
          '<button class="mini danger" style="margin-top:4px" onclick="del(' + i + ')">Delete</button></td></tr>';
    }).join("") + "</tbody></table>" : '<div class="note">Nothing matches.</div>';
}
function upd(i, field, value) {
  var r = ROWS[i]; var body = { action: "customer", email: r.email }; body[field] = value;
  api("POST", body).then(function (j) { if (!j.ok) alert(j.error || "error"); else { r[field] = value; if (field === "revoked" || field === "device_limit" || field === "scope") load(); else draw(); } });
}
function ov(i, device, o) { api("POST", { email: ROWS[i].email, device: device, override: o }).then(load); }
function del(i) { var r = ROWS[i]; if (!confirm("Delete " + r.email + " and all their device rows? Their key still validates until you also revoke — delete is for mistakes, revoke is for refunds.")) return; api("POST", { action: "delete", email: r.email }).then(load); }
function copy(t, btn) { navigator.clipboard.writeText(t).then(function () { var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = o; }, 1200); }, function () { prompt("Copy:", t); }); }
function make() {
  var email = document.getElementById("m-email").value.trim().toLowerCase();
  if (email.indexOf("@") < 1) { alert("Email needed."); return; }
  api("POST", { action: "make", email: email, scope: document.getElementById("m-scope").value, device_limit: parseInt(document.getElementById("m-limit").value, 10),
    phone: document.getElementById("m-phone").value, note: document.getElementById("m-note").value }).then(function (j) {
    if (!j.ok) { alert(j.error || "error"); return; }
    var r = { email: j.email, key: j.key, device_limit: j.device_limit, scope: j.scope, phone: document.getElementById("m-phone").value };
    document.getElementById("m-out").innerHTML = '<div class="msg"><b class="k" style="font-size:18px">' + esc(j.key) + "</b>   teacher code " + '<span class="k">' + esc(j.teacher_code) + "</span>\\n\\n" + esc(waMsg(r)) + "</div>" +
      '<div class="row" style="margin-top:8px"><button onclick="copy(\\'' + esc(j.key) + "\\',this)\\">Copy key</button>" + '<button onclick="copy(document.getElementById(\\'m-out\\').querySelector(\\'.msg\\').innerText.split(\\'\\\\n\\\\n\\').slice(1).join(\\'\\\\n\\\\n\\'),this)">Copy message</button>' +
      (waLink(r) ? '<a class="go" style="text-align:center;text-decoration:none;border-radius:10px;padding:10px 14px;font-weight:800;color:#3A2B00" target="_blank" rel="noopener" href="' + waLink(r) + '">Send on WhatsApp</a>' : "") + "</div>";
    load();
  });
}
function check() {
  api("POST", { action: "check", email: document.getElementById("c-email").value, key: document.getElementById("c-key").value }).then(function (j) {
    if (!j.ok) { document.getElementById("c-out").textContent = j.error || "error"; return; }
    document.getElementById("c-out").innerHTML = j.valid ? '<b style="color:var(--good)">Valid</b> — unlocks ' + esc(j.scope) : '<b style="color:var(--bad)">Not valid.</b> Bundle key for this email: <span class="k">' + esc(j.bundleKey) + "</span>";
  });
}
function exportCSV() {
  var head = ["email", "key", "scope", "plan", "device_limit", "devices", "paid", "amount", "pay_via", "whatsapp", "note", "revoked", "created"];
  var rows = ROWS.map(function (r) { return [r.email, r.key, r.scope, r.plan, r.device_limit, r.deviceCount, r.paid ? "yes" : "no", r.amount, r.pay_via, r.phone, r.note, r.revoked ? "yes" : "no", r.created]; });
  var csv = [head].concat(rows).map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\\n");
  dl("geo-buddy-customers.csv", csv, "text/csv");
}
function exportJSON() { dl("geo-buddy-customers.json", JSON.stringify(ROWS, null, 1), "application/json"); }
function dl(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000); }
document.getElementById("pw").addEventListener("keydown", function (e) { if (e.key === "Enter") login(); });
if (KEY) { document.getElementById("pw").value = KEY; login(); }
</script>
</div></body></html>`;
