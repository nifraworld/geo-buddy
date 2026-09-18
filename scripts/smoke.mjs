// Minimal DOM stubs to import src/engine.js under Node and exercise pure logic
// (question building / daily seeding) without a browser.

function fakeEl(tag) {
  const el = {
    _inner: "",
    tagName: String(tag).toUpperCase(),
    style: {},
    dataset: {},
    id: "",
    set innerHTML(v) { this._inner = String(v); },
    get innerHTML() { return this._inner; },
    textContent: "",
    children: [],
    firstElementChild: null,
    getContext() {
      return {
        isPointInPath: () => false, setTransform() {}, clearRect() {}, fillRect() {},
        fill() {}, stroke() {}, beginPath() {}, fillText() {}, scale() {},
      };
    },
    addEventListener() {}, removeEventListener() {}, appendChild(c) { this.children.push(c); return c; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1, height: 1 }; },
    classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
    remove() {},
    focus() {},
    click() {},
    closest() { return null; },
  };
  return el;
}

const store = (() => {
  let v = null;
  return {
    getItem() { return v; },
    setItem(_k, s) { v = s; },
    removeItem() { v = null; },
  };
})();

globalThis.window = globalThis;
globalThis.scrollTo = () => {};
globalThis.document = {
  createElement(tag) {
    const el = fakeEl(tag);
    if (tag === "template") el.content = { firstElementChild: fakeEl("div") };
    return el;
  },
  getElementById: () => fakeEl("div"),
  addEventListener() {},
  body: fakeEl("body"),
  title: "",
};
globalThis.localStorage = store;
Object.defineProperty(globalThis, "navigator", { value: { onLine: true, serviceWorker: undefined, vibrate: undefined }, configurable: true });
Object.defineProperty(globalThis, "location", { value: { protocol: "http:" }, configurable: true });
globalThis.devicePixelRatio = 1;
globalThis.confirm = () => true;

// the world map globals (classic script in the browser) — evaluated the same way here
{
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../assets/world-map-data.js", import.meta.url), "utf8");
  new Function(src.replace(/\bvar (WORLD_\w+) =/g, "globalThis.$1 ="))();
}
const mod = await import("file:///D:/GeoBuddy/geo-data.js");
const engSrc = await import("file:///D:/GeoBuddy/src/engine.js");
const T = engSrc.__test;
const GEO = T.GEO;

let failures = 0;
const assert = (cond, msg) => {
  if (!cond) { failures++; console.error("FAIL:", msg); }
};

// sanity: known counts
assert(GEO.countries.length === 194, "194 countries");
assert(GEO.divisions.length === 8, "8 divisions");
assert(T.shuffle([1, 2, 3, 4]).length === 4, "shuffle length");

// daily: deterministic + 10 items
const a = T.buildDailyQuestions();
const b = T.buildDailyQuestions();
assert(a.length === 10, "daily has 10 questions");
try { assert(b.map((q) => q.answerId).join() === a.map((q) => q.answerId).join(), "daily deterministic"); }
catch (e) {}
for (const q of a) {
  assert(q.prompt && q.prompt.length > 0, "daily prompt present for " + JSON.stringify(q && q.type));
  if (q.kind !== "map") {
    assert(q.choices && q.choices.length === 4, "4 choices per non-map question");
    const ids = q.choices.map((c) => c.id);
    assert(new Set(ids).size === 4, "choices unique");
    assert(q.choices.some((c) => c.id === q.answerId), "answer included in choices");
  }
}
// no raw i18n keys or type ids leaking into what the child reads
// (would have caught the "qprompts.wf" / "bd-hq" prompts+choices of v1.0–1.4)
const RAW_KEY = /^[a-z]+\.[a-z-]+$|^(bd-hq|bd-fact|bd-find|bd-type|d-div|div-d|d-find|wf|wc|wh|hc|world-find|wn|wb|wt)$/;
const looksRaw = (s) => RAW_KEY.test(String(s || "").trim());
for (const ty of ["bd-hq", "bd-fact", "bd-find", "bd-type", "d-div", "div-d", "d-find", "wf", "wc", "wh", "hc", "world-find", "wn", "wb", "wt"]) {
  const qs = ty.startsWith("bd-") ? T.divQuestions(ty) : ty.startsWith("d") ? T.distQuestions(ty) : T.countryQuestions(ty);
  const q = qs[0];
  assert(q, ty + " builds at least one question");
  if (!q) continue;
  assert(!looksRaw(q.prompt), ty + " prompt is human text, got: " + q.prompt);
  if (q.choices) {
    assert(!q.choices.some((c) => looksRaw(c.label)), ty + " choice labels are human text, got: " + q.choices.map((c) => c.label).join(" | "));
    assert(new Set(q.choices.map((c) => c.label)).size === q.choices.length, ty + " choice labels distinct");
  }
}
// v1.7: typed answers, SRS, new types, decks
{
  assert(T.typedMatches("bangladesh", ["Bangladesh", "বাংলাদেশ"]), "typed exact (case)");
  assert(T.typedMatches("Bangladsh", ["Bangladesh"]), "typed one-letter slip accepted at 5+ letters");
  assert(!T.typedMatches("Bangla", ["Bangladesh"]), "typed truncation rejected");
  assert(T.typedMatches("বাংলাদেশ ", ["Bangladesh", "বাংলাদেশ"]), "typed Bangla exact after trim");
  assert(!T.typedMatches("Ind", ["Iran"]), "short typos rejected");
  assert(T.typedMatches("the gambia", ["Gambia"]), "leading 'the' tolerated");
  assert(T.typedMatches("Côte d'Ivoire", ["Côte d’Ivoire"]), "apostrophe variants");
  const wn = T.countryQuestions("wn"); const wb = T.countryQuestions("wb"); const wt = T.countryQuestions("wt"); const bt = T.divQuestions("bd-type");
  assert(wn.length > 100 && wn.every((q) => q.choices.length === 4 && q.choices.some((c) => c.id === q.answerId) && q.itemId), "wn builds with 4 choices + itemId");
  assert(wn.every((q) => { const c = GEO.countries.find((x) => x.id === q.itemId); const a = GEO.countries.find((x) => x.id === q.answerId); return c.neighbors.includes(a.en); }), "wn answer is a real neighbour");
  assert(wb.length > 150 && wb.every((q) => q.choices.length === 2), "wb builds with 2 choices");
  assert(wb.every((q) => { const [a, b] = q.choices.map((c) => GEO.countries.find((x) => x.id === c.id)); const big = a.area >= b.area ? a : b; return big.id === q.answerId; }), "wb answer is the larger area");
  assert(wt.length === 194 && wt.every((q) => q.kind === "type" && q.accept.length >= 2 && q.answerLabel), "wt typed questions");
  assert(bt.length === 8 && bt.every((q) => q.kind === "type"), "bd-type typed questions");
  // SRS: a correct answer schedules the item into the future; a miss makes it due now
  const p = T.profile() || T.newProfile("smoke");
  T.bumpItem(p, "c", "TEST1", true);
  const st = p.itemStats["c|TEST1"];
  assert(st.reps === 1 && st.ivl === 1 && st.due > Math.floor(Date.now() / 86400000), "srs: first correct -> due tomorrow");
  T.bumpItem(p, "c", "TEST1", true);
  assert(st.reps === 2 && st.ivl === 3, "srs: second correct -> 3 days");
  T.bumpItem(p, "c", "TEST1", false);
  assert(st.reps === 0 && st.due === Math.floor(Date.now() / 86400000), "srs: miss -> due today");
  assert(T.dueCount(p) >= 1, "dueCount counts due items");
  const wDue = T.srsWeight(p, { type: "wf", answerId: "TEST1" });
  const wNew = T.srsWeight(p, { type: "wf", answerId: "NEVER" });
  assert(wDue > wNew && wNew === 3, "srs: due item outweighs never-seen (" + wDue + " > " + wNew + ")");
  delete p.itemStats["c|TEST1"];
  // decks
  const dk = T.deckFor("dist", "rangpur");
  assert(dk.items.length === 8 && dk.items.every((i) => i.name && i.back.length), "district deck for Rangpur has 8 cards");
  const dq = T.buildQuestionList({ scope: "bd", types: ["d-div", "div-d"], count: 10, adaptive: true, items: new Set(dk.items.map((i) => i.id)) });
  assert(dq.length === 10 && dq.every((q) => dk.items.some((i) => i.id === (q.itemId || q.answerId))), "deck quiz restricted to the deck's items");
  const rg = T.deckFor("region", GEO.regions[0].id);
  assert(rg.items.length > 10 && rg.items[0].flag, "region deck has flags");
}
// v1.8: lock switch from sale.json
{
  assert(T.hasScope("bd") && T.lockMark("bd") === "", "open app: no lock marks");
  T.setLocked(true);
  assert(!T.hasScope("bd") && !T.hasScope("wr"), "locked without a key: scopes denied");
  assert(T.lockMark("world").indexOf("🔒") >= 0, "locked: lock mark rendered");
  const qs = T.buildQuestionList({ scope: "bd", types: ["bd-hq"], count: 3, adaptive: false });
  assert(qs.length === 3, "question building itself is not gated (gate is at session start)");
  T.setLocked(false);
  assert(T.hasScope("wr"), "unlocked again");
}
// v1.9: child summary for the class dashboard
{
  const p = T.profile() || T.newProfile("smoke2");
  p.name = "Test Kid"; p.stats.asked = 10; p.stats.correct = 7;
  p.itemStats["c|050"] = { a: 3, ok: 1 }; // Bangladesh id 050
  const c = T.childSummary(p);
  assert(c.name === "Test Kid" && c.accuracy === 70 && c.asked === 10, "childSummary basics");
  assert(Array.isArray(c.weak) && c.weak.includes("Bangladesh"), "childSummary lists weak items by name, got " + JSON.stringify(c.weak));
  assert(/^p[0-9a-z]+$/.test(c.hash) && c.areas.c.a >= 3, "childSummary hash + areas");
  delete p.itemStats["c|050"];
}
// builder for world types
for (const ty of ["wf", "wc", "wh", "hc", "world-find"]) {
  const qs = T.countryQuestions(ty);
  const mapped = GEO.countries.filter((c) => c.hasMap !== false).length;
  assert(qs.length === (ty === "world-find" ? mapped : 194), ty + " builds " + (ty === "world-find" ? mapped + " (mapped countries only)" : 194));
  if (ty === "world-find") assert(mapped === 194 && qs.every((q) => GEO.countries.find((c) => c.id === q.answerId).hasMap !== false), "v2.1: every UN member is on the 50m map (was 165 at 110m)");
  const q = qs[0];
  assert(q.type === ty, ty + " type kept");
  if (q.kind !== "map") {
    assert(q.choices.length === 4, ty + " 4 choices");
    assert(q.choices.some((c) => c.id === q.answerId), ty + " answer present");
  }
}
// BD builder
for (const ty of ["bd-hq", "bd-fact", "bd-find"]) {
  const qs = T.divQuestions(ty);
  assert(qs.length === 8, ty + " builds 8");
  const q = qs[0];
  if (q.kind !== "map") assert(q.choices.length === 4 && q.choices.some((c) => c.id === q.answerId), ty + " valid choices");
}
// full custom list
const list = T.buildQuestionList({ scope: "both", types: ["wf", "hc", "bd-find"], count: 12, adaptive: false });
assert(list.length === 12, "custom 12");

// licence helpers
const did = T.deviceId();
assert(did && did.startsWith("gb-"), "deviceId stable format");
assert(T.deviceId() === did, "deviceId stable across calls");
assert(T.hasScope("bd") && T.hasScope("wr"), "hasScope true while unlocked");
assert(typeof T.licenceLabel() === "string" && T.licenceLabel().length > 0, "licenceLabel returns text");
assert(Array.isArray(T.LICENCE_SCOPES) && T.LICENCE_SCOPES.length === 2, "uscopes bd+wr");
assert(T.APP_LOCKED === false, "app starts unlocked");

// v2.1: atlas layers
{
  const src = (await import("node:fs")).readFileSync(new URL("../assets/world-map-data.js", import.meta.url), "utf8");
  const pick = (k) => JSON.parse(src.split("var " + k + " = ")[1].split(";\n")[0]);
  const dots = pick("WORLD_DOTS"), rivers = pick("WORLD_RIVERS"), lakes = pick("WORLD_LAKES"), text = pick("WORLD_TEXT");
  assert(Object.keys(dots).length > 40 && dots["702"] && dots["798"], "marker dots include Singapore and Tuvalu");
  assert(rivers.length > 100 && rivers.some((r) => /Brahmaputra|Ganges|Nile|Amazon/.test(r.n)), "rivers layer has the big ones");
  assert(lakes.length >= 10, "lakes layer present");
  assert(text.some((x) => x.en === "Bay of Bengal" && x.bn) && text.filter((x) => x.kind === "continent").length === 7, "ocean + 7 continent labels, bilingual");
}
// v2.3: landmarks
{
  const L = T.LANDMARKS;
  assert(L.length === 118 && L.filter((l) => l.scope === "bd").length === 18, "118 landmarks, 18 in Bangladesh");
  assert(L.every((l) => l.en && l.bn && l.factEn && l.factBn && l.photo && l.px && Number.isFinite(l.lat)), "every landmark has names, facts, photo, coords, pin");
  assert(L.filter((l) => l.scope === "world").every((l) => GEO.countries.some((c) => c.id === l.country)), "world landmarks map to a UN country");
  assert(L.filter((l) => l.scope === "bd").every((l) => GEO.districts.some((d) => d.id === l.dist) && GEO.divisions.some((d) => d.id === l.div)), "BD landmarks map to a district + division");
  assert(L.filter((l) => l.scope === "bd").every((l) => l.px[0] > 0 && l.px[0] < 640 && l.px[1] > 0 && l.px[1] < 840), "BD pins inside the 640×840 map");
  assert(L.filter((l) => l.scope === "world").every((l) => l.px[0] > 0 && l.px[0] < 900 && l.px[1] > 0 && l.px[1] < 460), "world pins inside the 900×460 map");
  assert(T.lmPlace(L.find((l) => l.id === "eiffel")) === "France" && /Dhaka/.test(T.lmPlace(L.find((l) => l.id === "lalbagh"))), "lmPlace: country / district · division");
  const lc = T.landmarkQuestions("lm-c", "world"), ln = T.landmarkQuestions("lm-name", "bd"), lf = T.landmarkQuestions("lm-find", "world"), ld = T.landmarkQuestions("lm-div", "bd");
  assert(lc.length === 100 && lc.every((q) => q.kind === "photo" && q.photo && q.choices.length === 4 && q.choices.some((c) => c.id === q.answerId) && q.lmId), "lm-c: 100 photo questions with the right country among 4");
  assert(ln.length === 18 && ln.every((q) => q.choices.length === 4 && q.answerId === q.lmId), "lm-name: BD landmarks, answer is the landmark itself");
  assert(lf.length === 100 && lf.every((q) => q.kind === "map" && q.map === "world" && q.photo), "lm-find: map questions carry the photo");
  assert(ld.length === 18 && ld.every((q) => GEO.divisions.some((d) => d.id === q.answerId)), "lm-div: answer is a division");
}
// v2.2: offline packs
assert(T.photoSrc({ url: "https://x/y.jpg" }, "c-050") === "https://x/y.jpg", "photoSrc: remote url when no pack and online");
assert(T.photoSrc(null, "c-050") === "", "photoSrc: nothing without a photo");
assert(T.audioFile("ঢাকা") === null, "audioFile: null before any pack/manifest");
assert(T.PACKS.photos.cache.startsWith("gb-pack-") && T.PACKS.audio.cache.startsWith("gb-pack-"), "pack caches use the gb-pack- prefix the SW preserves");
// v2.1: Bangladesh rivers baked into the division map data
{
  const fs = await import("node:fs");
  const src = fs.readFileSync(new URL("../assets/bd-map-data.js", import.meta.url), "utf8");
  const rivers = JSON.parse(src.split("var BD_RIVERS = ")[1].split(";" + String.fromCharCode(10))[0]);
  const names = rivers.map((r) => r.en);
  assert(["Padma", "Jamuna", "Meghna", "Teesta", "Karnaphuli", "Surma"].every((n) => names.includes(n)) && rivers.every((r) => r.bn && r.d && Number.isFinite(r.lx)), "BD rivers present with Bangla names and label anchors");
}
// v2.1: silhouette + continent questions
{
  const sh = T.countryQuestions("wsh"), wr = T.countryQuestions("wr");
  assert(sh.length > 100 && sh.length < 194 && sh.every((q) => q.kind === "shape" && q.shapeId === q.answerId && q.choices.length === 4), "wsh: shapes only for countries big enough, 4 choices");
  assert(wr.length === 194 && wr.every((q) => q.choices.length === 4 && q.choices.some((c) => c.id === q.answerId) && q.itemId && q.answerLabel), "wr: every country, region choices, answerLabel set");
  assert(wr.every((q) => { const c = GEO.countries.find((x) => x.id === q.itemId); return c.region.toLowerCase() === q.answerId; }), "wr: answer is the country's own region");
}
// v2.1: territories & full flag set
assert(T.EXTRAS.length >= 50 && T.EXTRAS.every((x) => x.id.startsWith("x-") && x.flagCode && x.en && x.bn && x.region), "extras present with flags");
assert(T.EXTRAS.some((x) => x.iso2 === "PS") && T.EXTRAS.some((x) => x.iso2 === "TW") && T.EXTRAS.some((x) => x.iso2 === "HK"), "extras include Palestine, Taiwan, Hong Kong");
assert(!GEO.countries.some((c) => c.id.startsWith("x-")), "extras never leak into the country list");
// v2.0: mascot + journey
for (const m of ["happy", "wow", "sad", "think", "sleepy"]) assert(T.mascot(m, 40).startsWith("<svg") && T.mascot(m, 40).includes('width="40"'), "mascot " + m + " renders svg");
const jn = T.journeyNodes();
assert(jn.length === 1 + 8 + 5 + 2 && jn[0].id === "div:" && jn[jn.length - 1].id === "lm:world" && jn.every((n) => n.label && !looksRaw(n.label)), "journey: divisions + 8 district decks + 5 regions + 2 landmark stops, human labels");
assert(T.nodeStars({}, "div:") === 0 && T.nodeStars({ journey: { "div:": 49 } }, "div:") === 0, "journey: <50% no star");
assert(T.nodeStars({ journey: { "div:": 50 } }, "div:") === 1 && T.nodeStars({ journey: { "div:": 70 } }, "div:") === 2 && T.nodeStars({ journey: { "div:": 90 } }, "div:") === 3, "journey: 50/70/90 -> 1/2/3 stars");
const xpP = { stats: { correct: 3 }, bonusXP: 5 };
assert(T.getXP(xpP) === 35, "combo bonus XP counts toward level");

console.log(failures ? failures + " FAILURES" : "SMOKE OK");
process.exit(failures ? 1 : 0);