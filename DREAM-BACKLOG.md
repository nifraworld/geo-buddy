# Geo Buddy — Dream Backlog (master list)

Started 18 September 2026 at v2.0.2 (selling on, app unlocked). Modelled on
`D:\Boithok Ghor\01-Main-Project\notes\DREAM-BACKLOG.md`.

**How to use this file:** add new dreams under the right section as one-liners.
Nothing here is scheduled. When we pick a release, we lift items out of here into
`ROADMAP.md` as a versioned entry. Status tags: `[done]` shipped · `[partial]` some of
it shipped · `[in-progress]` being built now · `[blocked]` waiting on something
(usually an owner decision or a data licence) · `[idea]` not started.

Working rules (same as Boithok Ghor): one bounded release at a time; smoke +
browser-check once at the release gate; the owner is asked only for product choices,
money, and real-phone acceptance. Anything that changes what a child sees on a
locked/paid phone is confirmed first.

---

## 0. Where we are (so the dreams have a baseline)

| Asset | Today | Gap |
|---|---|---|
| **Flags** | 194 UN-member SVGs from `lipis/flag-icons` (MIT), bundled, 1.6 MB | No territories/observers (Palestine, Vatican, Taiwan, Kosovo, Hong Kong…); no sub-national flags; artwork is the simplified flag-icons redraw |
| **World map** | Natural Earth **1:110m**, equirectangular, 112 KB | 29 countries are too small to exist on it (Singapore, Maldives, Malta, Bahrain, Mauritius…) so they can never be tapped or asked in find-on-map; no rivers, oceans, continent labels, relief |
| **Bangladesh maps** | 8 divisions + 64 districts, dissolved from an upazila GeoJSON | No upazila level, no rivers (Padma/Jamuna/Meghna are the most asked thing in BD geography), no neighbouring India/Myanmar context, visual QA never done |
| **Photos** | 8 division photos from Wikimedia Commons, **online only** | 0 country photos, 0 district photos, 0 landmark photos; nothing offline |
| **Facts** | `mledoze/countries` (capital, region, area, population, borders, landlocked) + curated BD data (BBS 2022) | No native names, currencies, languages, landmarks, rivers, mountains, national animals/flowers, time zones, UNESCO sites |
| **Audio** | Phone TTS (speechSynthesis) | Bangla TTS is missing or robotic on many Android phones; no fallback |
| **Bangla text** | Curated names for all countries, divisions, districts; UI fully bilingual | Facts (`fact`, `factBn`) exist only for the 8 divisions |

---

## 1. Content sourcing (the big one — "maps and flags don't seem enough")

Every option below is free to use commercially and works offline once bundled.
**★ = recommended.** Sizes are after our normal simplify/compress step.

### 1.1 Flags

- `[done]` v2.1 ★ **Upgrade to full flag-icons set (≈ 260 flags)** — same library, same
  licence, adds territories + observers (Palestine, Vatican, Taiwan, Kosovo, Puerto
  Rico, Greenland, Hong Kong, Macau…). Needs a `status` field (UN member /
  observer / territory) so quizzes can stay "UN members only" by default and a
  parent toggle can widen it. +0.5 MB.
- `[idea]` **Wikimedia Commons SVG flags** (public domain / CC0) as the *authoritative*
  artwork where flag-icons simplifies badly (Bhutan, Sri Lanka, Mexico, Saudi Arabia,
  Iran — emblem detail). Pull only those 15–20; keep flag-icons for the rest.
- `[idea]` **Bangladesh division / district emblems** — there are no official division
  flags; districts have Zila Parishad seals (Wikimedia, mixed licences → check each).
  Alternative: our own colour swatch + a "landmark icon" per district (see 1.4).
- `[idea]` **Historical flags mini-deck** (Bangladesh 1971 flag with the map, East
  Pakistan, British India) — Wikimedia, PD. Small, high emotional value for BD parents.
- `[idea]` **"Flag anatomy"** — one flag decomposed into parts (colours, symbols,
  meaning) using the description text from Wikidata/Wikipedia (CC BY-SA — paraphrase,
  credit in About). Start with Bangladesh, then neighbours.

### 1.2 World map

- `[done]` v2.1 ★ **Natural Earth 1:50m instead of 1:110m** (public domain). Brings in almost
  all of the 29 missing countries (Singapore, Bahrain, Malta, Mauritius, Barbados…);
  Maldives/Tuvalu/Nauru remain dots → draw them as **tap-able circles with a label
  leader line** (the way school atlases do). Simplified with mapshaper to ≈ 450 KB.
  Keep 110m as the *quiz* base if 50m feels heavy on 360-px phones.
- `[done]` v2.1 (Equal Earth) **Robinson (or Equal Earth) projection** — the "atlas look"; Greenland stops
  being the size of Africa. d3-geo has both; only `maps.mjs` changes. (Parked since
  v1.4.1.)
- `[partial]` v2.1 (labels + graticule; no ocean polygons) **Oceans, continents and graticule layer** — Natural Earth `ocean`,
  `geographic_lines`, plus our own continent labels. Enables "Which continent?" and
  "Which ocean?" questions (see 3).
- `[done]` v2.1 **Rivers & lakes layer** — Natural Earth `rivers_lake_centerlines` (PD) at
  50m: Nile, Amazon, Ganges/Padma, Brahmaputra/Jamuna, Yangtze… ≈ 120 KB.
- `[idea]` **Mountains & deserts** as labelled points — Natural Earth
  `geography_regions_points` (PD) or a curated 60-item list from Wikidata.
- `[idea]` **Shaded relief background** — Natural Earth raster (PD), 1 tile at
  1800×900 WebP ≈ 350 KB; toggle in Map Explorer. Pretty, optional.
- `[done]` v2.1 **Country silhouettes** — free: derived from the map data we already have.
  Powers a "Guess the country from its shape" mode (3).
- `[done]` v2.1 (Natural Earth de-facto borders, stated in About) **Disputed borders policy** — Kashmir, Taiwan, Western Sahara, Crimea.
  Natural Earth ships "de facto" borders. Decide once, write the rule into About.
  *Owner decision.*

### 1.3 Bangladesh maps

- `[done]` v2.1 ★ **Rivers of Bangladesh** — from the same upazila-era HydroSHEDS/OSM
  extract or Natural Earth 10m rivers clipped to BD (PD). Padma, Jamuna, Meghna,
  Karnaphuli, Surma, Teesta, Brahmaputra. Adds "Which river?" questions and finally
  explains *why* the divisions look the way they do.
- `[idea]` **Neighbour context** — India (West Bengal, Assam, Meghalaya, Tripura,
  Mizoram) and Myanmar (Rakhine) greyed around Bangladesh, plus the Bay of Bengal
  label. Natural Earth 10m `admin_1_states_provinces` (PD).
- `[idea]` **Upazila level (495)** — we already have the GeoJSON in `.cache`. Too many
  for a quiz; useful as *Explore* only ("Tap your upazila"). Parent toggle.
- `[partial]` v2.1 label clamp; phone check pending **District map visual QA** — label density, tint contrast, the 64-district
  framing option (parked since v1.3). Needs a phone in hand; owner walks through with
  screenshots.
- `[idea]` **Landmark pins on the BD map** — Sundarbans, Cox's Bazar beach, Sixty Dome
  Mosque, Paharpur, Lalbagh, Kantajew, Sajek, Saint Martin's. Wikidata coordinates (CC0).

### 1.4 Photos

- `[done]` v2.1 (188/194) ★ **One photo per country + one per capital via Wikidata P18** (the "image"
  property, all Commons-hosted, CC BY / CC BY-SA / PD). Extend `scripts/photos.mjs`:
  query Wikidata → resolve Commons thumbnail → save licence + author for About.
  ≈ 400 photos, automated, one afternoon of run time + a manual glance for
  duds (P18 is occasionally a coat of arms or a map).
- `[done]` v2.1 (64/64) ★ **One photo per district (64) via Wikidata P18 / Commons category**, with a
  fallback list we curate by hand (we did this for the 8 divisions already).
- `[done]` v2.2 (400 px, 4.0 MB, optional download) **Bundle low-res copies for offline** — 320 px WebP at quality 70 ≈ 12–18 KB
  each; 480 photos ≈ 7 MB. Today photos are online-only by design; a bundled tier
  keeps the app fully offline as promised. Ship as an *optional* "Download pictures"
  button in Parent Zone so the first install stays small.
- `[idea]` **Landmark deck** — 100 world landmarks (Eiffel, Taj Mahal, Petra, Sydney
  Opera House…) from Wikidata "instance of: tourist attraction" + our curation. Photos
  via P18. Powers "Where is this?" mode (3).
- `[idea]` **Sky / weather / food photos per country** — Commons categories. Lower
  priority, high delight.
- `[done]` policy set v2.1: places only **Real children/people in photos** — avoid; use landscapes and buildings
  only. *Policy.*

### 1.5 Facts and text

- `[idea]` ★ **Wikidata for structured facts** (CC0): native name (P1705), currency
  (P38), official languages (P37), time zone, highest point, longest river, national
  animal/flower/bird (P1830-ish "national symbol"), calling code, driving side, UNESCO
  sites count. One SPARQL run in `build-data.mjs`; no licence text needed.
- `[done]` (was already in data; shown on detail) **Native country names** — the v1 spec promised "EN + native"; never landed.
  Wikidata P1705 (official name) or mledoze `name.native`.
- `[idea]` **Fun facts, world** — write our own 1–2 sentence facts in EN + BN (as we did
  for divisions). Source of truth: Wikipedia / CIA World Factbook (PD) — paraphrased,
  never copied. Roughly 194 × 2 languages; do it in batches of 25 per release.
- `[idea]` **District facts EN + BN** — 64 entries (founded, famous for, river, food).
  Banglapedia is copyrighted → read, then write in our own words.
- `[idea]` **Bangla name audit, world** — the 194 country names were curated in v1;
  re-check against bn.wikipedia titles the way we did districts in v2.0.1.
- `[idea]` **UNESCO World Heritage list** (open data, CC BY-SA 3.0 IGO) — Sundarbans,
  Bagerhat, Paharpur for BD; 1,200 world sites → pick the 100 most famous.

### 1.6 Audio

- `[blocked]` v2.2 pipeline + playback done; needs `GOOGLE_TTS_KEY` from the owner to make the clips ★ **Pre-recorded Bangla name audio** — Bangla TTS is unreliable on cheap
  Android phones (the main market). Options: (a) Google Cloud TTS `bn-IN` WaveNet,
  ≈ 270 clips × ~1.5 s ≈ 1.5 MB as Opus/OGG — allowed for commercial use; (b) a
  native speaker recording (better warmth, one weekend). Fall back to TTS when a clip
  is missing.
- `[idea]` **English name audio** the same way (optional; English TTS is fine).
- `[idea]` **Anthem snippets** — *no*: most anthem recordings are copyrighted even when
  the composition is PD. Keep out.
- `[idea]` **Ambient sound per region** (waves, jungle, city) — freesound.org CC0 only.
  Delight, low priority.

### 1.7 Sourcing decision table (owner picks, then we build)

| Need | Source | Licence | Offline size | Effort | Rec. |
|---|---|---|---|---|---|
| Missing small countries on map | Natural Earth 50m | PD | +350 KB | 1 day | ★ |
| Atlas look | Robinson via d3-geo | MIT | 0 | ½ day | ★ |
| Rivers (world + BD) | Natural Earth rivers, PD | PD | +150 KB | 1 day | ★ |
| More flags | flag-icons full set | MIT | +0.5 MB | ½ day | ★ |
| Country/capital/district photos | Wikidata P18 → Commons | CC BY / SA / PD | online 0 · bundled ≈ 7 MB (optional) | 2 days | ★ |
| Structured facts | Wikidata SPARQL | CC0 | +60 KB | 1 day | ★ (v2.1 used the existing dataset instead — currency/languages/dial/demonym/tld; symbols & highest point still open) |
| Fun facts EN+BN | our own writing | ours | +80 KB | batches | ★ |
| Bangla audio | Google Cloud TTS or voice actor | ok | +1.5 MB | 1–2 days | ★ |
| Landmarks deck | Wikidata + Commons | CC BY / SA | +1.5 MB | 3 days | later |
| Shaded relief | Natural Earth raster | PD | +350 KB | ½ day | later |
| Upazilas | existing GeoJSON | open | +200 KB | 1 day | later |

---

## 2. Content depth (what the new sources unlock)

- `[idea]` **Continents & oceans** as first-class entities: 7 continents, 5 oceans, with
  their own explore pages and a "start here" deck for the youngest children.
- `[idea]` **Rivers, mountains, deserts** entities with map pins and questions.
- `[idea]` **Capitals photos** in the country detail (from 1.4).
- `[done]` v2.1 **Currency & language** lines in country detail (from 1.5).
- `[idea]` **National symbols** deck — animal, bird, flower, tree, fruit, sport for
  Bangladesh (Royal Bengal tiger, doel/magpie robin, shapla, mango tree, jackfruit,
  kabaddi) then neighbours, then the world.
- `[idea]` **Bangladesh landmarks deck** (from 1.3) and **world landmarks deck** (1.4).
- `[idea]` **Upazila explore** under each district (from 1.3).
- `[idea]` **"Then and now" names** — Dacca→Dhaka, Chittagong→Chattogram,
  Bombay→Mumbai, Burma→Myanmar, Ceylon→Sri Lanka. Small deck, big classroom value.
- `[idea]` **Country size & population comparisons in child terms** ("Bangladesh fits
  into India 22 times") — computed from data we already have.

## 3. Modes and questions

- `[done]` v2.1 ★ **Silhouette quiz** ("Which country is this shape?") — zero new data.
- `[idea]` ★ **Where is this photo?** — landmark/capital photo → tap the country on the
  map, or 4 choices. Needs 1.4.
- `[partial]` v2.1 (continent yes, ocean no) **Which continent / which ocean borders it?** — needs 1.2 ocean layer.
- `[idea]` **Which river flows through?** — needs rivers.
- `[idea]` **Sort by size / population** (drag 4 countries into order) — new interaction.
- `[idea]` **Capital ↔ country match** (pairs grid, 6 pairs) — new interaction.
- `[idea]` **Speed round on the map** — 60 s, one continent, tap as many as you can.
- `[idea]` **Journey → world stages** — today Journey covers BD + 5 regions; extend with
  continent stages, landmark stages and a final "Around the world" boss with mixed
  types. Gold ring already exists.
- `[idea]` **Boss levels & review stops** every 5 journey nodes (mixed retest, no
  hints).
- `[idea]` **Two-player pass-the-phone** — siblings alternate questions, split score.
- `[idea]` **Weekly challenge** (server-side seed via `sale.json`-style file; leaderboard
  by first name + division only). Needs a privacy line in About.
- `[idea]` **Printable worksheets** — export a deck as an A4 PDF (blank map to label,
  flag-matching sheet). Fun Sheets already has the print pipeline → borrow it.
- `[idea]` **Teacher assignments** — with the teacher code, a teacher picks a deck +
  due date; pupils see "Assigned" on Home. Uses the existing `/api/progress`.

## 4. Engagement, mascot and motion

- `[idea]` **Bagha animation set** — Rive or Lottie: idle, cheer, sad, sleep, point-at-
  map. Today: SVG moods + CSS bob only.
- `[partial]` v2.2 (tap Bagha → hop + tip read aloud; real voice once the audio pack exists) **Bagha talks** — short spoken lines (the pre-recorded audio pipeline from 1.6)
  on level-up, streak, first launch.
- `[idea]` **Streak freeze** (one per week, earned by a perfect daily).
- `[idea]` **Avatar shop** — spend XP on hats/backgrounds for the profile avatar. Purely
  cosmetic; no real money.
- `[idea]` **Seasonal events** — 16 December / 26 March Bangladesh decks, Eid greeting,
  Pohela Boishakh theme. Driven by date, no build.
- `[idea]` **Daily challenge notification** — needs push (5).
- `[idea]` **Parent weekly summary** — WhatsApp share of the child's week (exists as
  "share"; make it automatic on Sunday when the app opens).
- `[idea]` **Sound design pass** — current WebAudio SFX are fine; a soft "map unlock"
  and "star" jingle would land the Journey better.

## 5. Platform and operations

- `[idea]` **Play Store wrapper (TWA)** — Spelling Buddy already did this
  (`05-Google-Play-Package`); copy the recipe. Requires the privacy page (below).
- `[idea]` **Push notifications** for the daily challenge — Cloudflare Worker + Web
  Push; opt-in in Parent Zone. Same pattern as Boithok Ghor Pack 5A when that lands.
- `[idea]` **Cloud backup of progress** — we already POST progress for class dashboards;
  add "Restore on a new phone" using the licence email. Needs a delete-my-data button.
- `[idea]` **Privacy notice page** — required before Play Store; short, honest: no
  account, progress stored on device, optional school sharing, no ads, no trackers.
- `[idea]` **iOS polish** — add-to-home-screen prompt, safe areas (done in v2.0), TTS
  voice selection on Safari.
- `[done]` v2.2 **Optional asset packs** — "Download pictures (7 MB)" / "Download Bangla
  voice (1.5 MB)" in Parent Zone so the base install stays ≈ 3 MB.
- `[idea]` **Lighthouse / a11y pass** — contrast on dark theme, focus order, reduced
  motion (partly done), large-text wrapping at 360 px.
- `[idea]` **Release hygiene** — git tags per version, a CHANGELOG.md generated from
  ROADMAP entries.

## 6. Business and selling

- `[partial]` **Selling flow** — `selling: true`, WhatsApp-first card live (v2.0.2).
  Remaining: `locked: true` when the free period ends. *Owner decision.*
- `[idea]` **Bangladesh-only / World-only prices** — the key system already supports
  scopes (`GB-BD-`, `GB-WR-`); `sale.json` only shows one price. Add `priceBD`,
  `priceWR`.
- `[idea]` **School / coaching bundles** — 25 and 50-device plans exist in the admin
  page; a one-page PDF price sheet for schools (Fun Sheets has the template).
- `[idea]` **Cross-promo card** — "Also from Nifra: Spelling Buddy, Fun Sheets" in
  Parent Zone (and the reverse in those apps).
- `[idea]` **Referral key** — a parent's WhatsApp share includes a code; 2 referrals =
  1 extra device. Needs admin support; small.
- `[idea]` **bKash payment link** — bKash merchant API only if volume justifies it;
  otherwise stay manual (decided in v1.8).

## 7. Deferred / decided against

- Anthem audio (copyright). Real people in photos (policy). Ads of any kind.
- Accounts / passwords for children. Public leaderboards with surnames.
- Live map tiles (OpenStreetMap) — breaks the offline promise; bundled vectors only.

---

## First lift: **V2.1 "Better atlas"** — shipped 18 September 2026 (see ROADMAP)

1. Natural Earth 50m + Robinson + oceans/continent labels + rivers (1.2, 1.3).
2. Full flag-icons set with `status` field, UN-members default (1.1).
3. Wikidata structured facts incl. native names (1.5) — fills the v1 promise.
4. Wikidata P18 photos for countries, capitals, districts — online first (1.4).
5. Silhouette quiz + "Which continent?" (3) — free wins from the new data.
6. District map visual QA with the owner on a phone (1.3).

**V2.2 "Bagha speaks"** shipped 18 September 2026 (picture pack live; voice pack waits on a
Google TTS key). Next: **V2.3 "Landmarks"**: landmark deck + "Where is this photo?".
