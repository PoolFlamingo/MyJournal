use std::path::PathBuf;
use sqlx::{Pool, Row, Sqlite};
use tauri::{AppHandle, State};
use tauri_plugin_sql::{DbInstances, DbPool};

use crate::db::DB_URL;
use crate::types::{CalendarDayState, EntryDocument, EntrySummary, SaveEntryDto};

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

fn sha256_hex(content: &str) -> String {
    use sha2::Digest;
    use std::fmt::Write;
    let mut hasher = sha2::Sha256::new();
    hasher.update(content.as_bytes());
    let result = hasher.finalize();
    let mut s = String::with_capacity(64);
    for byte in result {
        write!(s, "{byte:02x}").unwrap();
    }
    s
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

fn entry_file_path(storage_path: &str, date: &str) -> PathBuf {
    PathBuf::from(storage_path)
        .join("entries")
        .join(format!("{date}.myj"))
}

fn row_to_summary(row: &sqlx::sqlite::SqliteRow) -> EntrySummary {
    EntrySummary {
        id: row.try_get("id").unwrap_or_default(),
        journal_id: row.try_get("journal_id").unwrap_or_default(),
        date: row.try_get("date").unwrap_or_default(),
        title: row.try_get("title").unwrap_or_default(),
        content_hash: row.try_get("content_hash").unwrap_or_default(),
        created_at: row.try_get("created_at").unwrap_or(0),
        updated_at: row.try_get("updated_at").unwrap_or(0),
    }
}

async fn get_storage_path(pool: &Pool<Sqlite>, journal_id: &str) -> Option<String> {
    sqlx::query("SELECT storage_path FROM journals WHERE id = ?")
        .bind(journal_id)
        .fetch_optional(pool)
        .await
        .ok()?
        .and_then(|r| r.try_get("storage_path").ok())
}

// ── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn entry_get_by_date(
    journal_id: String,
    date: String,
    db_instances: State<'_, DbInstances>,
) -> Result<Option<EntryDocument>, String> {
    let pool = get_pool(&db_instances).await?;

    let row = sqlx::query("SELECT * FROM entries WHERE journal_id = ? AND date = ?")
        .bind(&journal_id)
        .bind(&date)
        .fetch_optional(&pool)
        .await
        .map_err(|e| e.to_string())?;

    let row = match row {
        Some(r) => r,
        None => return Ok(None),
    };

    let storage_path = get_storage_path(&pool, &journal_id)
        .await
        .ok_or("Journal storage path not found")?;

    let file_path = entry_file_path(&storage_path, &date);
    let content = if file_path.exists() {
        std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?
    } else {
        String::new()
    };

    let summary = row_to_summary(&row);
    Ok(Some(EntryDocument {
        id: summary.id,
        journal_id: summary.journal_id,
        date: summary.date,
        title: summary.title,
        content_hash: summary.content_hash,
        created_at: summary.created_at,
        updated_at: summary.updated_at,
        content,
    }))
}

#[tauri::command]
pub async fn entry_save(
    _app: AppHandle,
    data: SaveEntryDto,
    db_instances: State<'_, DbInstances>,
) -> Result<EntrySummary, String> {
    let pool = get_pool(&db_instances).await?;

    let storage_path = get_storage_path(&pool, &data.journal_id)
        .await
        .ok_or("Journal not found")?;

    let file_path = entry_file_path(&storage_path, &data.date);

    if let Some(parent) = file_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::write(&file_path, &data.content).map_err(|e| e.to_string())?;

    let content_hash = sha256_hex(&data.content);
    let now = now_ms();
    let title = data.title.trim().to_string();
    let relative_path = format!("entries/{}.myj", data.date);

    let existing_id: Option<String> = sqlx::query(
        "SELECT id FROM entries WHERE journal_id = ? AND date = ?",
    )
    .bind(&data.journal_id)
    .bind(&data.date)
    .fetch_optional(&pool)
    .await
    .map_err(|e| e.to_string())?
    .and_then(|r| r.try_get("id").ok());

    if let Some(ex_id) = existing_id {
        sqlx::query(
            "UPDATE entries SET title = ?, content_hash = ?, updated_at = ? WHERE id = ?",
        )
        .bind(&title)
        .bind(&content_hash)
        .bind(now)
        .bind(&ex_id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

        let row = sqlx::query("SELECT * FROM entries WHERE id = ?")
            .bind(&ex_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| e.to_string())?;

        return Ok(row_to_summary(&row));
    }

    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO entries (id, journal_id, date, title, file_path, content_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&data.journal_id)
    .bind(&data.date)
    .bind(&title)
    .bind(&relative_path)
    .bind(&content_hash)
    .bind(now)
    .bind(now)
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    let row = sqlx::query("SELECT * FROM entries WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row_to_summary(&row))
}

#[tauri::command]
pub async fn entry_delete(
    journal_id: String,
    date: String,
    db_instances: State<'_, DbInstances>,
) -> Result<(), String> {
    let pool = get_pool(&db_instances).await?;

    let entry_id: String = sqlx::query(
        "SELECT id FROM entries WHERE journal_id = ? AND date = ?",
    )
    .bind(&journal_id)
    .bind(&date)
    .fetch_optional(&pool)
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| format!("Entry not found for date {date}"))?
    .try_get("id")
    .map_err(|e| e.to_string())?;

    let storage_path = get_storage_path(&pool, &journal_id).await;
    if let Some(sp) = storage_path {
        let file_path = entry_file_path(&sp, &date);
        if file_path.exists() {
            std::fs::remove_file(&file_path).map_err(|e| e.to_string())?;
        }
    }

    sqlx::query("DELETE FROM entries WHERE id = ?")
        .bind(&entry_id)
        .execute(&pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn entry_list_month(
    journal_id: String,
    year: i32,
    month: i32,
    db_instances: State<'_, DbInstances>,
) -> Result<Vec<CalendarDayState>, String> {
    let start_date = format!("{year}-{month:02}-01");
    let (next_year, next_month) = if month == 12 { (year + 1, 1) } else { (year, month + 1) };
    let end_date = format!("{next_year}-{next_month:02}-01");

    let pool = get_pool(&db_instances).await?;

    let rows = sqlx::query(
        "SELECT date FROM entries WHERE journal_id = ? AND date >= ? AND date < ?",
    )
    .bind(&journal_id)
    .bind(&start_date)
    .bind(&end_date)
    .fetch_all(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows
        .iter()
        .filter_map(|r| {
            r.try_get::<String, _>("date")
                .ok()
                .map(|d| CalendarDayState { date: d, has_entry: true })
        })
        .collect())
}
