# Licence backend — one-time setup (about 5 minutes)

Geo Buddy's activation keys are checked here, on the server. The secret
that makes a key is **never** in the app or the page source — it lives only
in Cloudflare (this backend) and in the private key generator in your own
`admin-tools` folder. Keys can't be worked out from the shipped files, and
the same email always produces the same key.

Until the steps below are done the app is unaffected: it runs open, and a
key entered goes unactivated (`/api/activate` answers "server not
configured"), which is fine because nothing is sold yet.

## Steps (all in the Cloudflare dashboard)

1. **Create the database.**
   Cloudflare dashboard → **Storage & Databases → D1** → **Create database**.
   Name it `geobuddy-licence`. Open it → **Console** tab → paste the contents
   of `functions/schema.sql` → **Execute**.

2. **Bind it to the site.**
   Workers & Pages → your Pages project (`geo-buddy-21y`) → **Settings →
   Functions → D1 database bindings** → **Add binding**.
   Variable name: `DB` · Database: `geobuddy-licence`.
   Do this for **Production** (and Preview if you want).

3. **Set two environment variables.**
   Same Settings page → **Variables and Secrets** → **Add** (do this twice):

   - Name `REVIEW_KEY` · Value: a long random string you choose (the admin
     page's password). Type **Secret**. Add to **Production**.
   - Name `LICENCE_SECRET` · Value: the secret value from your private
     **KEY-GENERATOR** tool (`admin-tools/KEY-GENERATOR.html` — it sits at
     the top of the file). It must be **exactly** the same string, or keys
     stop validating. Type **Secret**. Add to **Production**.

4. **Redeploy.**
   Deployments → the latest → **Retry deployment** (or just push any change).
   Bindings only take effect on a fresh deploy.

## Check it worked

1. Open `https://geobuddy.nifraworld.com/api/licence?email=you@example.com&device=test`
   in a browser. You should see a JSON answer starting `{"ok":true,...}`.
   `"pending":true` means the D1 binding or a fresh redeploy is missing.
2. Open `https://geobuddy.nifraworld.com/api/keys?key=YOUR_REVIEW_KEY` — you
   should see `{"ok":true,"keys":[]}`. `"backend not set up yet"` means the
   binding is missing; `"unauthorized"` means the key doesn't match.

## Selling flow (later)

- Make a buyer's key with your private `KEY-GENERATOR.html` (same email
  always gives the same key), message it to them, mark them paid there.
- When they type email + key into the app's parent zone, `/api/activate`
  validates it and registers that device. `/api/licence` on launch reports
  the device's status and plan.
- Update their plan/limit from the admin tool (it writes straight to this
  DB through `/api/keys`), or `licences.json` for a public snapshot.