//! Custom font management. Users can upload font files (ttf/otf/woff/woff2);
//! the original family name is detected from the font's `name` table and the
//! file is stored under `<appDataDir>/fonts/`. The directory is the single
//! source of truth — listing re-derives the family from each file.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomFont {
	/// Stored file name (e.g. `"<uuid>.ttf"`), used as the stable id.
	pub id: String,
	/// Family name detected from the font (falls back to the file stem).
	pub family: String,
	/// Lowercased file extension: ttf | otf | woff | woff2 | ttc.
	pub format: String,
}

fn fonts_dir(app: &AppHandle) -> Result<PathBuf, String> {
	let dir = app
		.path()
		.app_data_dir()
		.map_err(|e| e.to_string())?
		.join("fonts");
	fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
	Ok(dir)
}

fn ext_of(file_name: &str) -> String {
	Path::new(file_name)
		.extension()
		.and_then(|e| e.to_str())
		.unwrap_or("ttf")
		.to_lowercase()
}

fn stem_of(file_name: &str) -> String {
	Path::new(file_name)
		.file_stem()
		.and_then(|e| e.to_str())
		.map(|s| s.replace(['_', '-'], " ").trim().to_string())
		.filter(|s| !s.is_empty())
		.unwrap_or_else(|| "Custom Font".to_string())
}

fn is_supported_ext(ext: &str) -> bool {
	matches!(ext, "ttf" | "otf" | "woff" | "woff2" | "ttc")
}

/// Read the typographic family (id 16), then family (1), then full name (4)
/// from the font's `name` table. Handles ttf/otf/woff/woff2 transparently.
fn detect_family(bytes: &[u8]) -> Option<String> {
	use allsorts::binary::read::ReadScope;
	use allsorts::font_data::FontData;
	use allsorts::tables::FontTableProvider;
	use allsorts::tag;

	let scope = ReadScope::new(bytes);
	let font_file = scope.read::<FontData<'_>>().ok()?;
	let provider = font_file.table_provider(0).ok()?;
	let name_data = provider.read_table_data(tag::NAME).ok()?;

	for name_id in [16u16, 1u16, 4u16] {
		if let Ok(Some(name)) = allsorts::get_name::fontcode_get_name(name_data.as_ref(), name_id) {
			let s = name.to_string_lossy().trim().to_string();
			if !s.is_empty() {
				return Some(s);
			}
		}
	}
	None
}

/// Reject ids that could escape the fonts directory (path traversal).
fn safe_join(dir: &Path, id: &str) -> Result<PathBuf, String> {
	if id.is_empty() || id.contains('/') || id.contains('\\') || id.contains("..") {
		return Err("invalid font id".to_string());
	}
	Ok(dir.join(id))
}

/// Store an uploaded font and return its detected metadata.
#[tauri::command]
pub async fn font_register(
	app: AppHandle,
	file_name: String,
	bytes: Vec<u8>,
) -> Result<CustomFont, String> {
	let ext = ext_of(&file_name);
	if !is_supported_ext(&ext) {
		return Err(format!("unsupported font format: .{ext}"));
	}
	let family = detect_family(&bytes).unwrap_or_else(|| stem_of(&file_name));
	let dir = fonts_dir(&app)?;
	let id = format!("{}.{}", uuid::Uuid::new_v4(), ext);
	fs::write(dir.join(&id), &bytes).map_err(|e| e.to_string())?;
	Ok(CustomFont { id, family, format: ext })
}

/// List every stored custom font, re-detecting the family from each file.
#[tauri::command]
pub async fn font_list(app: AppHandle) -> Result<Vec<CustomFont>, String> {
	let dir = fonts_dir(&app)?;
	let mut out: Vec<CustomFont> = Vec::new();
	for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
		let entry = entry.map_err(|e| e.to_string())?;
		let path = entry.path();
		if !path.is_file() {
			continue;
		}
		let file_name = match path.file_name().and_then(|n| n.to_str()) {
			Some(n) => n.to_string(),
			None => continue,
		};
		let ext = ext_of(&file_name);
		if !is_supported_ext(&ext) {
			continue;
		}
		let bytes = match fs::read(&path) {
			Ok(b) => b,
			Err(_) => continue,
		};
		let family = detect_family(&bytes).unwrap_or_else(|| stem_of(&file_name));
		out.push(CustomFont { id: file_name, family, format: ext });
	}
	out.sort_by(|a, b| a.family.to_lowercase().cmp(&b.family.to_lowercase()));
	Ok(out)
}

/// Return the raw bytes of a stored font so the UI can register a `FontFace`.
#[tauri::command]
pub async fn font_read(app: AppHandle, id: String) -> Result<Vec<u8>, String> {
	let dir = fonts_dir(&app)?;
	let path = safe_join(&dir, &id)?;
	fs::read(&path).map_err(|e| e.to_string())
}

/// Delete a stored custom font.
#[tauri::command]
pub async fn font_delete(app: AppHandle, id: String) -> Result<(), String> {
	let dir = fonts_dir(&app)?;
	let path = safe_join(&dir, &id)?;
	if path.exists() {
		fs::remove_file(&path).map_err(|e| e.to_string())?;
	}
	Ok(())
}
