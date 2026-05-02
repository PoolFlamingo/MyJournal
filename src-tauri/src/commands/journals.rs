use std::path::{Path, PathBuf};
use sqlx::{Pool, Row, Sqlite};
use tauri::{AppHandle, Manager, State};
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::db::DB_URL;
use crate::state::UnlockedJournals;
use crate::types::{BootstrapResult, CreateJournalDto, JournalDetails, JournalSummary};

// ── Pool helper ───────────────────────────────────────────────────────────────

async fn get_pool(db_instances: &DbInstances) -> Result<Pool<Sqlite>, String> {
    let instances = db_instances.0.read().await;
    let pool_enum = instances
        .get(DB_URL)
        .ok_or_else(|| "DB not loaded".to_string())?;
    match pool_enum {
        DbPool::Sqlite(pool) => Ok(pool.clone()),
        #[allow(unreachable_patterns)]
        _ => Err("Expected SQLite pool".into()),
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn data_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("could not resolve app data dir")
}

fn journal_storage_path(app: &AppHandle, journal_id: &str) -> PathBuf {
    data_dir(app).join("journals").join(journal_id)
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn uuid_v4() -> String {
    uuid::Uuid::new_v4().to_string()
}

async fn count_entries(pool: &Pool<Sqlite>, journal_id: &str) -> i64 {
    sqlx::query("SELECT COUNT(*) AS cnt FROM entries WHERE journal_id = ?")
        .bind(journal_id)
        .fetch_one(pool)
        .await
        .map(|row| row.try_get::<i64, _>("cnt").unwrap_or(0))
        .unwrap_or(0)
}

async fn row_to_summary(pool: &Pool<Sqlite>, row: &sqlx::sqlite::SqliteRow, unlocked: &UnlockedJournals) -> JournalSummary {
    let id: String = row.try_get("id").unwrap_or_default();
    let privacy: String = row.try_get("privacy").unwrap_or_else(|_| "public".into());
    let is_locked = privacy == "private" && !unlocked.is_unlocked(&id);
    let entry_count = count_entries(pool, &id).await;

    JournalSummary {
        id,
        name: row.try_get("name").unwrap_or_default(),
        privacy,
        is_locked,
        entry_count,
        created_at: row.try_get("created_at").unwrap_or(0),
        updated_at: row.try_get("updated_at").unwrap_or(0),
    }
}

async fn set_last_journal(pool: &Pool<Sqlite>, id: &str) -> Result<(), String> {
    sqlx::query(
        "INSERT INTO app_settings (key, value) VALUES ('lastJournalId', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(id)
    .execute(pool)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

// ── Bootstrap / Settings ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn app_bootstrap(
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<BootstrapResult, String> {
    let pool = get_pool(&db_instances).await?;

    let rows = sqlx::query("SELECT * FROM journals ORDER BY created_at ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut journals = Vec::new();
    for row in &rows {
        journals.push(row_to_summary(&pool, row, &unlocked).await);
    }

    let last_journal_id: Option<String> = sqlx::query(
        "SELECT value FROM app_settings WHERE key = 'lastJournalId'",
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| e.to_string())?
    .and_then(|r| r.try_get("value").ok());

    Ok(BootstrapResult { last_journal_id, journals })
}

#[tauri::command]
pub async fn app_get_setting(
    key: String,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<String>, String> {
    let pool = get_pool(&db_instances).await?;

    Ok(sqlx::query("SELECT value FROM app_settings WHERE key = ?")
        .bind(&key)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
        .and_then(|r| r.try_get("value").ok()))
}

#[tauri::command]
pub async fn app_set_setting(
    key: String,
    value: String,
    db_instances: State<'_, DbInstances>,
) -> Result<(), String> {
    let pool = get_pool(&db_instances).await?;

    sqlx::query(
        "INSERT INTO app_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(&key)
    .bind(&value)
    .execute(&pool)
    .await
    .map(|_| ())
    .map_err(|e| e.to_string())
}

// ── Journal CRUD ──────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn journal_list(
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<Vec<JournalSummary>, String> {
    let pool = get_pool(&db_instances).await?;

    let rows = sqlx::query("SELECT * FROM journals ORDER BY created_at ASC")
        .fetch_all(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for row in &rows {
        result.push(row_to_summary(&pool, row, &unlocked).await);
    }
    Ok(result)
}

#[tauri::command]
pub async fn journal_create(
    app: AppHandle,
    data: CreateJournalDto,
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<JournalSummary, String> {
    if data.name.trim().is_empty() {
        return Err("Journal name is required".into());
    }
    if data.privacy == "private" && data.password.as_deref().map(str::is_empty).unwrap_or(true) {
        return Err("Password is required for private journals".into());
    }

    let id = uuid_v4();
    let storage_path = journal_storage_path(&app, &id);

    std::fs::create_dir_all(storage_path.join("entries")).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(storage_path.join("assets")).map_err(|e| e.to_string())?;

    let storage_path_str = storage_path.to_string_lossy().to_string();
    let password_hash: Option<String> = if data.privacy == "private" { data.password.clone() } else { None };
    let now = now_ms();
    let title_required = data.title_required.unwrap_or(true);
    let description = data.description.clone().unwrap_or_default();

    let pool = get_pool(&db_instances).await?;

    sqlx::query(
        "INSERT INTO journals (id, name, description, privacy, password_hash, wrapped_key, key_salt, title_required, storage_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(data.name.trim())
    .bind(&description)
    .bind(&data.privacy)
    .bind(&password_hash)
    .bind(title_required as i64)
    .bind(&storage_path_str)
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    if data.privacy == "private" {
        unlocked.unlock(&id);
    }

    set_last_journal(&pool, &id).await?;

    let row = sqlx::query("SELECT * FROM journals WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row_to_summary(&pool, &row, &unlocked).await)
}

#[tauri::command]
pub async fn journal_open(
    id: String,
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<JournalDetails, String> {
    let pool = get_pool(&db_instances).await?;

    let row = sqlx::query("SELECT * FROM journals WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Journal not found: {id}"))?;

    let privacy: String = row.try_get("privacy").unwrap_or_else(|_| "public".into());
    if privacy == "private" && !unlocked.is_unlocked(&id) {
        return Err("JOURNAL_LOCKED".into());
    }

    set_last_journal(&pool, &id).await?;

    let summary = row_to_summary(&pool, &row, &unlocked).await;
    Ok(JournalDetails {
        id: summary.id,
        name: summary.name,
        privacy: summary.privacy,
        is_locked: summary.is_locked,
        entry_count: summary.entry_count,
        created_at: summary.created_at,
        updated_at: summary.updated_at,
        description: row.try_get("description").ok(),
        title_required: row.try_get::<i64, _>("title_required").unwrap_or(1) != 0,
        storage_path: row.try_get("storage_path").unwrap_or_default(),
    })
}

#[tauri::command]
pub async fn journal_rename(
    id: String,
    name: String,
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<JournalSummary, String> {
    if name.trim().is_empty() {
        return Err("Journal name is required".into());
    }
    let pool = get_pool(&db_instances).await?;

    sqlx::query("UPDATE journals SET name = ?, updated_at = ? WHERE id = ?")
        .bind(name.trim())
        .bind(now_ms())
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let row = sqlx::query("SELECT * FROM journals WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row_to_summary(&pool, &row, &unlocked).await)
}

#[tauri::command]
pub async fn journal_delete(
    id: String,
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<(), String> {
    let pool = get_pool(&db_instances).await?;

    let storage_path: String = sqlx::query("SELECT storage_path FROM journals WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Journal not found: {id}"))?
        .try_get("storage_path")
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM entries WHERE journal_id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DELETE FROM journals WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    unlocked.lock(&id);

    let p = Path::new(&storage_path);
    if p.exists() {
        std::fs::remove_dir_all(p).map_err(|e| e.to_string())?;
    }

    let _ = sqlx::query(
        "DELETE FROM app_settings WHERE key = 'lastJournalId' AND value = ?",
    )
    .bind(&id)
    .execute(&pool)
    .await;

    Ok(())
}

// ── Unlock / Lock ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn journal_unlock(
    id: String,
    password: String,
    db_instances: State<'_, DbInstances>,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<JournalSummary, String> {
    let pool = get_pool(&db_instances).await?;

    let row = sqlx::query("SELECT * FROM journals WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Journal not found: {id}"))?;

    let privacy: String = row.try_get("privacy").unwrap_or_else(|_| "public".into());
    if privacy != "private" {
        return Err("Journal is not private".into());
    }

    let stored_hash: String = row.try_get("password_hash").unwrap_or_default();
    if stored_hash != password {
        return Err("INVALID_PASSWORD".into());
    }

    unlocked.unlock(&id);
    Ok(row_to_summary(&pool, &row, &unlocked).await)
}

#[tauri::command]
pub async fn journal_lock(
    id: String,
    unlocked: State<'_, UnlockedJournals>,
) -> Result<(), String> {
    unlocked.lock(&id);
    Ok(())
}
