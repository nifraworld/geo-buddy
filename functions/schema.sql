-- D1 schema for Geo Buddy's licence backend.
-- Safe to re-run in the D1 console. Telemetry tables (`devices`, `plans`)
-- are dropped and rebuilt — they hold nothing that can't be rebuilt: every
-- app re-registers its device and entitlement on the next online launch.

-- ============ one row per (licence email, device) ============
DROP TABLE IF EXISTS devices;
CREATE TABLE devices (
  email       TEXT NOT NULL,
  device      TEXT NOT NULL,
  first_seen  TEXT NOT NULL,          -- when this device first activated the key
  last_seen   TEXT NOT NULL,
  child_n     INTEGER NOT NULL DEFAULT 0,
  app_version TEXT,
  grace_until TEXT,                   -- set once, when the device first goes over the plan
  override    TEXT,                   -- NULL | 'full' | 'free'  (owner's manual call)
  PRIMARY KEY (email, device)
);

-- ============ the plan for each key ============
DROP TABLE IF EXISTS plans;
CREATE TABLE plans (
  email        TEXT PRIMARY KEY,
  device_limit INTEGER NOT NULL DEFAULT 3,
  plan         TEXT NOT NULL DEFAULT 'Home',
  grace_days   INTEGER NOT NULL DEFAULT 30,
  packages     TEXT NOT NULL DEFAULT '[]',   -- JSON array: ["bd","wr","bundle"]
  revoked      INTEGER NOT NULL DEFAULT 0,
  note         TEXT,
  updated      TEXT
);