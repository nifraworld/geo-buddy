# Licence backend — setup and selling (v1.8)

Geo Buddy's activation keys are checked on the server. The secret that makes
a key (`LICENCE_SECRET`) lives **only** in Cloudflare. Keys are generated on
the server too, from the admin page — nothing secret is in the app, the page
source, or this repo.

Until the steps below are done the app is unaffected: it runs open
(`sale.json` → `locked: false`), and a key typed in goes unactivated
(`/api/activate` answers "server not configured").

## One-time setup (Cloudflare dashboard, ~5 minutes)

1. **Create the database.**
   Storage & Databases → **D1** → **Create database** → name `geobuddy-licence`.
   Open it → **Console** → paste `functions/schema.sql` → **Execute**.
   *(Created the tables already in v1.8? Paste `functions/schema-1.9.sql` — it adds
   the `progress` and `submissions` tables and touches nothing else.)*
   *(Already created it from the v1.4 schema? Paste `functions/migrate-1.8.sql`
   instead — it adds the customer columns without dropping rows.)*
   The SQL files are comment-free on purpose: the D1 console rejects a paste
   that starts with comments ("Requests without any query are not supported").
   What the columns mean: `devices` = one row per (email, device) with
   first/last seen, grace window and owner override; `plans` = the customer
   record — limit, plan name, packages, revoked, plus phone / paid / amount /
   pay_via / scope / created.

2. **Bind it to the site.**
   Workers & Pages → your Pages project → **Settings → Functions → D1 database
   bindings** → **Add**: variable `DB`, database `geobuddy-licence`. Production
   (and Preview if you like).

3. **Two secrets.** Same Settings page → **Variables and Secrets** → Add (type
   **Secret**, Production):
   - `LICENCE_SECRET` — a long random string. Generate a fresh one now
     (e.g. `openssl rand -hex 24`); the value that used to sit in the old
     key-generator HTML has been seen in plaintext and must not be reused.
     Changing it later invalidates every key already sold, so pick once.
   - `REVIEW_KEY` — the admin page password. Long and random too.

4. **Redeploy.** Deployments → latest → **Retry deployment** (bindings and
   secrets only take effect on a fresh deploy).

## Check it worked

- `https://geobuddy.nifraworld.com/api/licence?email=you@example.com&device=test`
  → JSON starting `{"ok":true,…}`. `"pending":true` means the D1 binding or a
  fresh redeploy is missing.
- `https://geobuddy.nifraworld.com/admin` → type `REVIEW_KEY` → "No customers
  yet". "backend not set up yet" = binding missing; "Wrong password" = key mismatch.

## Selling flow

1. **Turn selling on** — edit `sale.json` in the repo root and push:
   ```json
   { "locked": true, "selling": true, "price": "৳ 299",
     "bkash": "017XXXXXXXX", "whatsapp": "017XXXXXXXX", "email": "…" }
   ```
   - `selling: true` shows the **Get the full app** card in the parent zone
     (price, bKash steps, WhatsApp button with a prefilled message that
     includes the device id).
   - `locked: true` makes Play / Daily / Clock / Learn-quiz need an activated
     key. Explore and the maps stay free. Phones pick the change up on their
     next online launch; the last copy is kept so the rule holds offline.
   No rebuild — `sale.json` is fetched fresh and never cached by the service
   worker.

2. **A parent pays** by bKash and messages you (the WhatsApp button prefills
   the message). Open `/admin` → **Make a key** → email, what they bought
   (bundle / Bangladesh / World), plan (3 / 10 / 25 / 50 / ∞ devices),
   WhatsApp number → **Make key**. Copy the key or tap **Send on WhatsApp**.
   Mark them **paid** in the Customers tab.

3. **They activate**: Parent Zone → Licence → email + key → Activate (needs
   one online moment; offline afterwards). The device registers itself.

4. **Later**: Customers tab shows every key, its devices (full / grace / free),
   over-limit warnings, paid state. Change plan or scope from the dropdowns,
   **Revoke** on a refund (the app shows "revoked" on its next online launch),
   per-device **full / free** overrides, **Export** CSV/JSON for your records.

## Teacher / coaching plans

Every email also has a teacher code (`TP-XXXX-XXXX`, shown in the admin
page). Give it with Coaching plans; the parent enters it under Licence →
Teacher code, and the app shows 🎓 Teacher. It is a flag for you to build
classroom features on — it does not change entitlements by itself.

## Endpoints

| Route | Used by | Purpose |
|---|---|---|
| `POST /api/activate` | app | validate email + key, register device, return packages/plan |
| `GET /api/licence` | app (launch) | this device's status, plan, packages, teacher flag |
| `GET/POST /api/keys` | admin page | list customers; make / check / update / revoke / delete |
| `POST/GET /api/progress` | app / teacher / admin | per-pupil progress for class dashboards |
| `POST /api/submit` | app | "Report a mistake" |
| `GET/POST /api/review` | admin page | list / accept / reject submissions |
| `GET /admin` | you | the admin page (password = `REVIEW_KEY`) |

The old private key-generator HTML in `admin-tools/` still works offline as
a fallback if you paste the secret in, but the admin page is the tool now.
