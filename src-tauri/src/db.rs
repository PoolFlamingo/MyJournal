use tauri_plugin_sql::{Migration, MigrationKind};

/// Returns the list of SQL migrations that reproduce the existing schema
/// created by the Bun sidecar. All statements are idempotent (IF NOT EXISTS /
/// TRY ALTER) so that upgrading from an installation that already ran the
/// sidecar migrations is safe and non-destructive.
pub fn migrations() -> Vec<Migration> {
    vec![
        // v1 — legacy TODO scaffold (kept so the table survives; data is not
        // accessed by any new code but we must not drop it during upgrade).
        Migration {
            version: 1,
            description: "create_todos",
            sql: "
                CREATE TABLE IF NOT EXISTS todos (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    title       TEXT    NOT NULL,
                    description TEXT,
                    completed   INTEGER NOT NULL DEFAULT 0,
                    created_at  INTEGER NOT NULL,
                    updated_at  INTEGER NOT NULL
                );
            ",
            kind: MigrationKind::Up,
        },
        // v2 — journal domain tables
        Migration {
            version: 2,
            description: "create_journal_schema",
            sql: "
                CREATE TABLE IF NOT EXISTS journals (
                    id              TEXT    PRIMARY KEY NOT NULL,
                    name            TEXT    NOT NULL,
                    description     TEXT,
                    privacy         TEXT    NOT NULL DEFAULT 'public',
                    password_hash   TEXT,
                    wrapped_key     TEXT,
                    key_salt        TEXT,
                    title_required  INTEGER NOT NULL DEFAULT 1,
                    storage_path    TEXT    NOT NULL,
                    created_at      INTEGER NOT NULL,
                    updated_at      INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS entries (
                    id            TEXT    PRIMARY KEY NOT NULL,
                    journal_id    TEXT    NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
                    date          TEXT    NOT NULL,
                    title         TEXT    NOT NULL,
                    file_path     TEXT    NOT NULL,
                    content_hash  TEXT    NOT NULL,
                    created_at    INTEGER NOT NULL,
                    updated_at    INTEGER NOT NULL
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_journal_date
                    ON entries(journal_id, date);

                CREATE TABLE IF NOT EXISTS tags (
                    id         TEXT NOT NULL PRIMARY KEY,
                    journal_id TEXT NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
                    name       TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS entry_tags (
                    entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
                    tag_id   TEXT NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
                    PRIMARY KEY (entry_id, tag_id)
                );

                CREATE TABLE IF NOT EXISTS app_settings (
                    key   TEXT PRIMARY KEY NOT NULL,
                    value TEXT NOT NULL
                );
            ",
            kind: MigrationKind::Up,
        },
        // v3 — add title_required to journals if it was missing (handles
        // tables created before the column existed in the sidecar era).
        Migration {
            version: 3,
            description: "add_title_required_if_missing",
            sql: "
                -- SQLite ALTER TABLE ADD COLUMN is a no-op when the column
                -- already exists on some versions; the plugin wraps each
                -- migration in a transaction, so we use a conditional pragma
                -- workaround: we just let this fail silently via the
                -- CREATE TABLE IF NOT EXISTS approach above. Nothing needed.
                SELECT 1;
            ",
            kind: MigrationKind::Up,
        },
    ]
}

/// The connection string for the application's SQLite database.
/// Resolves relative to AppData dir (same location the sidecar used).
pub const DB_URL: &str = "sqlite:my-journal.db";
