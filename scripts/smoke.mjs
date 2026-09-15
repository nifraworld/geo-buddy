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
// builder for world types
for (const ty of ["wf", "wc", "wh", "hc", "world-find"]) {
  const qs = T.countryQuestions(ty);
  assert(qs.length === 194, ty + " builds 194");
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

console.log(failures ? failures + " FAILURES" : "SMOKE OK");
process.exit(failures ? 1 : 0);