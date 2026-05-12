use serde::{Deserialize, Serialize};

// ── Journal types ─────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JournalSummary {
    pub id: String,
    pub name: String,
    pub privacy: String,
    pub is_locked: bool,
    pub entry_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct JournalDetails {
    pub id: String,
    pub name: String,
    pub privacy: String,
    pub is_locked: bool,
    pub entry_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub description: Option<String>,
    pub title_required: bool,
    pub storage_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateJournalDto {
    pub name: String,
    pub description: Option<String>,
    pub privacy: String,
    pub password: Option<String>,
    pub title_required: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapResult {
    pub last_journal_id: Option<String>,
    pub journals: Vec<JournalSummary>,
}

// ── Entry types ───────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EntrySummary {
    pub id: String,
    pub journal_id: String,
    pub date: String,
    pub title: String,
    pub content_hash: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EntryDocument {
    pub id: String,
    pub journal_id: String,
    pub date: String,
    pub title: String,
    pub content_hash: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveEntryDto {
    pub journal_id: String,
    pub date: String,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CalendarDayState {
    pub date: String,
    pub has_entry: bool,
}
