// Geo Buddy — the whole app: screens, state, quiz modes, map explorer, parent zone.
// Loaded as an ES module after geo-data.js / geo-flags.js / *-map-data.js globals.

import { GEO } from "../geo-data.js";
import { flagUrl } from "../geo-flags.js";

/* ================= data refs ================= */
const DIVS = GEO.divisions; // 8 divisions
const CTRY = GEO.countries; // 194 countries
const REGIONS = GEO.regions; // 5 regions
const DISTS = GEO.districts; // 64 districts
const NATIONAL = GEO.national;

const BD_MAP = window.BD_MAP || {};
const BD_LABELS = window.BD_LABELS || {};
const BD_MAP_D = window.BD_MAP_D || {};
const BD_LABELS_D = window.BD_LABELS_D || {};
const WORLD_MAP = window.WORLD_MAP || {};
const WORLD_LABELS = window.WORLD_LABELS || {};

const divIdx = {};
for (const d of DIVS) divIdx[d.id] = d;
const divByEn = {};
for (const d of DIVS) divByEn[d.en] = d;
const distIdx = {};
for (const d of DISTS) distIdx[d.id] = d;
const distByEn = {};
for (const d of DISTS) distByEn[d.en] = d;
const ctryIdx = {}; // by id (iso3/did-use numeric)
for (const c of CTRY) ctryIdx[c.id] = c;
const ctryByFlag = {};
for (const c of CTRY) ctryByFlag[c.flagCode] = c;

const AVATARS = [
  { icon: "🐯", color: "#E5281E", name: "Tiger" },
  { icon: "🦊", color: "#F49B1F", name: "Fox" },
  { icon: "🐨", color: "#6A5ACD", name: "Koala" },
  { icon: "🐼", color: "#2C6E8A", name: "Panda" },
  { icon: "🦜", color: "#2FA56A", name: "Parrot" },
  { icon: "🐬", color: "#189AB4", name: "Dolphin" },
  { icon: "🐘", color: "#8D6E63", name: "Elephant" },
  { icon: "🦁", color: "#C0392B", name: "Lion" },
];

/* ================= i18n ================= */
const L = {
  en: {
    brand: "Geo Buddy", brandSub: "Bangladesh • World",
    tagline: "Learn countries, flags, capitals & maps!",
    "welcome.start": "Start exploring",
    langSwitch: "বাংলা",
    hello: "Hello", helloDone: "Great job",
    navHome: "Home", navPlay: "Play", navExplore: "Explore", navParent: "Parents",
    explore: "Explore", exploreSub: "Browse divisions & countries, see photos and fun facts",
    play: "Play", playSub: "Quizzes, flags, find-on-map & daily challenge",
    map: "Map Explorer", mapSub: "Tap divisions and countries on the map",
    daily: "Daily Challenge", dailySub: "Fresh 10 questions every day — build your streak!",
    clock: "Beat the Clock", clockSub: "Answer as many as you can in 60 seconds",
    custom: "Custom Quiz", customSub: "Pick your own scope, types and length",
    profile: "Choose who is playing",
    newProfile: "New player",
    addName: "What's the player's name?",
    pickAvatar: "Pick an avatar",
    start: "Start", create: "Create", cancel: "Cancel",
    "wrong.try": "Try again", "wrong.next": "Nice try",
    correct: "Correct!", wrong: "Oops!",
    score: "Score", answered: "Answered", best: "Best",
    "results.great": "Amazing!", "results.good": "Well done!", "results.keep": "Keep practising!",
    again: "Play again", home: "Home",
    streakFlame: "day streak", dailyDone: "Daily done today!",
    "daily.title": "Daily Challenge",
    "daily.notyet": "Finish today's challenge to earn today's streak.",
    findPromptBD: "Tap {X} on the map", findPromptWorld: "Tap {X} on the map",
    "map.hint.bd": "Tap a division to explore",
    "map.hint.bdd": "Tap a district to explore",
    licNeeded: "Ask a parent to activate a key for this section",
    "map.hint.world": "Tap a country to explore",
    "map.hint.quiz": "Tap the correct place on the map",
    back: "Back",
    search: "Search…",
    regionAll: "All", region: "Region",
    sectionBD: "Bangladesh", sectionWorld: "World",
    worldCount: "{n} countries",
    division: "Division", hq: "Headquarters", area: "Area", pop: "Population", density: "Density/km²",
    districts: "Districts", upazilas: "Upazilas", unions: "Unions", est: "Established", rivers: "Rivers",
    listen: "Listen", favorite: "Favorite", starsEarned: "Stars earned",
    favorites: "Favorites", favoriteRemoved: "Removed from favorites",
    noResults: "Nothing found", subRegion: "Sub-region", neighbors: "Neighbours",
    capital: "Capital", flag: "Flag",
    qtypes: {
      "bd-hq": "Division from HQ", "bd-fact": "Division from fact", "bd-find": "Find division on map",
      "d-div": "Division → District", "div-d": "District → Division", "d-find": "Find district on map",
      "wf": "Flag → Country", "wc": "Country → Flag", "wh": "Country → Capital", "hc": "Capital → Country",
      "world-find": "Find country on map",
    },
    qprompts: {
      "bd-hq": "Which division has the headquarters in {X}?",
      "bd-fact": "Which division is this?",
      "d-div": "Which district is in {X}?",
      "div-d": "Which division is {X} in?",
      "wf": "Which country's flag is this?",
      "wc": "Which flag belongs to {X}?",
      "wh": "What is the capital of {X}?",
      "hc": "Which country has the capital {X}?",
    },
    setupScope: "Where to play?", setupTypes: "Question types", setupCount: "How many?",
    scopeBD: "Bangladesh", scopeWorld: "World", scopeBDWorld: "Bangladesh + World",
    typeCount: "{n} questions", adaptive: "Focus on my mistakes",
    playBtn: "Let's play!", parentZone: "Parent Zone",
    pinTitle: "Parent PIN", pinEnter: "Enter the 4-digit PIN", pinSetTitle: "Set a parent PIN",
    pinNew: "Choose a 4-digit PIN", pinConfirm: "Enter it again to confirm", pinWrong: "Incorrect PIN",
    pinUnlocked: "Parent zone",
    settings: "Settings", langLock: "Lock the language", langLockSub: "Keep English or Bangla fixed",
    clearData: "Erase all progress", clearDataSub: "Remove profiles, stars and stats",
    confirmClear: "Really erase everything?", export: "Backup (download JSON)",
    exportSub: "Save your child's progress as a file", exportDone: "Backup downloaded",
    about: "About & sources", aboutSub: "Data sources and credits",
    profileStats: "Progress", totalAsked: "Questions asked", totalCorrect: "Correct answers",
    noProfilesYet: "No players yet — create one!",
    off: "Offline", online: "Online", placeholder: "Photo needs the internet 📶",
    confirmDelProfile: "Delete this player?",
    justDeleted: "Player deleted", changedLang: "Language changed",
    photoCredits: "Photo: {a} · CC licensed · Wikimedia Commons",
    dataSources: "Facts: mledoze/countries (ODbL) · Flags: lipis/flag-icons (MIT) · Photos: Wikimedia Commons · Bangladesh census: BBS 2022.",
    made: "Made with ❤ for curious kids.",
    wrongList: "Review what you missed:", tryAgainBtn: "Practise mistakes",
    soundEff: "Sound effects", soundEffSub: "Correct, wrong & celebration sounds",
    badgeTitle: "Badges", badgeNone: "Complete quizzes to earn badges!",
    level: "Level",
    levelDivisions: "Divisions", levelDistricts: "Districts",
    inDivision: "In {X}", district: "District", districts_: "districts",
    density: "Density", districtPractise: "Practice the district {d} — it is in the {dv} division.",
    licence: "Licence", licenceSub: "Activate a Geo Buddy key (optional)",
    licEmail: "Buyer email", licKey: "Activation key", licActivate: "Activate", licRemove: "Remove key",
    licOpen: "App is fully open", licNoKey: "No key yet",
    licFull: "Bundled licence active", licScope: "Content licence active",
    licRevoked: "This key was revoked.", licRemoved: "Key removed",
    licErrFields: "Enter an email and a key.", licErrNetwork: "Couldn't reach the licence server — try again online.",
    licErrMatch: "That email + key don't match.", licPlan: "Plan: {plan}", licOffline: "Offline — using the last checked status.",
    licDevices: "{n} of {limit} devices",
  },
  bn: {
    brand: "জিও বাডি", brandSub: "বাংলাদেশ • বিশ্ব",
    tagline: "দেশ, পতাকা, রাজধানী ও মানচিত্র শিখি!",
    "welcome.start": "শুরু করি",
    langSwitch: "English",
    hello: "নমস্কার", helloDone: "দারুণ!",
    navHome: "হোম", navPlay: "খেলা", navExplore: "ঘুরে দেখি", navParent: "অভিভাবক",
    explore: "ঘুরে দেখি", exploreSub: "বিভাগ ও দেশ ঘুরে দেখো, ছবি এবং মজার তথ্য",
    play: "খেলা", playSub: "কুইজ, পতাকা, মানচিত্র ও দৈনিক চ্যালেঞ্জ",
    map: "মানচিত্র", mapSub: "মানচিত্রে বিভাগ ও দেশ স্পর্শ করো",
    daily: "দৈনিক চ্যালেঞ্জ", dailySub: "প্রতিদিন নতুন ১০ প্রশ্ন — ধারাবাহিকতা ধরে রাখো!",
    clock: "আরও দ্রুত", clockSub: "৬০ সেকেন্ডে যত পারো উত্তর দাও",
    custom: "নিজের কুইজ", customSub: "নিজের পছন্দের বিষয়, ধরন ও প্রশ্নসংখ্যা",
    profile: "কে খেলবে?",
    newProfile: "নতুন খেলোয়াড়",
    addName: "খেলোয়াড়ের নাম কী?",
    pickAvatar: "ছবি বেছে নাও",
    start: "শুরু", create: "তৈরি", cancel: "বাতিল",
    "wrong.try": "আবার চেষ্টা", "wrong.next": "ঠিক আছে",
    correct: "সঠিক!", wrong: "উফ!",
    score: "স্কোর", answered: "উত্তর", best: "সেরা",
    "results.great": "অসাধারণ!", "results.good": "সাবাশ!", "results.keep": "আরও অনুশীলন করো!",
    again: "আবার খেলি", home: "হোম",
    streakFlame: "দিনের ধারা", dailyDone: "আজকের চ্যালেঞ্জ শেষ!",
    "daily.title": "দৈনিক চ্যালেঞ্জ",
    "daily.notyet": "আজকের চ্যালেঞ্জ শেষ করো, ধারা গড়তে।",
    findPromptBD: "মানচিত্রে {X} স্পর্শ করো", findPromptWorld: "মানচিত্রে {X} স্পর্শ করো",
    "map.hint.bd": "বিভাগে স্পর্শ করো",
    "map.hint.bdd": "জেলায় স্পর্শ করো",
    licNeeded: "এই অংশের জন্য অভিভাবককে কী চালু করতে বলো",
    "map.hint.world": "দেশে স্পর্শ করো",
    "map.hint.quiz": "সঠিক স্থানে স্পর্শ করো",
    back: "ফিরে যাও",
    search: "খোঁজো…",
    regionAll: "সব", region: "অঞ্চল",
    sectionBD: "বাংলাদেশ", sectionWorld: "বিশ্ব",
    worldCount: "{n} টি দেশ",
    division: "বিভাগ", hq: "সদর দপ্তর", area: "আয়তন", pop: "জনসংখ্যা", density: "ঘনত্ব/বর্গকিমি",
    districts: "জেলা", upazilas: "উপজেলা", unions: "ইউনিয়ন", est: "প্রতিষ্ঠা", rivers: "নদী",
    listen: "শুনুন", favorite: "পছন্দ", starsEarned: "অর্জিত তারা",
    favorites: "পছন্দের তালিকা", favoriteRemoved: "পছন্দের তালিকা থেকে সরানো হয়েছে",
    noResults: "কিছু পাওয়া যায়নি", subRegion: "উপ-অঞ্চল", neighbors: "প্রতিবেশী",
    capital: "রাজধানী", flag: "পতাকা",
    qtypes: {
      "bd-hq": "সদর দপ্তর থেকে বিভাগ", "bd-fact": "তথ্য থেকে বিভাগ", "bd-find": "মানচিত্রে বিভাগ খুঁজো",
      "d-div": "বিভাগ → জেলা", "div-d": "জেলা → বিভাগ", "d-find": "মানচিত্রে জেলা খুঁজো",
      "wf": "পতাকা → দেশ", "wc": "দেশ → পতাকা", "wh": "দেশ → রাজধানী", "hc": "রাজধানী → দেশ",
      "world-find": "মানচিত্রে দেশ খুঁজো",
    },
    qprompts: {
      "bd-hq": "কোন বিভাগের সদর দপ্তর {X}?",
      "bd-fact": "কোন বিভাগের কথা বলা হয়েছে?",
      "d-div": "কোন জেলা {X}-এ আছে?",
      "div-d": "{X} কোন বিভাগে?",
      "wf": "এটি কোন দেশের পতাকা?",
      "wc": "{X} কোন পতাকা?",
      "wh": "{X}-এর রাজধানী কী?",
      "hc": "রাজধানী {X} কোন দেশের?",
    },
    setupScope: "কোথায় খেলবে?", setupTypes: "কোন ধরনের প্রশ্ন?", setupCount: "কতগুলো প্রশ্ন?",
    scopeBD: "বাংলাদেশ", scopeWorld: "বিশ্ব", scopeBDWorld: "বাংলাদেশ + বিশ্ব",
    typeCount: "{n} প্রশ্ন", adaptive: "ভুলগুলোতেই বেশি অনুশীলন",
    playBtn: "খেলি!", parentZone: "অভিভাবকের এলাকা",
    pinTitle: "অভিভাবক PIN", pinEnter: "৪ ডিজিটের PIN দিন", pinSetTitle: "PIN ঠিক করো",
    pinNew: "৪ ডিজিটের PIN বেছে নাও", pinConfirm: "আবার লিখে নিশ্চিত করো", pinWrong: "PIN সঠিক নয়",
    pinUnlocked: "অভিভাবকের এলাকা",
    settings: "সেটিংস", langLock: "ভাষা আটকে রাখো", langLockSub: "শিশুর সামনে ভাষা বদল বন্ধ",
    clearData: "সব মুছে ফেলো", clearDataSub: "প্রোফাইল, তারা ও স্কোর মুছে যাবে",
    confirmClear: "সত্যিই সব মুছে ফেলব?",
    export: "ব্যাকআপ নাও", exportSub: "অগ্রগতি একটি ফাইলে সংরক্ষণ",
    exportDone: "ব্যাকআপ নেওয়া হয়েছে",
    about: "তথ্যসূত্র", aboutSub: "তথ্যের উৎস ও কৃতিত্ব",
    profileStats: "অগ্রগতি", totalAsked: "মোট প্রশ্ন", totalCorrect: "সঠিক উত্তর",
    noProfilesYet: "কোনো খেলোয়াড় নেই — একটি তৈরি করো!",
    off: "অফলাইন", online: "অনলাইন", placeholder: "ছবি ইন্টারনেট লাগে 📶",
    confirmDelProfile: "এই খেলোয়াড়টি মুছে ফেলব?",
    justDeleted: "খেলোয়াড় মুছে ফেলা হয়েছে", changedLang: "ভাষা বদলানো হয়েছে",
    photoCredits: "ছবি: {a} · CC লাইসেন্স · উইকিমিডিয়া কমন্স",
    dataSources: "তথ্য: mledoze/countries (ODbL) · পতাকা: lipis/flag-icons (MIT) · ছবি: উইকিমিডিয়া কমন্স · আদমশুমারি: বিবিএস ২০২২।",
    made: "জিজ্ঞাসু বাচ্চাদের জন্য ভালোবাসা দিয়ে তৈরি।",
    wrongList: "ভুলগুলো আবার দেখে নিই:", tryAgainBtn: "ভুলগুলো অনুশীলন করি",
    soundEff: "সাউন্ড ইফেক্ট", soundEffSub: "সঠিক, ভুল ও উল্লাসের সাউন্ড",
    badgeTitle: "ব্যাজ", badgeNone: "কুইজ সম্পন্ন করে ব্যাজ অর্জন করো!",
    level: "স্তর",
    levelDivisions: "বিভাগ", levelDistricts: "জেলা",
    inDivision: "{X} বিভাগে", district: "জেলা", districts_: "টি জেলা",
    density: "ঘনত্ব", districtPractise: "{dv} বিভাগের মধ্যে {d} জেলাটি চর্চা করো।",
    licence: "লাইসেন্স", licenceSub: "জিও বাডি কী সক্রিয় করো (ঐচ্ছিক)",
    licEmail: "ক্রেতার ইমেইল", licKey: "অ্যাক্টিভেশন কী", licActivate: "সক্রিয় করো", licRemove: "কী মুছো",
    licOpen: "অ্যাপ সম্পূর্ণ খোলা", licNoKey: "এখনো কী নেই",
    licFull: "বান্ডেল লাইসেন্স সক্রিয়", licScope: "কনটেন্ট লাইসেন্স সক্রিয়",
    licRevoked: "এই কী বাতিল করা হয়েছে।", licRemoved: "কী মুছে ফেলা হয়েছে",
    licErrFields: "ইমেইল ও কী দাও।", licErrNetwork: "লাইসেন্স সার্ভারে পৌঁছানো গেল না — অনলাইনে আবার চেষ্টা করো।",
    licErrMatch: "ইমেইল + কী মিলছে না।", licPlan: "প্ল্যান: {plan}", licOffline: "অফলাইন — শেষ জানা অবস্থা ব্যবহার হচ্ছে।",
    licDevices: "{n}/{limit}টি ডিভাইস",
  },
};
let _lang = "en";
function lookup(tbl, k) {
  if (!tbl) return undefined;
  if (tbl[k] !== undefined) return tbl[k];
  const dot = k.indexOf(".");
  if (dot < 0) return undefined;
  const head = tbl[k.slice(0, dot)];
  return head && typeof head === "object" ? head[k.slice(dot + 1)] : undefined;
}
function t(k) { const v = lookup(L[_lang], k); if (v !== undefined) return v; const e = lookup(L.en, k); return e !== undefined ? e : k; }
function tvar(k, map) { let s = t(k); for (const [a, b] of Object.entries(map)) s = s.split("{" + a + "}").join(String(b)); return s; }
function name(div) { return _lang === "bn" ? div.bn : div.en; }
function cname(c) { return _lang === "bn" ? c.bn : c.en; }
function cap(c) { return _lang === "bn" ? c.capitalBn : c.capitalEn; }
function dname(d) { return _lang === "bn" ? d.bn : d.en; }
function regionBn(r) { const rr = REGIONS.find((x) => x.en === r); return rr && _lang === "bn" ? rr.bn : r; }

/* ================= store ================= */
const DB_KEY = "geobuddy.v1";
let D = null;
function defaultStore() {
  return {
    v: 2, lang: "en", active: null,
    profiles: {},
    settings: { pin: "", lockLang: false, soundEnabled: true },
  };
}
function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    D = raw ? JSON.parse(raw) : defaultStore();
  } catch { D = defaultStore(); }
  if (!D.profiles) D.profiles = {};
  if (!D.settings) D.settings = {};
  if (D.settings.soundEnabled === undefined) D.settings.soundEnabled = true;
  soundOn = D.settings.soundEnabled;
  const active = D.active && D.profiles[D.active] ? D.active : null;
  _lang = D.lang === "bn" ? "bn" : "en";
  if (active) D.active = active;
  else D.active = null;
  return D;
}
function save() {
  D.lang = _lang;
  try { localStorage.setItem(DB_KEY, JSON.stringify(D)); } catch {}
}
function profile() {
  return D.active ? D.profiles[D.active] : null;
}
function newProfile(id) {
  const p = {
    id, name: "", avatar: AVATARS[0], created: Date.now(),
    stars: {}, itemStats: {}, stats: { asked: 0, correct: 0 },
    daily: { streak: 0, last: "", done: [] },
    favs: {},
  };
  D.profiles[id] = p; D.active = id; save(); return p;
}
function itemKey(type, id) { return type + "|" + id; }
function isFav(p, type, id) { return !!(p && p.favs && p.favs[itemKey(type, id)]); }
function toggleFav(p, type, id) {
  if (!p) return false;
  if (!p.favs) p.favs = {};
  const k = itemKey(type, id);
  const v = !p.favs[k];
  p.favs[k] = v;
  if (!v) delete p.favs[k];
  save();
  return v;
}

/* ================= licence (activation key) =================
   Mirrors the Spelling Buddy scheme: the key formula lives server-side
   (functions/, env LICENCE_SECRET), so it is never shipped to the phone.
   Right now the whole app is open; when sales start, set APP_LOCKED = true
   and only activated keys unlock content. */
const LICENCE_SCOPES = ["bd", "wr"];
let APP_LOCKED = false;

function deviceId() {
  if (!D.settings.deviceId)
    D.settings.deviceId = "gb-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
  save();
  return D.settings.deviceId;
}
function licence() {
  if (!D.settings.licence)
    D.settings.licence = { email: "", key: "", status: "free", plan: "Home", packages: [], deviceLimit: 0, deviceCount: 0, checkedAt: 0 };
  return D.settings.licence;
}
function licenceLabel() {
  const l = licence();
  if (!APP_LOCKED) return t("licOpen");
  if (!l.key) return t("licNoKey");
  if (l.status === "revoked") return t("licRevoked");
  if (l.status === "full" || l.status === "grace") return l.packages.includes("bundle") ? t("licFull") : t("licScope");
  return t("licNoKey");
}
function hasScope(scope) {
  if (!APP_LOCKED) return true;
  const l = licence();
  if (!l.key || l.status === "revoked") return false;
  if (l.status === "full") return true;
  return (l.packages || []).includes("bundle") || (l.packages || []).includes(scope) || !LICENCE_SCOPES.includes(scope);
}
async function activateLicence(email, key) {
  const e = String(email || "").trim().toLowerCase();
  const k = String(key || "").trim();
  if (!e || e.indexOf("@") < 0 || !k) return { ok: false, error: "fields" };
  let r;
  try {
    const res = await fetch("/api/activate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: e, key: k, device: deviceId(), appVersion: GEO.version || "", bot: false }),
    });
    r = res.ok ? await res.json() : { ok: false, error: "http " + res.status };
  } catch { return { ok: false, error: "network" }; }
  if (r.ok) {
    const l = licence();
    l.email = e; l.key = k;
    l.packages = r.packages || [];
    l.plan = r.plan || "Home";
    l.deviceLimit = r.deviceLimit || 0;
    l.deviceCount = r.deviceCount || 0;
    l.status = "full";
    l.checkedAt = Date.now();
    save();
  }
  return r;
}
async function refreshLicence(silent) {
  const l = licence();
  if (!l.key) return;
  if (!navigator.onLine) { if (!silent) toast(t("licOffline")); return; }
  const url = "/api/licence?email=" + encodeURIComponent(l.email) + "&device=" + encodeURIComponent(deviceId()) +
    "&ak=" + encodeURIComponent(l.key) + "&tc=";
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "cache-control": "no-cache" } });
    const r = res.ok ? await res.json() : null;
    if (r && r.ok) {
      l.status = r.status || l.status;
      l.plan = r.plan || l.plan;
      l.deviceLimit = r.deviceLimit || 0;
      l.deviceCount = r.deviceCount || 0;
      const akPkg = r.akValid ? (r.packages || []).filter((x) => x === "bundle" || x === "bd" || x === "wr") : [];
      if (akPkg.length) l.packages = akPkg;
      if (r.revoked) l.status = "revoked";
      l.checkedAt = Date.now();
      save();
    }
  } catch { if (!silent) toast(t("licOffline")); }
}
/* true when the licence covers this play scope; otherwise explains and
   sends the parent to the Licence card */
function scopeAllowed(scope) {
  const need = scope === "both" ? ["bd", "wr"] : [scope === "world" ? "wr" : "bd"];
  if (need.every(hasScope)) return true;
  toast("🔒 " + t("licNeeded"));
  go("pin");
  return false;
}
function clearLicence() {
  D.settings.licence = { email: "", key: "", status: "free", plan: "Home", packages: [], deviceLimit: 0, deviceCount: 0, checkedAt: Date.now() };
  save();
}
function bumpItem(p, type, id, correct) {
  const k = itemKey(type, id);
  const s = (p.itemStats[k] = p.itemStats[k] || { a: 0, ok: 0 });
  s.a++; if (correct) s.ok++;
}
function addStars(p, type, id, correct) {
  const k = itemKey(type, id);
  if (correct) p.stars[k] = Math.min(3, (p.stars[k] || 0) + 1);
  else p.stars[k] = Math.max(0, (p.stars[k] || 0) - 1);
}
function starShown(p, type, id) { return p.stars[itemKey(type, id)] || 0; }

/* ================= tiny utils ================= */
const $id = (i) => document.getElementById(i);
function html(str) {
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  return tpl.content;
}
function htmlStr(node) {
  if (!node) return "";
  if (node.nodeType === 11) {
    let s = "";
    for (const c of node.childNodes) s += c.nodeType === 1 ? c.outerHTML : "";
    return s;
  }
  return node.innerHTML;
}
function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
let soundOn = true;
let _audioCtx = null;
function getAudio() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}
function sfx(type) {
  if (!soundOn || !D.settings || !D.settings.soundEnabled) return;
  try {
    const ctx = getAudio();
    const now = ctx.currentTime;
    const play = (freq, start, dur, wave = "sine", gain = 0.18) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = wave;
      o.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(gain, now + start);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + start);
      o.stop(now + start + dur);
    };
    switch (type) {
      case "correct":  play(660, 0, 0.1); play(880, 0.1, 0.15); break;
      case "wrong":    play(400, 0, 0.12, "sawtooth", 0.1); play(260, 0.12, 0.18, "sawtooth", 0.08); break;
      case "finish":   play(523, 0, 0.12); play(659, 0.12, 0.12); play(784, 0.24, 0.2); break;
      case "levelUp":  play(523, 0, 0.08); play(659, 0.08, 0.08); play(784, 0.16, 0.08); play(1047, 0.24, 0.25); break;
      case "badge":    play(784, 0, 0.1); play(988, 0.1, 0.1); play(1175, 0.2, 0.1); play(1568, 0.3, 0.3); break;
      case "streak":   play(600, 0, 0.08); play(800, 0.08, 0.08); play(1000, 0.16, 0.15); break;
      case "tap":      play(880, 0, 0.05, "sine", 0.08); break;
    }
  } catch {}
}
function sfxInit() { try { getAudio(); } catch {} }

/* ================= badges & levels ================= */
const BADGES = [
  { id: "first-play",   icon: "🎯",  en: "First Shot",       bn: "প্রথম প্রয়াস",  descEn: "Complete your first quiz",                descBn: "প্রথম কুইজ সম্পন্ন করো",               test: (p) => p.stats.asked >= 1 },
  { id: "perfect-10",   icon: "💯",  en: "Perfect!",         bn: "দারুণ!",         descEn: "Get 10/10 in a quiz",                     descBn: "কুইজে ১০/১০ পাও",                      test: (p) => p._best10 },
  { id: "streak-3",     icon: "🔥",  en: "Streak Keeper",    bn: "ধারাবাহিক",      descEn: "3-day streak",                            descBn: "৩ দিনের ধারা",                          test: (p) => (p.daily.streak || 0) >= 3 },
  { id: "streak-7",     icon: "🌋",  en: "Unstoppable",       bn: "অবরোধ্য",       descEn: "7-day streak",                            descBn: "৭ দিনের ধারা",                          test: (p) => (p.daily.streak || 0) >= 7 },
  { id: "flag-master",  icon: "🏁",  en: "Flag Master",      bn: "পতাকা মাস্টার",  descEn: "100% on a flag quiz",                     descBn: "পতাকা কুইজে ১০০%",                      test: (p) => !!p._flagMaster },
  { id: "map-master",   icon: "🗺️",  en: "Map Master",       bn: "মানচিত্র মাস্টার",descEn: "100% on a find-on-map quiz",               descBn: "মানচিত্র কুইজে ১০০%",                    test: (p) => !!p._mapMaster },
  { id: "century",      icon: "💯",  en: "Century Club",     bn: "শতক",            descEn: "Answer 100 questions total",               descBn: "১০০টি প্রশ্নের উত্তর দাও",               test: (p) => p.stats.asked >= 100 },
  { id: "star-30",      icon: "⭐",  en: "Star Collector",   bn: "তারা সংগ্রাহক",  descEn: "Earn 30 total stars",                     descBn: "৩০টি তারা অর্জন করো",                    test: (p) => totalStars(p) >= 30 },
  { id: "star-100",     icon: "🌟",  en: "Constellation",    bn: "তারামণ্ডল",      descEn: "Earn 100 total stars",                    descBn: "১০০টি তারা অর্জন করো",                   test: (p) => totalStars(p) >= 100 },
  { id: "explorer-20",  icon: "🌍",  en: "World Explorer",   bn: "বিশ্ব অনুসন্ধানী",descEn: "Favourite 20 countries",                  descBn: "২০টি দেশ পছন্দের তালিকায় যোগ করো",     test: (p) => countFavs(p, "c") >= 20 },
];
function totalStars(p) { return Object.values(p.stars || {}).reduce((s, v) => s + v, 0); }
function countFavs(p, kind) {
  return Object.keys(p.favs || {}).filter((k) => k.startsWith(kind + "|")).length;
}
function checkBadges(p) {
  if (!p.badges) p.badges = {};
  const newBadges = [];
  for (const b of BADGES) {
    if (!p.badges[b.id] && b.test(p)) {
      p.badges[b.id] = Date.now();
      newBadges.push(b);
    }
  }
  return newBadges;
}
function getXP(p) { return (p.stats.correct || 0) * 10; }
function getLevel(p) { const xp = getXP(p); let lv = 1; while (xp >= lv * lv * 50) lv++; return lv; }
function xpForNext(p) { const lv = getLevel(p); return lv * lv * 50; }

/* ================= feedback ================= */
function toast(msg) {
  const box = $id("toasts");
  const el = html(`<div class="toast">${msg}</div>`).firstElementChild;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
function vibrate(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch {} }
function confetti() {
  const colors = ["#E5281E", "#F49B1F", "#0E3B2E", "#E9C46A", "#2FA56A", "#189AB4"];
  for (let i = 0; i < 70; i++) {
    const c = html(`<div class="confetti" style="left:${Math.random() * 100}vw;background:${colors[i % colors.length]};animation-duration:${1.6 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.5}s;transform:rotate(${Math.random() * 360}deg)"></div>`).firstElementChild;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3600);
  }
}
function speak(text, lang, cb) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "bn" ? "bn-BD" : "en-US";
    try {
      const voices = speechSynthesis.getVoices();
      const v = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith(lang === "bn" ? "bn" : "en")) || speechSynthesis.getVoices().find((x) => x.default);
      if (v) u.voice = v;
    } catch {}
    if (cb) u.onend = cb;
    speechSynthesis.speak(u);
  } catch {}
}

/* ================= routing ================= */
const stack = [];
let ctx = null; // current screen context (extra params)
function go(name, params) {
  stack.push({ name, params });
  render(name, params);
}
function back() {
  if (stack.length > 1) {
    stack.pop();
    const prev = stack[stack.length - 1];
    render(prev.name, prev.params);
  } else {
    go("home");
  }
}
function replace(name, params) {
  stack[stack.length - 1] = { name, params };
  render(name, params);
}

function siteTag() {
  return `<span class="site-tag"><b>geobuddy.nifraworld.com</b><small>v${GEO.version || ""}</small></span>`;
}

function fillTopbar(homeable) {
  const act = profile();
  const child = act
    ? `<button class="chip-child" data-nav="who" title="${t("profile")}"><span class="av" style="background:${act.avatar.color}">${act.avatar.icon}</span><span class="nm">${act.name.split(" ")[0]}</span><span class="lv" title="${t("level")}">Lv${getLevel(act)}</span></button>`
    : "";
  const lock = D.settings.lockLang;
  /* domain + version stay on welcome/PIN (siteTag) and in About; the child-facing
     bar only holds back · brand · profile · language so it fits a 360px phone */
  return `<header class="topbar ${homeable && act ? "has-child" : ""}">
    ${stack.length > 1 ? `<button class="tb-btn" data-action="back" title="${t("back")}">←</button>` : ""}
    <a class="brand" href="#" data-nav="home">
      <img class="ico" src="assets/icons/icon-192.png" alt="">
      <span><h1>Geo Buddy</h1><small>${t("brandSub")}</small></span>
    </a>
    ${homeable ? child : ""}
    ${lock ? "" : `<button class="tb-btn" data-tb="lang">${t("langSwitch")}</button>`}
  </header>`;
}

/* ================= screens ================= */
const APP = (() => {
  let a = $id("app");
  if (!a) { a = document.createElement("div"); a.id = "app"; document.body.appendChild(a); }
  return a;
})();

function render(name, params) {
  const sub = {
    welcome: screenWelcome, who: screenWho, home: screenHome,
    explore: screenExplore, detail: screenDetail, map: screenMap,
    play: screenPlay, session: screenSession, results: screenResults,
    daily: screenDaily, parent: screenParent, pin: screenPin, about: screenAbout,
    custom: screenCustom, clock: screenClock,
  }[name];
  const top = name === "welcome" || name === "pin" ? `<div class="site-tag-float">${siteTag()}</div>` : fillTopbar(name !== "who");
  document.title = name === "map" ? "Map — Geo Buddy" : "Geo Buddy";
  const node = sub(params);
  APP.innerHTML = top + htmlStr(node);
  window.scrollTo(0, 0);
  const hook = MOUNT[name];
  if (hook) hook(params);
}

const MOUNT = {};

/* ---------- welcome ---------- */
function screenWelcome() {
  return html(`
    <section class="welcome">
      <img class="hero" src="assets/icons/icon-512.png" alt="Geo Buddy">
      <h1>Geo Buddy</h1>
      <p class="tag">${t("tagline")}</p>
      <div class="langp">
        <button class="btn btn-primary" data-action="picklang" data-lang="en">English</button>
        <button class="btn btn-primary" data-action="picklang" data-lang="bn">বাংলা</button>
      </div>
      <button class="btn btn-sun" data-nav="who" onclick="sfx('tap')">${t("welcome.start")} ➜</button>
    </section>`);
}
MOUNT.welcome = () => {
  if (Object.keys(D.profiles).length && D.active) replace("home");
};

/* ---------- who (profile pick) ---------- */
function screenWho() {
  const rows = Object.values(D.profiles).length
    ? Object.values(D.profiles).map((p) => `
      <button class="p-card" data-action="pick" data-id="${p.id}">
        <span class="avatar" style="background:${p.avatar.color}">${p.avatar.icon}</span>
        <span class="nm">${p.name}</span>
        <small>${p.stats.correct}/${p.stats.asked} ✓ · 🔥${p.daily.streak}</small>
        <span class="stars">${Array(3).fill("★").slice(0, 3).join("")}</span>
      </button>`).join("")
    : `<div class="card">${t("noProfilesYet")}</div>`;
  return html(`
    <h2 class="sec-title" style="margin-top:16px"><span>${t("profile")}</span></h2>
    <div class="who-grid">
      ${rows}
      <button class="new-p" data-action="newp"><span class="icon-txt">+</span>${t("newProfile")}</button>
    </div>`);
}
MOUNT.who = (p) => {};

/* ---------- home ---------- */
function screenHome() {
  const act = profile();
  if (!act) { go("who"); return html("<div></div>"); }
  const streak = act.daily.streak || 0;
  const doneToday = act.daily.last === todayKey();
  const greet = doneToday ? t("helloDone") : t("hello");
  return html(`
    <div class="home-hero">
      <span class="avatar" style="background:${act.avatar.color}">${act.avatar.icon}</span>
      <div>
        <div class="greet">${greet}, ${act.name.split(" ")[0]}! 👋</div>
        <div class="sub">${t("tagline")}</div>
      </div>
      <div class="streak"><b>🔥${streak}</b><small>${t("streakFlame")}</small></div>
    </div>
    <div class="mode-grid">
      <button class="mode-card" data-nav="play"><div class="em">🎯</div><div class="tt">${t("play")}</div><div class="ds">${t("playSub")}</div></button>
      <button class="mode-card" data-nav="explore"><div class="em">🗺️</div><div class="tt">${t("explore")}</div><div class="ds">${t("exploreSub")}</div></button>
      <button class="mode-card" data-nav="daily"><div class="em">📅</div><div class="tt">${t("daily")}</div><div class="ds">${t("dailySub")}</div></button>
      <button class="mode-card" data-nav="map"><div class="em">🧭</div><div class="tt">${t("map")}</div><div class="ds">${t("mapSub")}</div></button>
      <button class="mode-card pin" data-nav="parent"><div class="em">🔒</div><div class="tt">${t("parentZone")}</div><div class="ds">${t("pinTitle")}</div></button>
    </div>`);
}
MOUNT.home = (p) => {};

/* ---------- explore (library) ---------- */
function screenExplore(params = {}) {
  const scope = params.scope || "bd";
  const level = params.level || "div";
  const regionF = params.region || "all";
  const favF = params.fav || false;
  const q = params.q || "";
  const bdLevel = scope === "bd" ? `
    <div class="chips level-chips">
      <button class="chip ${level === "div" ? "on" : ""}" data-action="explore-level" data-level="div">🗺️ ${t("levelDivisions")}</button>
      <button class="chip ${level === "dist" ? "on" : ""}" data-action="explore-level" data-level="dist">🧩 ${t("levelDistricts")}</button>
    </div>` : "";
  const bdDivChips = scope === "bd" && level === "dist" ? `
    <button class="fchip ${regionF === "all" ? "on" : ""}" data-action="explore-region" data-region="all">${t("regionAll")}</button>
    ${DIVS.map((d) => `<button class="fchip ${regionF === d.id ? "on" : ""}" data-action="explore-region" data-region="${d.id}">${_lang === "bn" ? d.bn : d.en}</button>`).join("")}` : "";
  return html(`
    <div class="tabs">
      <button class="tab ${scope === "bd" ? "on" : ""}" data-action="explore-scope" data-scope="bd">${t("sectionBD")}</button>
      <button class="tab ${scope === "world" ? "on" : ""}" data-action="explore-scope" data-scope="world">${t("sectionWorld")}</button>
    </div>
    ${bdLevel}
    <input class="search" data-q value="${q}" placeholder="${t("search")}">
    <div class="filter-row">
      <button class="fchip ${favF ? "on" : ""}" data-action="explore-fav" data-fav="1">⭐ ${t("favorites")}</button>
      ${scope === "world"
        ? `<button class="fchip ${regionF === "all" ? "on" : ""}" data-action="explore-region" data-region="all">${t("regionAll")}</button>
           ${REGIONS.map((r) => `<button class="fchip ${regionF === r.id ? "on" : ""}" data-action="explore-region" data-region="${r.id}">${_lang === "bn" ? r.bn : r.en}</button>`).join("")}`
        : bdDivChips}
    </div>
    <div id="explore-list"></div>`);
}
MOUNT.explore = (params = {}) => {
  const scope = params.scope || "bd";
  shell();
  function shell() {
    const list = APP.querySelector("#explore-list");
    const q = (APP.querySelector("[data-q]").value || "").trim().toLowerCase();
    const regionF = params.region || "all";
    const favF = !!params.fav;
    const level = params.level || "div";
    const p = profile();
    let items = [];
    if (scope === "bd" && level === "dist") {
      items = DISTS.filter((d) => regionF === "all" || d.div === regionF).map((d) => ({
        key: "z|" + d.id, kind: "z", id: d.id, img: null, ring: avatarEmoji(d.div),
        nm: dname(d), sb: `${t("inDivision", { X: name(divIdx[d.div]) })} · ${fmtNum(d.pop)} ${t("pop").toLowerCase()}`,
        st: starShown(p, "z", d.id),
        open: () => go("detail", { kind: "z", id: d.id }),
      }));
    } else if (scope === "bd") {
      items = DIVS.map((d) => ({
        key: "div|" + d.id, kind: "d", id: d.id, img: null, ring: avatarEmoji(d.id),
        nm: name(d), sb: `${d.districts} ${t("districts")} · ${t("hq")}: ${_lang === "bn" ? d.hqBn : d.hq}`, st: starShown(p, "d", d.id),
        open: () => go("detail", { kind: "div", id: d.id }),
      }));
    } else {
      items = CTRY.filter((c) => regionF === "all" || c.region.toLowerCase() === regionF)
        .map((c) => ({
          key: "c|" + c.id, kind: "c", id: c.id, img: flagUrl(c.flagCode), ring: null,
          nm: cname(c), sb: `${regionBn(c.region)} · ${cap(c)}${c.population ? " · 👥 " + fmtPop(c.population) : ""}`,
          st: starShown(p, "c", c.id),
          open: () => go("detail", { kind: "c", id: c.id }),
        }));
    }
    if (favF) items = items.filter((it) => isFav(p, it.kind, it.id));
    if (q) items = items.filter((it) => it.nm.toLowerCase().includes(q));
    if (scope === "world" && !favF && !q && regionF === "all") {
      list.innerHTML = `<div class="card" style="padding:10px 14px;color:var(--ink-soft);font-size:14px">${t("worldCount", { n: items.length })}</div>`;
      list.innerHTML += shellRows(items);
      return;
    }
    if (!items.length) { list.innerHTML = `<div class="card">${t("noResults")}</div>`; return; }
    list.innerHTML = shellRows(items);
    list.querySelectorAll(".item").forEach((row, i) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("[data-fav]")) return;
        items[i].open();
      });
      row.querySelector("[data-fav]").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFav(profile(), items[i].kind, items[i].id);
        shell();
      });
    });
  }
  function shellRows(items) {
    const p = profile();
    return items.map((it) => {
      const fav = isFav(p, it.kind, it.id);
      return `
      <button class="item" data-kind="${it.key.split("|")[0]}">
        ${it.img ? `<img class="flag" src="${it.img}" alt="" loading="lazy">` : `<span class="ring" style="background:${divColor(it.key.split("|")[1])}">${it.ring}</span>`}
        <span class="tx"><span class="nm">${it.nm}</span><br><span class="sb">${it.sb}</span></span>
        <span class="favbtn" data-fav role="button" aria-label="${t("favorite")}">${fav ? "⭐" : "☆"}</span>
        <span class="st">${it.st ? "★" : ""}</span>
      </button>`;
    }).join("");
  }
  const qin = APP.querySelector("[data-q]");
  qin.addEventListener("input", () => { params.q = qin.value; shell(); });
};
function avatarEmoji(id) {
  const map = { dhaka: "🕌", chattogram: "🏖️", rajshahi: "🏛️", khulna: "🐅", barishal: "⛵", sylhet: "🍵", rangpur: "🎡", mymensingh: "🎨" };
  return map[id] || "📍";
}
function divColor(id) {
  const pal = ["#E5281E", "#F49B1F", "#2FA56A", "#2C6E8A", "#8D6E63", "#6A5ACD", "#C0392B", "#189AB4"];
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return pal[Math.abs(h) % pal.length];
}

/* ---------- detail ---------- */
function screenDetail(params) {
  const { kind, id } = params;
  const p = profile();
  if (kind === "div") {
    const d = divIdx[id];
    const ph = d.photo;
    const stN = starShown(p, "d", id);
    const speakMe = () => speak(_lang === "bn" ? d.bn : d.en, _lang);
    const img = ph && navigator.onLine
      ? `<img class="detail-photo" loading="lazy" src="${ph.url}" alt="${name(d)}" onerror="this.remove()">`
      : `<div class="photo-ph">${ph ? t("off") + " · " + ph.file : ""}${!ph ? "🖼️" : ""}</div>`;
    return html(`
      <button class="btn btn-paper btn-small" data-action="listen"><span class="icon-txt">🔊</span> ${t("listen")}</button>
      <div style="text-align:center;margin:6px 0"><h1 style="color:var(--green)">${name(d)}</h1><span class="stars">${"★".repeat(stN)}${"☆".repeat(3 - stN)}</span></div>
      ${img}
      <div class="card" style="margin-top:10px">
        <div class="stat-grid">
          <div class="stat"><b>${_lang === "bn" ? d.hqBn : d.hq}</b><small>${t("hq")}</small></div>
          <div class="stat"><b>${fmtNum(d.pop)}</b><small>${t("pop")}</small></div>
          <div class="stat"><b>${fmtNum(d.areaKm2)} km²</b><small>${t("area")}</small></div>
          <div class="stat"><b>${fmtNum(d.districts)}</b><small>${t("districts")}</small></div>
          <div class="stat"><b>${fmtNum(d.upazilas)}</b><small>${t("upazilas")}</small></div>
          <div class="stat"><b>${d.est}</b><small>${t("est")}</small></div>
        </div>
        <div class="factbox">${_lang === "bn" ? d.factBn : d.factEn}</div>
        <h3>${t("rivers")}</h3><ul class="rivers">${(d.rivers || []).map((r) => `<li>${_lang === "bn" ? r[1] : r[0]}</li>`).join("")}</ul>
        ${d.photo ? `<p class="attr">${tvar("photoCredits", { a: d.photo.artist }) } · <a href="${d.photo.page}" rel="noopener">CC</a></p>` : ""}
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-nav="play" data-daily="1">▶ ${t("play")}</button></div>`);
  }
  if (kind === "z") {
    const d = distIdx[id];
    const stN = starShown(p, "z", id);
    const favH = isFav(p, "z", id);
    const div = divIdx[d.div];
    const speakMe = () => speak(_lang === "bn" ? d.bn : d.en, _lang);
    return html(`
      <div style="text-align:center;margin:6px 0">
        <h1 style="color:var(--green)">${dname(d)}</h1>
        <span class="stars">${"★".repeat(stN)}${"☆".repeat(3 - stN)}</span>
        <div class="official-txt">${t("district")} · ${name(div)}</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-paper btn-small" data-action="listen"><span class="icon-txt">🔊</span> ${t("listen")}</button>
        <button class="btn btn-paper btn-small ${favH ? "fav-on" : ""}" data-action="fav"><span class="icon-txt">${favH ? "⭐" : "☆"}</span> ${t("favorite")}</button>
      </div>
      <div class="card" style="margin-top:10px">
        <div class="stat-grid">
          <div class="stat"><b>${name(div)}</b><small>${t("division")}</small></div>
          <div class="stat"><b>${fmtNum(d.pop)}</b><small>${t("pop")}</small></div>
          <div class="stat"><b>${fmtNum(d.areaKm2)} km²</b><small>${t("area")}</small></div>
          <div class="stat"><b>${fmtNum(d.density)}/km²</b><small>${t("density")}</small></div>
        </div>
        <div class="factbox">${tvar("districtPractise", { d: dname(d), dv: name(div) })}</div>
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-nav="play">▶ ${t("play")}</button></div>`);
  }
  const c = ctryIdx[id];
  const stN = starShown(p, "c", id);
  const favH = isFav(p, "c", id);
  const nativeTxt = (c.native && c.native.length) ? c.native.slice(0, 2).join(" · ") : "";
  const neigh = (c.neighbors && c.neighbors.length) ? c.neighbors.map((n) => {
    const nc = CTRY.find((x) => x.en === n);
    return nc ? `<span class="chip">${flagUrl(nc.flagCode) ? `<img class="chip-flag" src="${flagUrl(nc.flagCode)}" alt="">` : ""}${_lang === "bn" ? (nc.bn || n) : n}</span>` : `<span class="chip">${n}</span>`;
  }).join(" ") : `<span class="chip">—</span>`;
  return html(`
    <div style="text-align:center;margin:6px 0">
      <h1 style="color:var(--green)">${cname(c)}</h1>
      ${c.official && c.official !== c.en ? `<div class="official-txt">${c.official}</div>` : ""}
      <span class="stars">${"★".repeat(stN)}${"☆".repeat(3 - stN)}</span>
      ${nativeTxt ? `<div class="native-txt">${nativeTxt}</div>` : ""}
    </div>
    <img class="q-flag" src="${flagUrl(c.flagCode)}" alt="${cname(c)}" onerror="this.remove()">
    <div class="btn-row">
      <button class="btn btn-paper btn-small" data-action="listen"><span class="icon-txt">🔊</span> ${t("listen")}</button>
      <button class="btn btn-paper btn-small ${favH ? "fav-on" : ""}" data-action="fav"><span class="icon-txt">${favH ? "⭐" : "☆"}</span> ${t("favorite")}</button>
    </div>
    <div class="card" style="margin-top:10px">
      <div class="stat-grid">
        <div class="stat"><b>${cap(c)}</b><small>${t("capital")}</small></div>
        <div class="stat"><b>${regionBn(c.region)}</b><small>${t("region")}</small></div>
        <div class="stat"><b>${fmtNum(c.area)} km²</b><small>${t("area")}</small></div>
        <div class="stat"><b>${c.population ? fmtPop(c.population) : "—"}</b><small>${t("pop")}</small></div>
      </div>
      ${c.subRegion && c.subRegion !== c.region ? `<div class="factbox"><b>${t("subRegion")}:</b> ${_lang === "bn" ? (SUBREGION_BN[c.subRegion] || c.subRegion) : c.subRegion}</div>` : ""}
      <h3>${t("neighbors")}</h3>
      <div class="chips">${neigh}</div>
    </div>
    <div class="btn-row"><button class="btn btn-primary" data-nav="play">▶ ${t("play")}</button></div>`);
}
MOUNT.detail = (params) => {
  const p = profile();
  const item = params.kind === "div" ? divIdx[params.id] : params.kind === "z" ? distIdx[params.id] : ctryIdx[params.id];
  const favT = params.kind === "div" ? "d" : params.kind === "z" ? "z" : "c";
  bindAction(APP, "listen", (e, btn) => {
    _lang === "bn" ? speak(item.bn, _lang) : speak(item.en, _lang);
  });
  bindAction(APP, "fav", (e, btn) => {
    const v = toggleFav(profile(), favT, params.id);
    btn.classList.toggle("fav-on", v);
    btn.innerHTML = `<span class="icon-txt">${v ? "⭐" : "☆"}</span> ${t("favorite")}`;
    toast(v ? "⭐ " + (params.kind === "div" ? name(item) : params.kind === "z" ? dname(item) : cname(item)) : t("favoriteRemoved"));
  });
  speak(_lang === "bn" ? item.bn : item.en, _lang);
};
function fmtNum(n) { return n ? n.toLocaleString(undefined) : "—"; }
function fmtPop(n) {
  if (!n) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
const SUBREGION_BN = {
  "Southern Asia": "দক্ষিণ এশিয়া", "Western Asia": "পশ্চিম এশিয়া", "Central Asia": "মধ্য এশিয়া",
  "Eastern Asia": "পূর্ব এশিয়া", "South-Eastern Asia": "দক্ষিণ-পূর্ব এশিয়া",
  "Northern Europe": "উত্তর ইউরোপ", "Western Europe": "পশ্চিম ইউরোপ", "Southern Europe": "দক্ষিণ ইউরোপ",
  "Eastern Europe": "পূর্ব ইউরোপ", "Northern Africa": "উত্তর আফ্রিকা", "Western Africa": "পশ্চিম আফ্রিকা",
  "Middle Africa": "মধ্য আফ্রিকা", "Eastern Africa": "পূর্ব আফ্রিকা", "Southern Africa": "দক্ষিণ আফ্রিকা",
  "Northern America": "উত্তর আমেরিকা", "South America": "দক্ষিণ আমেরিকা", "Central America": "মধ্য আমেরিকা",
  "Caribbean": "ক্যারিবীয়", "Australia and New Zealand": "অস্ট্রেলিয়া ও নিউজিল্যান্ড",
  "Melanesia": "মেলানেশিয়া", "Micronesia": "মাইক্রোনেশিয়া", "Polynesia": "পলিনেশিয়া",
  "Antarctic": "অ্যান্টার্কটিকা",
};

/* ---------- play home ---------- */
function screenPlay() {
  return html(`
    <div class="sec-title"><h2>${t("play")}</h2></div>
    <button class="mode-card" style="width:100%;margin:8px 0" data-nav="daily"><div class="em">📅</div><div class="tt">${t("daily")}</div><div class="ds">${t("dailySub")}</div></button>
    <button class="mode-card" style="width:100%;margin:8px 0" data-nav="custom" data-scope="bd"><div class="em"><img class="em-flag" src="${flagUrl("bd")}" alt=""></div><div class="tt">${t("scopeBD")}</div><div class="ds">${t("qtypes")["bd-hq"]} · ${t("qtypes")["bd-fact"]} · ${t("qtypes")["bd-find"]}</div></button>
    <button class="mode-card" style="width:100%;margin:8px 0" data-nav="custom" data-scope="world"><div class="em">🌍</div><div class="tt">${t("scopeWorld")}</div><div class="ds">${t("qtypes")["wf"]} · ${t("qtypes")["wh"]} · ${t("qtypes")["world-find"]}</div></button>
    <button class="mode-card" style="width:100%;margin:8px 0" data-nav="custom" data-scope="both"><div class="em">🎲</div><div class="tt">${t("scopeBDWorld")}</div><div class="ds">${t("customSub")}</div></button>
    <button class="mode-card" style="width:100%;margin:8px 0" data-nav="clock"><div class="em">⏱️</div><div class="tt">${t("clock")}</div><div class="ds">${t("clockSub")}</div></button>`);
}
MOUNT.play = (p) => {};

/* ---------- custom quiz setup ---------- */
let SETUP = { scope: "bd", types: [], count: 10, adaptive: false };
const ALL_TYPES = ["bd-hq", "bd-fact", "bd-find", "d-div", "div-d", "d-find", "wf", "wc", "wh", "hc", "world-find"];
const BD_TYPES = ["bd-hq", "bd-fact", "bd-find", "d-div", "div-d", "d-find"];
const WORLD_TYPES = ["wf", "wc", "wh", "hc", "world-find"];
function screenCustom() {
  const scope = SETUP.scope;
  const shown = scope === "bd" ? BD_TYPES
    : scope === "world" ? WORLD_TYPES
      : ALL_TYPES;
  if (!SETUP.types.length) SETUP.types = shown.slice(0, 3);
  return html(`
    <h2 class="sec-title">${t("custom")}</h2>
    <div class="card">
      <h3>${t("setupScope")}</h3>
      <div class="filter-row">
        <button class="fchip ${scope === "bd" ? "on" : ""}" data-action="s-scope" data-scope="bd">${t("scopeBD")}</button>
        <button class="fchip ${scope === "world" ? "on" : ""}" data-action="s-scope" data-scope="world">${t("scopeWorld")}</button>
        <button class="fchip ${scope === "both" ? "on" : ""}" data-action="s-scope" data-scope="both">${t("scopeBDWorld")}</button>
      </div>
      <h3 style="margin-top:14px">${t("setupTypes")}</h3>
      <div class="filter-row">
        ${shown.map((qt) => `<button class="fchip ${SETUP.types.includes(qt) ? "on" : ""}" data-action="s-type" data-type="${qt}">${t("qtypes")[qt]}</button>`).join("")}
      </div>
      <h3 style="margin-top:14px">${t("setupCount")}</h3>
      <div class="filter-row">
        ${[5, 10, 15].map((n) => `<button class="fchip ${SETUP.count === n ? "on" : ""}" data-action="s-count" data-count="${n}">${tvar("typeCount", { n })}</button>`).join("")}
        <button class="fchip ${SETUP.count === 0 ? "on" : ""}" data-action="s-count" data-count="0">∞</button>
      </div>
      <label class="setting" style="border:none;padding-top:12px">
        <span><span class="tt">${t("adaptive")}</span></span>
        <button class="switch ${SETUP.adaptive ? "on" : ""}" data-action="s-ada"></button>
      </label>
      <button class="btn btn-sun" data-action="s-go" style="margin-top:12px">${t("playBtn")} 🚀</button>
    </div>`);
}
MOUNT.custom = (p) => {
  bindAction(APP, "s-scope", (e, btn) => { SETUP.scope = btn.getAttribute("data-scope"); SETUP.types = []; render("custom"); });
  bindAction(APP, "s-type", (e, btn) => {
    const ty = btn.getAttribute("data-type");
    if (SETUP.types.includes(ty)) SETUP.types = SETUP.types.filter((x) => x !== ty);
    else SETUP.types.push(ty);
    render("custom");
  });
  bindAction(APP, "s-count", (e, btn) => { SETUP.count = parseInt(btn.getAttribute("data-count"), 10); render("custom"); });
  bindAction(APP, "s-ada", () => { SETUP.adaptive = !SETUP.adaptive; render("custom"); });
  bindAction(APP, "s-go", () => {
    if (!scopeAllowed(SETUP.scope)) return;
    const qs = buildQuestionList({ scope: SETUP.scope, types: SETUP.types, count: SETUP.count, adaptive: SETUP.adaptive });
    if (!qs.length) { toast("…"); return; }
    startSession({ title: t("custom"), questions: qs, clock: false, daily: false });
  });
};

/* ---------- clock mode ---------- */
function screenClock() {
  return html(`<div class="card q-prompt">⏱️ ${t("clock")}</div>
    <div class="btn-row"><button class="btn btn-sun" data-action="clock-go">${t("playBtn")}</button>
    <button class="btn btn-paper" data-action="back">${t("back")}</button></div>`);
}
MOUNT.clock = (p) => {
  bindAction(APP, "clock-go", () => {
    if (!scopeAllowed("both")) return;
    const qs = buildQuestionList({ scope: "both", types: ALL_TYPES, count: 0, adaptive: false });
    startSession({ title: t("clock"), questions: qs, clock: true, daily: false });
  });
};

/* ---------- daily ---------- */
function screenDaily() {
  const p = profile();
  const doneToday = p.daily.last === todayKey();
  return html(`
    <h2 class="sec-title">📅 ${t("daily")}</h2>
    <div class="card" style="text-align:center">
      <div style="font-size:52px">${doneToday ? "✅" : "🗓️"}</div>
      <p class="q-prompt">${doneToday ? t("dailyDone") : t("daily.notyet")}</p>
      <div class="streak-pill">🔥 ${p.daily.streak} ${t("streakFlame")}</div>
      ${doneToday ? `<button class="btn btn-paper" data-nav="home">${t("home")}</button>` : `<button class="btn btn-sun" data-action="daily-go">${t("playBtn")} 🚀</button>`}
    </div>`);
}
MOUNT.daily = (p) => {
  bindAction(APP, "daily-go", () => {
    if (!scopeAllowed("both")) return;
    const qs = buildDailyQuestions();
    startSession({ title: t("daily"), questions: qs, clock: false, daily: true });
  });
};

/* ---------- question building ---------- */
function buildQuestionList({ scope, types, count, adaptive }) {
  let pool = [];
  if (scope === "bd" || scope === "both") {
    for (const ty of ["bd-hq", "bd-fact", "bd-find"]) if (types.includes(ty)) pool.push(...divQuestions(ty));
    for (const ty of ["d-div", "div-d", "d-find"]) if (types.includes(ty)) pool.push(...distQuestions(ty));
  }
  if (scope === "world" || scope === "both") {
    for (const ty of ["wf", "wc", "wh", "hc", "world-find"]) if (types.includes(ty)) pool.push(...countryQuestions(ty));
  }
  if (!pool.length) return [];
  const p = profile();
  const qKey = (q) => itemKey(q.type, q.itemId || q.answerId);
  if (adaptive) {
    const w = pool.map((q) => {
      const s = p.itemStats[qKey(q)];
      return 1 + (s ? Math.pow(s.a - s.ok, 2) : 0);
    });
    // weighted shuffle: Fisher–Yates with weights
    const arr = pool.slice();
    const out = [];
    while (arr.length) {
      const total = arr.reduce((sum, q) => sum + (1 + (p.itemStats[qKey(q)] ? Math.pow(p.itemStats[qKey(q)].a - p.itemStats[qKey(q)].ok, 2) : 0)), 0);
      let r = Math.random() * total, pick = 0;
      for (let i = 0; i < arr.length; i++) {
        const q = arr[i];
        const ww = 1 + (p.itemStats[qKey(q)] ? Math.pow(p.itemStats[qKey(q)].a - p.itemStats[qKey(q)].ok, 2) : 0);
        r -= ww;
        if (r <= 0) { pick = i; break; }
      }
      out.push(arr.splice(pick, 1)[0]);
    }
    pool = out;
  } else {
    pool = shuffle(pool);
  }
  if (count > 0) return pool.slice(0, count);
  return pool.slice(0, Math.max(20, Math.min(pool.length, 40)));
}
function distQuestions(ty) {
  return DISTS.map((d) => {
    const div = divIdx[d.div];
    if (ty === "d-div") {
      return { type: "d-div", kind: "text", answerId: d.id, prompt: tvar("qprompts.d-div", { X: name(div) }), choices: fillChoices(DISTS, d, (x) => dname(x), { regionBias: true, regionKey: "div" }) };
    }
    if (ty === "div-d") {
      return { type: "div-d", kind: "text", answerId: div.id, itemId: d.id, prompt: tvar("qprompts.div-d", { X: dname(d) }), choices: fillChoices(DIVS, div, (x) => name(x)) };
    }
    if (ty === "d-find") {
      return { type: "d-find", kind: "map", map: "bd-d", answerId: d.id, prompt: tvar("findPromptBD", { X: dname(d) }) };
    }
    return null;
  }).filter(Boolean);
}
function divQuestions(ty) {
  return DIVS.map((d) => {
    if (ty === "bd-hq") {
      const choices = fillChoices(DIVS, d, (x) => name(x));
      return { type: "bd-hq", kind: "text", answerId: d.id, prompt: tvar("qprompts.bd-hq", { X: _lang === "bn" ? d.hqBn : d.hq }), choices };
    }
    if (ty === "bd-fact") {
      const fact = (_lang === "bn" ? d.factBn : d.factEn);
      const short = fact.length > 110 ? fact.slice(0, 110) + "…" : fact;
      return { type: "bd-fact", kind: "text", answerId: d.id, prompt: "❓ " + short, fact: true, choices: fillChoices(DIVS, d, (x) => name(x)) };
    }
    if (ty === "bd-find") {
      return { type: "bd-find", kind: "map", map: "bd", answerId: d.id, prompt: tvar("findPromptBD", { X: name(d) }) };
    }
    return null;
  }).filter(Boolean);
}
function countryQuestions(ty) {
  return CTRY.map((c) => {
    if (!ctryIdx[c.id]) return null;
    if (ty === "wf") return { type: "wf", kind: "flag", flagCode: c.flagCode, answerId: c.id, prompt: t("qprompts.wf"), choices: fillChoices(CTRY, c, (x) => cname(x), { regionBias: true }) };
    if (ty === "wc") return { type: "wc", kind: "flagchoice", answerId: c.id, prompt: tvar("qprompts.wc", { X: cname(c) }), choices: fillChoices(CTRY, c, (x) => cname(x), { asFlag: true, regionBias: true }) };
    if (ty === "wh") return { type: "wh", kind: "text", answerId: c.id, prompt: tvar("qprompts.wh", { X: cname(c) }), choices: fillChoices(CTRY, c, (x) => cap(x), { uniq: "cap", regionBias: true }) };
    if (ty === "hc") return { type: "hc", kind: "text", answerId: c.id, prompt: tvar("qprompts.hc", { X: cap(c) }), choices: fillChoices(CTRY, c, (x) => cname(x), { regionBias: true }) };
    if (ty === "world-find") return { type: "world-find", kind: "map", map: "world", answerId: c.id, prompt: tvar("findPromptWorld", { X: cname(c) }) };
    return null;
  }).filter(Boolean);
}
function fillChoices(pool, answer, labelFn, opts = {}) {
  const N = opts.n || 3;
  let base = [];
  if (opts.uniq === "cap") {
    const used = new Set([cap(answer)]);
    const sh = shuffle(pool.filter((x) => x.id !== answer.id));
    for (const x of sh) { if (used.has(cap(x))) continue; base.push(x); used.add(cap(x)); if (base.length === N) break; }
    if (base.length < N) base = base.concat(shuffle(pool.filter((x) => x.id !== answer.id)).slice(0, N));
  } else if (opts.regionBias && answer.region && pool.some((x) => x !== answer && x.region === answer.region)) {
    // prefer distractors from the same region when possible (harder, more instructive)
    const sameRegion = shuffle(pool.filter((x) => x.id !== answer.id && x.region === answer.region));
    const others = shuffle(pool.filter((x) => x.id !== answer.id && x.region !== answer.region));
    base = [];
    let si = 0, oi = 0;
    while (base.length < N) {
      if (sameRegion[si]) base.push(sameRegion[si++]);
      else if (others[oi]) base.push(others[oi++]);
      else break;
    }
  } else {
    base = shuffle(pool.filter((x) => x.id !== answer.id)).slice(0, N);
  }
  const choices = shuffle([answer, ...base]).map((x) => ({ id: x.id, label: labelFn(x), flag: !!opts.asFlag })).filter((c) => c.label);
  return choices;
}

/* ---------- daily questions (deterministic) ---------- */
function buildDailyQuestions() {
  const rng = mulberry(Number(todayKey().replace(/-/g, "")));
  const plan = ["bd-hq", "bd-fact", "d-div", "bd-find", "d-find", "wf", "wf", "wh", "hc", "world-find"];
  const out = [];
  const rpick = (arr) => arr[Math.floor(rng() * arr.length)];
  const rsh = (arr) => { const b = arr.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  for (const ty of plan) {
    if (ty === "bd-hq" || ty === "bd-fact" || ty === "bd-find") {
      const q = rpick(divQuestions(ty));
      if (q) { q.choices = fillChoices(DIVS, divIdx[q.answerId], (x) => name(x)); out.push(q); }
    } else if (ty === "d-div" || ty === "div-d" || ty === "d-find") {
      const q = rpick(distQuestions(ty));
      if (q) {
        if (ty === "d-div") q.choices = fillChoices(DISTS, distIdx[q.answerId], (x) => dname(x), { regionBias: true, regionKey: "div" });
        else if (ty === "div-d") q.choices = fillChoices(DIVS, divIdx[q.answerId], (x) => name(x));
        out.push(q);
      }
    } else {
      const q = rpick(countryQuestions(ty));
      if (q && q.answerId) {
        const opts = ty === "wh" ? { uniq: "cap" } : ty === "wc" ? { asFlag: true } : {};
        const label = ty === "wh" ? (x) => cap(x) : (x) => cname(x);
        q.choices = fillChoices(CTRY, ctryIdx[q.answerId], label, opts);
        out.push(q);
      }
    }
  }
  return out.length === 10 ? out : out.slice(0, 10);
}

/* ================= session runner ================= */
let S = null; // session object
function screenSession() {
  return html("<div></div>");
}
function startSession(conf) {
  S = { conf, idx: 0, correct: 0, wrong: [], answered: 0, startedAt: Date.now(), over: false, lastPicked: null, lastOK: false };
  stack.push({ name: "session", params: {} });
  render("session");
  MOUNT.session(conf);
}
MOUNT.session = function (conf) {
  function show() {
    const app = APP;
    const s = S;
    if (s.over) return;
    if (s.idx >= s.conf.questions.length) { finish(); return; }
    const q = s.conf.questions[s.idx];
    const n = s.conf.questions.length;
    let inner;
    if (q.kind === "map") {
      inner = mapQuestionHTML(s, q, n);
    } else if (q.kind === "flag" || q.kind === "flagchoice") {
      inner = flagQuestionHTML(s, q, n);
    } else {
      inner = textQuestionHTML(s, q, n);
    }
    let rootEl = APP.querySelector("#q-root");
    if (!rootEl) { rootEl = document.createElement("div"); rootEl.id = "q-root"; APP.appendChild(rootEl); }
    rootEl.innerHTML = inner;
    if (q.kind === "map") mountMapQuestion(s, q);
    else mountChoiceQuestion(s, q);
    if (s.conf.clock) startClock(s);
  }
  show();
};
function qBar(s) {
  const pct = (s.idx / s.conf.questions.length) * 100;
  return `<div class="q-progress"><i style="width:${Math.min(100, pct)}%"></i></div>`;
}
function qHead(s) {
  return `<div class="q-top"><b>${t("score")}:</b> <span class="q-score">${s.correct} ✓</span><span style="opacity:.6">· ${s.answered}</span></div>`;
}
function textQuestionHTML(s, q, n) {
  return `
    ${qHead(s)}${qBar(s)}
    <div class="q-prompt">${q.prompt}</div>
    <div class="choices">
      ${q.choices.map((c, i) => `<button class="choice" data-choice="${c.id}"><span class="ltr">${"ABCD"[i]}</span><span class="nm">${c.label}</span></button>`).join("")}
    </div>`;
}
function flagQuestionHTML(s, q, n) {
  const prompt = q.prompt ? `<div class="q-prompt">${q.prompt}</div>` : "";
  const body = q.kind === "flag"
    ? `<img class="q-flag" src="${flagUrl(q.flagCode)}" alt="?" onerror="this.remove()">
       <div class="choices">${q.choices.map((c, i) => `<button class="choice" data-choice="${c.id}"><span class="ltr">${"ABCD"[i]}</span><span class="nm">${c.label}</span></button>`).join("")}</div>`
    : `<div class="choices">${q.choices.map((c, i) => `<button class="choice" data-choice="${c.id}"><img class="flag" src="${flagUrl(c.flag)}" alt="" onerror="this.remove()"><span class="ltr" style="width:auto;background:none;color:var(--green-3)">${"ABCD"[i]}</span></button>`).join("")}</div>`;
  return `${qHead(s)}${qBar(s)}${prompt}${body}`;
}
function mapQuestionHTML(s, q, n) {
  return `${qHead(s)}${qBar(s)}
    <div class="q-prompt">${q.prompt}</div>
    <div class="map-wrap">
      <canvas class="map-canvas" data-mapcanvas="1" width="${q.map === "bd" || q.map === "bd-d" ? 640 : 900}" height="${q.map === "bd" || q.map === "bd-d" ? 840 : 460}"></canvas>
      <div class="map-hint">${t("map.hint.quiz")}</div>
    </div>`;
}
function mountChoiceQuestion(s, q) {
  APP.querySelectorAll(".choice").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (s.answered !== s.idx) return;
      const pick = btn.getAttribute("data-choice");
      answerSession(s, q, pick, btn);
    });
  });
}
function mountMapQuestion(s, q) {
  const canvas = APP.querySelector("[data-mapcanvas]");
  const md = makeMapModel(q.map);
  drawMap(canvas, md, { interact: md.kind, target: q.answerId, mode: "quiz" });
  canvas.addEventListener("pointerdown", (e) => {
    if (s.answered !== s.idx) return;
    const pt = evToCanvas(canvas, md, e);
    const hit = md.hit(pt.x, pt.y);
    if (!hit) return;
    answerSession(s, q, hit, canvas, q.answerId);
  });
}
function answerSession(s, q, pick, spot, correctId) {
  if (s.answered > s.idx) return;
  s.answered = s.idx + 1;
  const ok = String(pick) === String(q.answerId);
  if (ok) s.correct++;
  else s.wrong.push(q);
  s.lastPicked = pick; s.lastOK = ok;
  const p = profile();
  if (p) {
    p.stats.asked++; if (ok) p.stats.correct++;
    bumpAndStars(p, q, ok);
    save();
  }
  applyFeedback(q, ok, pick, spot);
  if (ok) sfx("correct"); else sfx("wrong");
  if (S.conf.clock && ok) { stopClockForNiceMoment(); }
  setTimeout(() => { s.idx++; showNext(S); }, ok ? 950 : 1800);
}
function bumpAndStars(p, q, ok) {
  const ansId = q.itemId || q.answerId;
  let entType;
  if (q.type === "bd-hq" || q.type === "bd-fact" || q.map === "bd") entType = "d";
  else if (q.type === "d-div" || q.type === "div-d" || q.type === "d-find" || q.map === "bd-d") entType = "z";
  else entType = "c";
  bumpItem(p, entType, ansId, ok);
  addStars(p, entType, ansId, ok);
}
function applyFeedback(q, ok, pick, spot) {
  vibrate(ok ? 30 : 80);
  if (q.kind === "map") {
    const canvas = APP.querySelector("[data-mapcanvas]");
    if (canvas) {
      const md = makeMapModel(q.map);
      drawMap(canvas, md, { interact: "none", target: q.answerId, picked: pick, ok, mode: "quiz" });
    }
  } else {
    APP.querySelectorAll(".choice").forEach((btn) => {
      btn.classList.add("dis");
      const id = btn.getAttribute("data-choice");
      if (id === q.answerId) btn.classList.add("ok");
      else if (id === pick) btn.classList.add("bad");
    });
  }
  const rightLabel = q.kind === "map"
    ? (q.map === "bd-d" ? (distIdx[q.answerId] ? dname(distIdx[q.answerId]) : q.answerId)
       : q.map === "bd" ? name(divIdx[q.answerId]) : cname(ctryIdx[q.answerId]))
    : (q.choices.find((c) => c.id === q.answerId) || { label: "" }).label;
  if (ok) {
    toast("✅ " + t("correct"));
    speak(rightLabel, _lang);
  } else {
    toast("❌ " + t("wrong") + " → " + rightLabel);
  }
}
function showNext(s) {
  if (s.idx >= s.conf.questions.length) finish();
  else MOUNT.session();
}
let _clockT = null;
function startClock(s) {
  s.clockLeft = 60;
  const st = document.createElement("div");
  st.className = "q-timer";
  APP.insertBefore(st, APP.querySelector("#q-root") || APP.firstChild);
  clearInterval(_clockT);
  _clockT = setInterval(() => {
    s.clockLeft--;
    st.textContent = "⏱ " + s.clockLeft + "s";
    if (s.clockLeft <= 0) { clearInterval(_clockT); finish(); }
  }, 1000);
}
function stopClockForNiceMoment() { if (_clockT) { /* keep running barely */ } }
function finish() {
  clearInterval(_clockT);
  S.over = true;
  const s = S;
  const p = profile();
  const total = s.conf.questions.length;
  const pct = Math.round((s.correct / total) * 100);
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 50 ? 1 : 0;
  // record best
  p.best = Math.max(p.best || 0, s.correct);
  // daily streak logic
  if (s.conf.daily) {
    const tk = todayKey();
    if (p.daily.last !== tk) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yk = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
      p.daily.streak = p.daily.last === yk ? (p.daily.streak || 0) + 1 : 1;
      p.daily.last = tk;
      if (p.daily.streak > 1) sfx("streak");
    }
  }
  const result = { pct, stars, correct: s.correct, total, wrong: s.wrong.slice(0, 8), daily: s.conf.daily, best: p.best || 0 };
  const hasMapFind = s.conf.questions.some((q) => q.kind === "map");
  const hasFlag = s.conf.questions.some((q) => q.kind === "flag");
  if (hasFlag && pct === 100) p._flagMaster = true;
  if (hasMapFind && pct === 100) p._mapMaster = true;
  if (pct === 100 && total >= 10) p._best10 = true;
  const oldLv = getLevel(p);
  save();
  if (stars >= 2) confetti();
  sfx("finish");
  const newBadges = checkBadges(p);
  if (newBadges.length) {
    setTimeout(() => {
      for (const b of newBadges) { sfx("badge"); toast(`${b.icon} ${b.en} — ${_lang === "bn" ? b.descBn : b.descEn}`); }
      confetti();
    }, 1400);
  }
  const newLv = getLevel(p);
  if (newLv > oldLv) {
    setTimeout(() => { sfx("levelUp"); toast(`⬆️ Level ${newLv}!`); confetti(); }, newBadges.length ? 2800 : 600);
  }
  if (result.wrong.length === total) speak(t("wrong"), _lang);
  replace("results", result);
}

/* ---------- results ---------- */
function screenResults(params) {
  const r = params;
  const emoticon = r.stars >= 3 ? "🏆" : r.stars === 2 ? "🎉" : r.stars === 1 ? "🙂" : "💪";
  const msg = r.stars >= 3 ? t("results.great") : r.stars === 2 ? t("results.good") : r.pct >= 50 ? t("results.good") : t("results.keep");
  const wrongHTML = r.wrong.length ? `
    <div class="card" style="text-align:left">
      <h3>${t("wrongList")}</h3>
      <ul class="wrong-list" style="padding-left:0;margin-top:8px;list-style:none">${r.wrong.map((q) => {
        const correctId = q.itemId || q.answerId;
        let correctName;
        if (q.map === "bd-d" || q.type === "d-div" || q.type === "d-find" || q.type === "div-d") {
          const dd = distIdx[correctId] || distIdx[q.answerId];
          correctName = dd ? dname(dd) : correctId;
        } else if (q.type === "bd-fact" || (q.kind === "map" && q.map === "bd")) {
          correctName = name(divIdx[correctId]);
        } else {
          correctName = cname(ctryIdx[correctId]);
        }
        const lbl = q.choices ? (q.choices.find((c) => c.id === correctId) || { label: correctName }).label : correctName;
        const icon = q.kind === "map" ? "📍 " : q.kind === "flag" ? `🏳️ ` : q.flagCode ? "❤️ " : "💬 ";
        return `<li style="margin:6px 0"><span class="qw">${q.prompt.replace(/^❓\s*/, "").slice(0, 70)}</span><br><span class="qa">✅ ${icon}${lbl}</span></li>`;
      }).join("")}</ul>
      <button class="btn btn-paper btn-small" data-action="retry-wrong" style="margin-top:10px">${t("tryAgainBtn")}</button>
    </div>` : "";
  const shareBtn = navigator.share ? `<button class="btn btn-paper" data-action="share-res" style="flex:1">📤 ${t("share")}</button>` : "";
  const retryAction = r.daily ? "retry-daily" : "retry-session";
  return html(`
    <div class="results">
      <div class="big">${emoticon}</div>
      <div class="stars-big">${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</div>
      <div class="score">${msg} ${r.correct}/${r.total} · ${r.pct}%</div>
      <div class="streak-pill">🔥 ${profile().daily.streak} ${t("streakFlame")}</div>
      ${wrongHTML}
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-primary" data-action="${retryAction}">🔁 ${t("again")}</button>
        <button class="btn btn-paper" data-nav="home">🏠 ${t("home")}</button>
        ${shareBtn}
      </div>
    </div>`);
}
MOUNT.results = (params) => {
  bindAction(APP, "retry-session", () => { go("custom"); });
  bindAction(APP, "retry-daily", () => { const qs = buildDailyQuestions(); startSession({ title: t("daily"), questions: qs, clock: false, daily: true }); });
  bindAction(APP, "retry-wrong", () => {
    const qs = S && S.conf.daily ? buildDailyQuestions() : buildQuestionList({ scope: SETUP.scope, types: SETUP.types, count: 0, adaptive: true });
    startSession({ title: t("tryAgainBtn"), questions: qs, clock: false, daily: false });
  });
  bindAction(APP, "share-res", async (e, btn) => {
    try { await navigator.share({ title: "Geo Buddy", text: `${params.correct}/${params.total} (${params.pct}%)` }); }
    catch {}
  });
};

/* ================= map model + canvas ================= */
let MODEL_CACHE = {};
function makeMapModel(kind) {
  if (MODEL_CACHE[kind]) return MODEL_CACHE[kind];
  const src = kind === "bd" ? BD_MAP : kind === "bd-d" ? BD_MAP_D : WORLD_MAP;
  const W = kind === "bd" || kind === "bd-d" ? 640 : 900;
  const H = kind === "bd" || kind === "bd-d" ? 840 : 460;
  const entries = Object.entries(src).map(([k, d]) => {
    const key = kind === "bd" || kind === "bd-d" ? k : String(k);
    let path;
    try { path = new Path2D(d); } catch { path = null; }
    return { key, d, path };
  }).filter((x) => x.path);
  const model = { kind, W, H, entries };
  const divBase = { "Barishal": "barishal", "Chattogram": "chattogram", "Dhaka": "dhaka", "Khulna": "khulna", "Rajshahi": "rajshahi", "Rangpur": "rangpur", "Sylhet": "sylhet", "Mymensingh": "mymensingh" };
  model.toId = (k) => (kind === "bd" ? (divBase[k] || k) : kind === "bd-d" ? k : dbMapsKeyToId(k));
  model.scratch = document.createElement("canvas").getContext("2d"); // identity CTM: logical coords
  model.hit = (x, y) => {
    for (let i = model.entries.length - 1; i >= 0; i--) {
      const en = model.entries[i];
      if (!en.path) continue;
      try { if (model.scratch.isPointInPath(en.path, x, y)) return model.toId(en.key); } catch {}
    }
    return null;
  };
  MODEL_CACHE[kind] = model;
  return model;
}
function dbMapsKeyToId(k) {
  // world map keys are iso numeric strings; some padded ("100"). find country
  for (const c of CTRY) if (c.id === k || c.id.replace(/^0+/, "") === k.replace(/^0+/, "")) return c.id;
  return k;
}
const DIV_PALETTE = {
  barishal: "#E9C46A", chattogram: "#F49B1F", dhaka: "#2FA56A",
  khulna: "#2C6E8A", mymensingh: "#8D6E63", rajshahi: "#6A5ACD",
  rangpur: "#C0392B", sylhet: "#189AB4",
};
function colorForBD(id, kind) {
  if (kind === "bd-d") {
    const d = distIdx[id];
    const base = DIV_PALETTE[d && d.div] || "#DCEFD6";
    const i = Math.abs(hashStr(id)) % 5;
    return tint(base, 1 - i * 0.10);
  }
  return DIV_PALETTE[String(id).toLowerCase()] || "#DCEFD6";
}
function hashStr(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; }
function tint(hex, light) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * (1 - light));
  const ng = Math.round(g + (255 - g) * (1 - light));
  const nb = Math.round(b + (255 - b) * (1 - light));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}
function drawMap(canvas, md, opts = {}) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = md.W * dpr;
  canvas.height = md.H * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, md.W, md.H);
  ctx.fillStyle = "#EAF4E4";
  ctx.fillRect(0, 0, md.W, md.H);
  const interact = opts.interact !== "none";
  const labelOn = opts.labels !== false;
  ctx.lineJoin = "round";
  const divOf = (id) => {
    if (md.kind === "bd") return String(id || "").toLowerCase();
    if (md.kind === "bd-d") {
      const d = distIdx[id];
      return d ? d.div : String(id || "").toLowerCase();
    }
    const c = ctryIdx[id]; return c ? c.id : id;
  };
  for (const en of md.entries) {
    const id = md.toId(en.key);
    const isTarget = String(id) === String(opts.target);
    const isPicked = String(id) === String(opts.picked);
    ctx.beginPath();
    ctx.fillStyle = normalFill(md, id, opts);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = isTarget || isPicked ? 2.5 : 0.9;
    ctx.fill(en.path);
    if (interact) {
      ctx.lineWidth = 0.9;
      ctx.stroke(en.path);
    }
    if (isTarget) {
      ctx.strokeStyle = isPicked && !opts.ok ? "#F49B1F" : "#0E3B2E";
      ctx.lineWidth = 3.2;
      ctx.stroke(en.path);
    }
  }
  // labels
  if (labelOn && md.kind === "bd") {
    ctx.fillStyle = "#0E3B2E";
    ctx.font = "700 15px 'Noto Sans Bengali', sans-serif";
    ctx.textAlign = "center";
    for (const [k, [x, y]] of Object.entries(BD_LABELS)) {
      const en = md.entries.find((e) => e.key === k);
      if (!en) continue;
      const id = md.toId(k);
      if (interact && id === opts.target) continue; // user must find it; hide target label
      ctx.fillText(_lang === "bn" ? (divIdx[id] ? divIdx[id].bn : k) : k, x, y + 9);
    }
  }
  if (labelOn && md.kind === "bd-d") {
    ctx.fillStyle = "#0E3B2E";
    ctx.font = "600 11px 'Noto Sans Bengali', sans-serif";
    ctx.textAlign = "center";
    for (const [k, [x, y]] of Object.entries(BD_LABELS_D)) {
      const id = md.toId(k);
      if (interact && id === opts.target) continue;
      const d = distIdx[id];
      ctx.fillText(d ? dname(d) : k, x, y + 4);
    }
  }
  if (labelOn && md.kind === "world") {
    ctx.fillStyle = "rgba(14,59,46,.85)";
    ctx.font = "600 13px 'Noto Sans Bengali', sans-serif";
    ctx.textAlign = "center";
    const shown = new Set();
    for (const id of bigCountries()) {
      if (shown.has(id)) continue;
      const key = findWorldKey(id);
      const lb = WORLD_LABELS[key];
      if (!lb) continue;
      if (String(id) === String(opts.target)) continue;
      shown.add(id);
      ctx.fillText(cname(ctryIdx[id]), lb[0], lb[1] + 4);
    }
    // overlay target hint when not interactive
    if (!interact && opts.target) {
      const key = findWorldKey(opts.target);
      const lb = WORLD_LABELS[key];
      if (lb) {
        ctx.font = "700 15px 'Noto Sans Bengali', sans-serif";
        ctx.fillText(cname(ctryIdx[opts.target]), lb[0], lb[1] - 8);
      }
    }
  }
  // legend
  const legend = APP.querySelector(".map-legend");
  if (legend) {
    legend.innerHTML = md.kind === "bd" || md.kind === "bd-d"
      ? DIVS.map((d) => `<span><span class="sw" style="background:${DIV_PALETTE[d.id]}"></span>${_lang === "bn" ? d.bn : d.en}</span>`).join("")
      : "";
  }
}
function normalFill(md, id, opts) {
  if (opts.ok && (md.kind === "bd" || md.kind === "bd-d") && String(id) === String(opts.target)) return "#2FA56A";
  if (opts.ok && md.kind === "world" && String(id) === String(opts.target)) return "#2FA56A";
  if (opts.picked && String(id) === String(opts.picked) && !opts.ok) return "#F49B1F";
  if (md.kind === "bd" || md.kind === "bd-d") return colorForBD(id, md.kind);
  const c = ctryIdx[id];
  const tier = c ? (c.area > 200000 ? "#9CCF9D" : c.area > 20000 ? "#BFD9A8" : "#D8E6C2") : "#E8E8D5";
  return tier;
}
function bigCountries() {
  return CTRY.filter((c) => c.area > 300000).map((c) => c.id);
}
function findWorldKey(id) {
  const want = String(id).replace(/^0+/, "");
  for (const k of Object.keys(WORLD_MAP)) if (k.replace(/^0+/, "") === want) return k;
  return id;
}
function evToCanvas(canvas, md, e) {
  const r = canvas.getBoundingClientRect();
  // logical canvas coordinates (Path2D space), independent of devicePixelRatio & CSS scaling
  return { x: (e.clientX - r.left) * (md.W / r.width), y: (e.clientY - r.top) * (md.H / r.height) };
}

/* ---------- map explorer screen ---------- */
function screenMap(params = {}) {
  const kind = params.kind || "bd";
  const level = params.level || (kind === "bd" ? "div" : "world");
  const bdLevel = kind === "bd" ? `
    <div class="chips level-chips">
      <button class="chip ${level === "div" ? "on" : ""}" data-action="map-level" data-level="div">🗺️ ${t("levelDivisions")}</button>
      <button class="chip ${level === "dist" ? "on" : ""}" data-action="map-level" data-level="dist">🧩 ${t("levelDistricts")}</button>
    </div>` : "";
  const W = kind === "bd-d" ? 640 : kind === "bd" ? 640 : 900;
  const H = kind === "bd-d" ? 840 : kind === "bd" ? 840 : 460;
  return html(`
    <div class="tabs">
      <button class="tab ${kind === "bd" || kind === "bd-d" ? "on" : ""}" data-action="map-kind" data-kind="bd"><img class="tab-flag" src="${flagUrl("bd")}" alt=""> ${t("sectionBD")}</button>
      <button class="tab ${kind === "world" ? "on" : ""}" data-action="map-kind" data-kind="world">🌍 ${t("sectionWorld")}</button>
    </div>
    ${bdLevel}
    <div class="map-wrap">
      <canvas class="map-canvas" data-mapcanvas="1" width="${W}" height="${H}" style="width:100%"></canvas>
      <div class="map-hint" id="maptip"></div>
    </div>
    <div class="map-legend"></div>
    <div class="card" id="mapinfo"><p style="color:var(--ink-soft)">👆 ${t(level === "dist" ? "map.hint.bdd" : kind === "bd" ? "map.hint.bd" : "map.hint.world")}</p></div>
    <div class="btn-row"><button class="btn btn-paper" data-nav="play">🎯 ${t("play")}</button></div>`);
}
MOUNT.map = (params = {}) => {
  const kind = params.kind === "world" ? "world" : (params.level === "dist" ? "bd-d" : "bd");
  const canvas = APP.querySelector("[data-mapcanvas]");
  const md = makeMapModel(kind);
  let hover = null;
  function redraw() {
    drawMap(canvas, md, { interact: true, labels: true, mode: "explore" });
  }
  redraw();
  canvas.addEventListener("pointermove", (e) => {
    const pt = evToCanvas(canvas, md, e);
    const id = md.hit(pt.x, pt.y);
    const tip = APP.querySelector("#maptip");
    const info = APP.querySelector("#mapinfo");
    const isBD = kind === "bd" || kind === "bd-d";
    if (id && id !== hover) {
      hover = id;
      const nm = isBD ? (kind === "bd-d" ? dname(distIdx[id]) : name(divIdx[id])) : cname(ctryIdx[id]);
      tip.textContent = nm;
      redraw();
      drawLabel(canvas, md, id);
      info.innerHTML = infoRow(kind === "bd-d" ? distIdx[id] : kind === "bd" ? divIdx[id] : ctryIdx[id], kind);
    } else if (!id && hover) {
      hover = null;
      const hint = t(kind === "bd-d" ? "map.hint.bdd" : isBD ? "map.hint.bd" : "map.hint.world");
      tip.textContent = hint;
      redraw();
      info.innerHTML = `<p style="color:var(--ink-soft)">👆 ${hint}</p>`;
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    const pt = evToCanvas(canvas, md, e);
    const id = md.hit(pt.x, pt.y);
    if (id) go("detail", kind === "world" ? { kind: "c", id } : kind === "bd-d" ? { kind: "z", id } : { kind: "div", id });
  });
};
function drawLabel(canvas, md, id) {
  const ctx = canvas.getContext("2d");
  const x = 12, y = 26;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ctx.fillStyle = "rgba(14,59,46,.92)";
  ctx.fillRect(0, 0, canvas.width / dpr, 44);
  const isBD = md.kind === "bd" || md.kind === "bd-d";
  const big = md.kind === "bd" ? name(divIdx[id]) : md.kind === "bd-d" ? dname(distIdx[id]) : cname(ctryIdx[id]);
  ctx.fillStyle = "#fff";
  ctx.font = "700 16px 'Noto Sans Bengali', sans-serif";
  ctx.fillText(big, x, y);
  ctx.fillStyle = "#FBF3E2";
  ctx.font = "11px 'Noto Sans Bengali', sans-serif";
  ctx.fillText(md.kind === "bd"
    ? t("division")
    : md.kind === "bd-d" ? t("inDivision", { X: name(divIdx[distIdx[id].div]) })
    : t("capital") + ": " + cap(ctryIdx[id]), x, y + 14);
}
function infoRow(obj, kind) {
  if (kind === "bd") {
    const d = obj;
    return `<b style="color:var(--green)">${name(d)}</b> · ${fmtNum(d.pop)} ${t("pop").toLowerCase()} · ${t("hq")} ${_lang === "bn" ? d.hqBn : d.hq}`;
  }
  if (kind === "bd-d") {
    const d = obj;
    return `<b style="color:var(--green)">${dname(d)}</b> · ${t("district")} · ${name(divIdx[d.div])} · ${fmtNum(d.pop)} ${t("pop").toLowerCase()}`;
  }
  const c = obj;
  return `<b style="color:var(--green)">${cname(c)}</b> · ${cap(c)} · ${c.iso3}`;
}

/* ================= parent zone ================= */
function screenPin(params) {
  const setting = !D.settings.pin;
  const title = setting ? t("pinSetTitle") : t("pinEnter");
  return html(`
    <h2 class="sec-title">🔒 ${t("pinTitle")}</h2>
    <div class="card" style="text-align:center">
      <p class="q-prompt">${title}</p>
      <div class="pin-dots" id="pin-dots"><i></i><i></i><i></i><i></i></div>
      <div class="pin-pad" id="pin-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="pin-key" data-n="${n}">${n}</button>`).join("")}
        <button class="pin-key" data-n="clear" style="font-size:16px">⌫</button>
        <button class="pin-key" data-n="0">0</button>
        <button class="pin-key" data-n="ok" style="font-size:16px">✓</button>
      </div>
    </div>
    <button class="btn btn-paper" data-action="back">← ${t("back")}</button>`);
}
MOUNT.pin = (params = {}) => {
  const setting = params.set || !D.settings.pin;
  let buf = "";
  const pad = APP.querySelector("#pin-pad");
  pad.addEventListener("click", (e) => {
    const b = e.target.closest(".pin-key");
    if (!b) return;
    const n = b.getAttribute("data-n");
    if (n === "clear") { buf = buf.slice(0, -1); }
    else if (n === "ok") {
      if (buf.length !== 4) { toast("4"); return; }
      if (setting) {
        D.settings.pin = buf; save();
        go("parent");
        toast("✅");
        return;
      }
      if (buf === D.settings.pin) {
        go("parent");
        toast(t("pinUnlocked") + " 🔓");
} else if (opts.regionKey && answer[opts.regionKey] && pool.some((x) => x !== answer && x[opts.regionKey] === answer[opts.regionKey])) {
    const same = shuffle(pool.filter((x) => x.id !== answer.id && x[opts.regionKey] === answer[opts.regionKey]));
    const others = shuffle(pool.filter((x) => x.id !== answer.id && x[opts.regionKey] !== answer[opts.regionKey]));
    base = [];
    let si = 0, oi = 0;
    while (base.length < N) {
      if (same[si]) base.push(same[si++]);
      else if (others[oi]) base.push(others[oi++]);
      else break;
    }
  } else {
        toast(t("pinWrong") + " ❌");
        buf = "";
      }
    } else { if (buf.length < 4) buf += n; }
    paintDots();
  });
  function paintDots() {
    APP.querySelectorAll("#pin-dots i").forEach((d, i) => d.classList.toggle("f", i < buf.length));
  }
  paintDots();
};
function licCard() {
  const l = licence();
  const has = !!l.key;
  return `
    <div class="card">
      <h3>🔑 ${t("licence")}</h3>
      <p class="ds" style="margin-top:6px">${t("licenceSub")}</p>
      <div class="setting" style="border:none;margin-top:8px">
        <span><span class="tt">${licenceLabel()}</span>
        ${has ? `<br><span class="ds">${l.email}${l.deviceLimit ? ` · ${tvar("licDevices", { n: l.deviceCount || 0, limit: l.deviceLimit })}` : ""}</span>` : ""}</span>
        ${has ? `<button class="btn btn-mini" style="background:var(--cream);color:var(--bad)" data-action="p-lic-remove">${t("licRemove")}</button>` : ""}
      </div>
      ${has ? "" : `
      <input id="lic-email" class="lic-inp" inputmode="email" autocomplete="email" placeholder="${t("licEmail")}">
      <input id="lic-key" class="lic-inp" spellcheck="false" autocomplete="off" placeholder="${t("licKey")} — GB-XXXX-XXXX" style="margin-top:8px">
      <button class="btn btn-sun btn-small" style="margin-top:10px;padding:12px" data-action="p-lic-activate">🔑 ${t("licActivate")}</button>`}
    </div>`;
}
function screenParent() {
  const p = profile();
  return html(`
    <h2 class="sec-title">🔓 ${t("parentZone")}</h2>
    <div class="card">
      <h3>${t("settings")}</h3>
      <div class="setting">
        <span><span class="tt">🔊 ${t("soundEff")}</span><br><span class="ds">${t("soundEffSub")}</span></span>
        <button class="switch ${D.settings.soundEnabled ? "on" : ""}" data-action="p-sound"></button>
      </div>
      <div class="setting">
        <span><span class="tt">${t("langLock")}</span><br><span class="ds">${t("langLockSub")}</span></span>
        <button class="switch ${D.settings.lockLang ? "on" : ""}" data-action="p-lock"></button>
      </div>
      <div class="setting">
        <span><span class="tt">${t("clearData")}</span><br><span class="ds">${t("clearDataSub")}</span></span>
        <button class="btn btn-mini" style="background:var(--bad);color:#fff" data-action="p-clear">🗑</button>
      </div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-paper" data-action="p-export">📥 ${t("export")}</button>
        <button class="btn btn-paper" data-nav="about">ℹ️ ${t("about")}</button>
      </div>
    </div>
    ${licCard()}
    <div class="card">
      <h3>🏅 ${t("badgeTitle")}</h3>
      <div class="badge-grid" style="margin-top:10px">
        ${Object.keys(p.badges || {}).length
          ? Object.entries(p.badges).map(([bid]) => {
              const b = BADGES.find((x) => x.id === bid);
              return b ? `<span class="badge-sec" title="${b.descEn}">${b.icon} ${_lang === "bn" ? b.bn : b.en}</span>` : "";
            }).join("")
          : `<span style="font-size:14px;color:var(--muted)">${t("badgeNone")}</span>`}
      </div>
    </div>
    <div class="card">
      <h3>${t("profileStats")}</h3>
      ${Object.values(D.profiles).map((p2) => `
        <div class="setting" style="border:none">
          <span><span class="av" style="background:${p2.avatar.color}">${p2.avatar.icon}</span>
          <span><span class="tt">${p2.name}</span><br><span class="ds">${t("totalAsked")}: ${p2.stats.asked} · ${t("totalCorrect")}: ${p2.stats.correct}</span></span></span>
          <button class="btn btn-mini" data-action="p-del" data-id="${p2.id}" style="background:var(--cream);color:var(--bad)">✕</button>
        </div>`).join("")}
    </div>`);
}
MOUNT.parent = (params) => {
  bindAction(APP, "p-sound", (e) => { D.settings.soundEnabled = !D.settings.soundEnabled; soundOn = D.settings.soundEnabled; save(); if (soundOn) sfx("tap"); render("parent"); });
  bindAction(APP, "p-lock", (e) => { D.settings.lockLang = !D.settings.lockLang; save(); render("parent"); });
  bindAction(APP, "p-clear", (e) => {
    if (!confirm(t("confirmClear"))) return;
    D.profiles = {}; D.active = null; save();
    go("who");
  });
  bindAction(APP, "p-export", (e) => {
    const blob = new Blob([JSON.stringify(D, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geo-buddy-backup-" + todayKey() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(t("exportDone") + " ✅");
  });
  bindAction(APP, "p-del", (e, btn) => {
    const id = btn.getAttribute("data-id");
    if (!confirm(t("confirmDelProfile"))) return;
    delete D.profiles[id];
    if (D.active === id) D.active = Object.keys(D.profiles)[0] || null;
    save();
    render("parent");
    toast(t("justDeleted"));
  });
  bindAction(APP, "p-lic-activate", async (e, btn) => {
    const email = (APP.querySelector("#lic-email") || {}).value || "";
    const key = (APP.querySelector("#lic-key") || {}).value || "";
    btn.disabled = true;
    const r = await activateLicence(email, key);
    if (r && r.ok) {
      save();
      render("parent");
      toast(t("licActivated"));
    } else {
      btn.disabled = false;
      const err = r && r.error;
      toast(err === "network" ? t("licErrNetwork") : (err === "no match" ? t("licErrMatch") : t("licErrFields")));
    }
  });
  bindAction(APP, "p-lic-remove", () => {
    clearLicence();
    render("parent");
    toast(t("licRemoved"));
  });
};
function screenAbout() {
  return html(`
    <h2 class="sec-title">ℹ️ ${t("about")}</h2>
    <div class="card">
      <h3>Geo Buddy</h3>
      <p class="official-txt">geobuddy.nifraworld.com · v${GEO.version || ""}</p>
      <p style="font-size:14px;line-height:1.6;margin-top:8px">${t("dataSources")}</p>
      <p class="attr" style="margin-top:12px">${t("made")}</p>
    </div>`);
}

/* ================= boot & global events ================= */
function bindAction(root, action, fn) {
  root.querySelectorAll(`[data-action="${action}"]`).forEach((b) => b.addEventListener("click", (e) => fn(e, b)));
}
document.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) {
    e.preventDefault();
    const where = nav.getAttribute("data-nav");
    if (where === "parent") { go("pin"); return; }
    go(where);
    return;
  }
  const act = e.target.closest("[data-action]");
  if (!act) return;
  const a = act.getAttribute("data-action");
  if (a === "picklang") {
    _lang = act.getAttribute("data-lang");
    D.lang = _lang; save(); toast(t("changedLang") + " ✓"); go("who");
  } else if (a === "pick") {
    D.active = act.getAttribute("data-id"); save(); go("home");
  } else if (a === "newp") {
    newProfile("p" + Date.now().toString(36));
    render("who"); openNameModal();
  } else if (a === "explore-scope") {
    const cur = stack[stack.length - 1].params || {};
    const scope = act.getAttribute("data-scope");
    replace("explore", { ...cur, scope, level: scope === "bd" ? (cur.level || "div") : undefined, region: "all" });
  } else if (a === "explore-level") {
    const cur = stack[stack.length - 1].params || {};
    replace("explore", { ...cur, level: act.getAttribute("data-level"), region: "all" });
  } else if (a === "explore-region") {
    const cur = stack[stack.length - 1].params || {};
    replace("explore", { ...cur, region: act.getAttribute("data-region") });
  } else if (a === "map-kind") {
    const cur = stack[stack.length - 1].params || {};
    const kind = act.getAttribute("data-kind");
    replace("map", { ...cur, kind, level: kind === "bd" ? (cur.level || "div") : undefined });
  } else if (a === "map-level") {
    const cur = stack[stack.length - 1].params || {};
    replace("map", { ...cur, level: act.getAttribute("data-level"), kind: "bd" });
  } else if (a === "explore-fav") {
    const cur = stack[stack.length - 1].params || {};
    replace("explore", { ...cur, fav: !cur.fav });
  } else if (a === "back") {
    back();
  }
});
function openNameModal() {
  const p = profile();
  const dlg = html(`<div class="modal-bg">
    <div class="modal">
      <h3>${t("addName")}</h3>
      <input class="search" id="nm-in" value="" placeholder="…" maxlength="20" style="margin-top:10px">
      <h3 style="margin-top:12px">${t("pickAvatar")}</h3>
      <div class="filter-row" id="av-row">
        ${AVATARS.map((a) => `<button class="fchip" data-av="${a.name}" style="font-size:20px;padding:8px 12px">${a.icon}</button>`).join("")}
      </div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn btn-primary" id="nm-ok">${t("create")}</button>
        <button class="btn btn-paper" data-close="1">${t("cancel")}</button>
      </div>
    </div>
  </div>`).firstElementChild;
  document.body.appendChild(dlg);
  const inp = dlg.querySelector("#nm-in");
  setTimeout(() => inp.focus(), 30);
  dlg.querySelector("#av-row").addEventListener("click", (e) => {
    const b = e.target.closest("[data-av]");
    if (!b) return;
    AVATARS.forEach((x) => { if (x.name === b.getAttribute("data-av")) p.avatar = x; });
    dlg.querySelectorAll("[data-av]").forEach((bb) => bb.classList.toggle("on", bb === b));
  });
  dlg.querySelector("[data-close]").addEventListener("click", () => { dlg.remove(); if (!p.name) { delete D.profiles[p.id]; if (D.active === p.id) D.active = null; save(); render("who"); } });
  dlg.querySelector("#nm-ok").addEventListener("click", () => {
    p.name = inp.value.trim() || "Kid " + Math.floor(Math.random() * 100);
    save();
    dlg.remove();
    go("home");
  });
  dlg.addEventListener("keydown", (e) => { if (e.key === "Enter") dlg.querySelector("#nm-ok").click(); });
  dlg.addEventListener("click", (e) => { if (e.target.classList.contains("modal-bg")) dlg.querySelector("[data-close]").click(); });
}
// lang button in topbar
document.addEventListener("click", (e) => {
  const tb = e.target.closest("[data-tb=lang]");
  if (!tb) return;
  _lang = _lang === "bn" ? "en" : "bn";
  D.lang = _lang; save();
  toast(t("changedLang") + " ✓");
  const cur = stack[stack.length - 1];
  render(cur.name, cur.params || {});
});

/* ================= boot ================= */
function boot() {
  load();
  if (licence().key) refreshLicence(true);
  go("welcome");
  if ("serviceWorker" in navigator && navigator.serviceWorker && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
boot();

// exported only for the build smoke test (scripts/smoke.mjs); harmless in the browser
export const __test = { buildDailyQuestions, buildQuestionList, divQuestions, distQuestions, countryQuestions, fillChoices, shuffle, GEO, D, profile, t, _lang: () => _lang, go, render, back, newProfile, startSession, answerSession, SETUP, APP, boot, isFav: (type, id) => isFav(profile(), type, id), toggleFav: (type, id) => toggleFav(profile(), type, id), getLevel, getXP, BADGES, checkBadges, licence, licenceLabel, hasScope, deviceId, activateLicence, refreshLicence, clearLicence, LICENCE_SCOPES, APP_LOCKED };