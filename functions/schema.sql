DROP TABLE IF EXISTS devices;
CREATE TABLE devices (
  email       TEXT NOT NULL,
  device      TEXT NOT NULL,
  first_seen  TEXT NOT NULL,
  last_seen   TEXT NOT NULL,
  child_n     INTEGER NOT NULL DEFAULT 0,
  app_version TEXT,
  grace_until TEXT,
  override    TEXT,
  PRIMARY KEY (email, device)
);
DROP TABLE IF EXISTS plans;
CREATE TABLE plans (
  email        TEXT PRIMARY KEY,
  device_limit INTEGER NOT NULL DEFAULT 3,
  plan         TEXT NOT NULL DEFAULT 'Home',
  grace_days   INTEGER NOT NULL DEFAULT 30,
  packages     TEXT NOT NULL DEFAULT '[]',
  revoked      INTEGER NOT NULL DEFAULT 0,
  note         TEXT,
  updated      TEXT,
  phone        TEXT,
  paid         INTEGER NOT NULL DEFAULT 0,
  amount       TEXT,
  pay_via      TEXT,
  scope        TEXT NOT NULL DEFAULT 'bundle',
  created      TEXT
);
