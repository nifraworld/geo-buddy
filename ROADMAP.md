# Geo Buddy — Bangladesh & World Geography for Kids

Repository: `D:\GeoBuddy`  ·  Project: Geo Buddy  ·  Status: v1.4 (licence + branding) build

An **offline-first PWA** (HTML/JS/CSS + service worker) that borrows the **structure
and screens of Spelling Buddy** (`spelling.nifraworld.com`) and the **feature ideas of
geopoto** (adaptive training, daily challenge, encyclopedia, map explorer).

## Product one-liner
> Geography practice for Bangladeshi children (and the world), in English and Bangla,
> free, no account, works fully offline.

## Design decisions (agreed)
- **Format:** static PWA, deployed to `geo.nifraworld.com` later.
- **Palette:** Bangladesh-inspired — deep green board, saffron/red-sun accents,
  cream paper cards. *Not* Spelling Buddy's navy/gold.
- **Per-child profiles** on-device with stars, streaks, history (like Spelling Buddy).
- **Parent zone** behind a 4-digit PIN: profiles, progress, settings, backup/export,
  WhatsApp share, About/sources.
- **No licence/activation in v1** — superseded by **V1.4** (prep-for-sale licence).
- **Photos:** Wikimedia Commons URLs only; `<img>` loaded lazily and only when online;
  elegant placeholder offline.
- **Audio:** phone TTS (speechSynthesis) reads place names in English and Bangla.
- **Data accuracy:** bilingual names (official English spellings — Chattogram, Barishal,
  Mymensingh — and standard Bangla), versioned + dated, sources credited in About.

## Content (v1)
- **Bangladesh — 8 divisions:** Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet,
  Rangpur, Mymensingh. Each: HQ, area, population (2022 census), districts count, a fun
  fact, rivers, and a Wikimedia Commons photo (online only).
  - Interactive divisions SVG map (tap to explore / find-on-map quiz).
- **World — ~195 countries:** official UN-member set. Name (EN + native), capital,
  region, ISO code, flag (bundled SVG — works offline).

## Modes (v1)
- Daily Challenge (shared, one per day, streak) — geopoto habit loop.
- Bangladesh quiz: **HQ / capitals**, **find-on-map**, name quiz (spell, EN+BN keyboards).
- World quiz: **flags** (flag→country, country→flag), **capitals**, **find-on-map**.
- Custom sessions: pick world (Bangladesh/world/region), question type, length, infinite.
- Beat-the-Clock: 60 seconds, most correct.
- Adaptive training: missed items reappear more often (`k.stats` like Spelling Buddy).

## Screens
`welcome → who → home → explore (encyclopedia + divisions map) →
[play mode → session → results] → parent zone (profiles/progress/settings/share/about)`

## Tech structure (mirrors Spelling Buddy)
```
geo.nifraworld.com root
├── index.html            # full shell, meta, manifest link (CSS bundled)
├── sw.js                 # offline cache, auto cache-name from build hash
├── manifest.json         # PWA install
├── src/
│   └── engine.js         # the whole app (screens, state, modes, storage)
├── geo-data.js           # GENERATED: divisions, countries, facts, flags
├── geo-flags.js          # GENERATED: flag SVG data-URIs (offline)
├── assets/
│   ├── bd-map.svg + bd-map-data.js              # divisions map + geometry/labels
│   ├── bd-district-map.svg + bd-district-map-data.js  # 64-district map (v1.3)
│   ├── world-map.svg + world-map-data.js # world map (Natural Earth)
│   ├── flags/*.svg                       # 194 bundled flags (offline)
│   ├── icons/icon-{192,512,maskable-512}.png
│   └── fonts/noto-sans-bengali-{400,700}.woff2   # optional, CSS falls back to system
├── test/harness.html   # browser UI test driven by browser-check.mjs (CDP)
└── scripts/
    ├── build.mjs         # orchestrator: fetch→maps→flags→photos→data→icons→sw/manifest
    ├── fetch.mjs, maps.mjs, flags.mjs, photos.mjs, build-data.mjs, icons.mjs
    ├── serve.mjs         # local dev server (http://127.0.0.1:4173)
    ├── smoke.mjs         # Node logic test (question builders, determinism)
    └── browser-check.mjs # headless-Chrome UI smoke test (test/harness.html)
```

## Roadmap
- **Phase 0** Scaffold + data pipeline + generated assets. ✅
- **Phase 1** Engine: welcome/who/home + explore + divisions/world map. ✅
- **Phase 2** Quiz engine: modes, sessions, adaptive tracking, results, stars/streaks. ✅
- **Phase 3** Parent zone + settings + backup + Toasts + haptics. ✅
- **Phase 4** SW offline + manifest + icons (+ optional font bundling). ✅
- **Phase 5** QA: data accuracy pass, offline audit, colour contrast, publish. ✅
- **V1.1** World explorer: favourites, population/neighbours, region-bias questions. ✅
- **V1.2** Sound effects & gamification: WebAudio SFX, badges, XP/levels, parent toggles. ✅
- **V1.3** 64-district level for Bangladesh: district data (2022 census, normalised to
  division totals), district SVG map (dissolved from upazilas), explore districts browse,
  district quiz types (`d-div`, `div-d`, `d-find`), district detail screen, map level toggle. ✅
  - Follow-ups (parked): visual QA of the district map (label density, tint contrast), a
    `districts` count line on the Map tab, audited Bangla district names.
- **V1.4** Pre-sale branding + licence/key system (mirrors Spelling Buddy). ✅
  - `geobuddy.nifraworld.com` + app version shown on welcome, PIN and About
    (v1.4.1: removed from the child-facing top bar so it fits a 360px phone).
  - Server-side key formula (`functions/`, env `LICENCE_SECRET`) + private key generator
    (`admin-tools/`, git-ignored). Keys: `GB-XXXX-XXXX` (bundle) / `GB-BD-`·`GB-WR-`;
    teacher code `TP-XXXX-XXXX`.
  - Pages Functions: `/api/activate`, `/api/licence`, `/api/keys` (gated by `REVIEW_KEY`),
    D1 schema (`plans`, `devices`), `SETUP.md`, `licences.json` manifest.
  - Parent-zone "Licence" card (activate/remove), status shown, offline refresh on launch.
  - App currently runs fully open (`APP_LOCKED = false`); flipping it starts enforcing keys.
  - Remaining (when selling starts): D1 + secrets in Cloudflare (dashboard steps in
    `functions/SETUP.md`), then flip `APP_LOCKED`.
- **V1.4.1** Bug-fix pass from the first end-to-end review. ✅
  - Quiz prompts rendered as raw keys (`qprompts.wf`) since v1: `t()` now resolves
    dotted keys into nested tables; `bd-hq` choices are division names.
  - Top bar overflowed at 390px (brand wrapped under the profile chip).
  - Division map legend used a different palette from the map; one table now.
  - Upstream GeoJSON tags Noakhali's Companiganj as Sylhet, dragging Hatiya &
    Subarnachar with it — `UPAZILA_FIX` in `scripts/maps.mjs` corrects 7 upazilas.
  - `hasScope()` now gates Play/Daily/Clock (no-op while `APP_LOCKED = false`).
  - App version comes from `package.json` (was hard-coded 1.3.0); `npm run build:sw`
    regenerates `sw.js` without re-fetching data.
  - Smoke test asserts prompts/choices are human text, not keys or type ids.
  - Key generator no longer ships the `LICENCE_SECRET` in the file (paste per tab).
- **V1.5** Maps you can actually use on a phone. ✅
  - Pan (drag), pinch, wheel and double-tap zoom on all three maps; +/−/⟲ buttons;
    the view survives redraws so answering never resets it.
  - Labels sized in on-screen px with greedy collision avoidance — more appear as
    you zoom, none overlap (world labels were ~5 CSS px and piled up).
  - Find-on-map (world) opens framed on the answer's region (sub-region for small
    countries) using each country's *mainland* box (France minus French Guiana);
    after answering the view glides to the target and the miss.
  - World viewport padded to 900×640 for a taller map on portrait phones; water tint.
  - 29 countries absent from the 110m map (Singapore, Maldives, Malta…) no longer
    appear as impossible find-on-map questions (`hasMap`).
  - Leaving the quiz screen abandons the session — its timers used to append the
    next question onto whatever screen came next.
  - Follow-ups: label anchor audit (Canada/France anchors sit low), Robinson
    projection, coastline/graticule styling, BD district framing option.

## Sources / attribution
- Country facts: `mledoze/countries` (ODbL) — attribution shown in About.
- Flag artwork: `lipis/flag-icons` (MIT) — flags redrawn from SVG, cached offline.
- Divisions map: public administrative boundary data (GeoJSON) — simplified to SVG.
- Division photos: Wikimedia Commons (CC BY/CC BY-SA) — links + attribution shown.
- Bangla font: Noto Sans Bengali (OFL).