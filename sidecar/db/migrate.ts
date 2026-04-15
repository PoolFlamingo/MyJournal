import { sqlite } from "./index";

/**
 * Ensures the database schema exists by running DDL statements directly.
 *
 * We avoid drizzle-kit's file-based migrator because `bun build --compile`
 * embeds source files into a virtual FS (/$bunfs/...) that cannot be read
 * by Node's fs.readdir at runtime. Instead we inline the DDL here using
 * CREATE TABLE IF NOT EXISTS, which is fully idempotent.
 *
 * To add a new table or column in the future, add another statement below
 * and run `npm run build:sidecar` to recompile.
 */
export function runMigrations(): void {
  try {
    // Wrap all DDL in a single transaction for atomicity
    sqlite.run("BEGIN;");

    // v1 — legacy TODO schema (preserved for migration safety)
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        title       TEXT NOT NULL,
        description TEXT,
        completed   INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL
      );
    `);

    // v2 — journal domain
    sqlite.run(`
      CREATE TABLE IF NOT EXISTS journals (
        id              TEXT PRIMARY KEY NOT NULL,
        name            TEXT NOT NULL,
        description     TEXT,
        privacy         TEXT NOT NULL DEFAULT 'public',
        password_hash   TEXT,
        wrapped_key     TEXT,
        key_salt        TEXT,
        title_required  INTEGER NOT NULL DEFAULT 1,
        storage_path    TEXT NOT NULL,
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL
      );
    `);

    // v2.1 — add title_required to existing journals tables missing the column
    try {
      sqlite.run(`ALTER TABLE journals ADD COLUMN title_required INTEGER NOT NULL DEFAULT 1;`);
    } catch {
      // Column already exists — ignore
    }

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id            TEXT PRIMARY KEY NOT NULL,
        journal_id    TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
        date          TEXT NOT NULL,
        title         TEXT NOT NULL,
        file_path     TEXT NOT NULL,
        content_hash  TEXT NOT NULL,
        created_at    INTEGER NOT NULL,
        updated_at    INTEGER NOT NULL
      );
    `);

    sqlite.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_journal_date
        ON entries(journal_id, date);
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id          TEXT PRIMARY KEY NOT NULL,
        journal_id  TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
        name        TEXT NOT NULL
      );
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS entry_tags (
        entry_id  TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
        tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (entry_id, tag_id)
      );
    `);

    sqlite.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key    TEXT PRIMARY KEY NOT NULL,
        value  TEXT NOT NULL
      );
    `);

    sqlite.run("COMMIT;");
    console.error("[sidecar] Schema ready.");
  } catch (error) {
    sqlite.run("ROLLBACK;");
    console.error("[sidecar] Migration error:", error);
    throw error;
  }
}
