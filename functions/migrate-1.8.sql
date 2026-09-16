-- v1.8 migration for a database created from the v1.4 schema.sql.
-- Adds the customer-record columns to `plans` without dropping anything.
-- Run once in the D1 console. (SQLite has no IF NOT EXISTS for columns:
-- if a statement fails with "duplicate column name", that column is already
-- there — just run the remaining lines.)
ALTER TABLE plans ADD COLUMN phone   TEXT;
ALTER TABLE plans ADD COLUMN paid    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE plans ADD COLUMN amount  TEXT;
ALTER TABLE plans ADD COLUMN pay_via TEXT;
ALTER TABLE plans ADD COLUMN scope   TEXT NOT NULL DEFAULT 'bundle';
ALTER TABLE plans ADD COLUMN created TEXT;
