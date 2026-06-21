use enigo::{
	Direction::{Click, Press, Release},
	Enigo, Key, Keyboard, Settings,
};

/// Abre el selector de emoji nativo del sistema operativo simulando su atajo.
///
/// El emoji se inserta en el control que tenga el foco, por lo que el frontend
/// debe enfocar el editor antes de invocar este comando.
///
/// - Windows: `Win + .`
/// - macOS: `Control + Command + Space`
/// - Linux (GTK/WebKitGTK): `Control + .`
#[tauri::command]
pub fn open_emoji_picker() -> Result<(), String> {
	let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;

	#[cfg(target_os = "windows")]
	{
		enigo.key(Key::Meta, Press).map_err(|e| e.to_string())?;
		enigo.key(Key::Unicode('.'), Click).map_err(|e| e.to_string())?;
		enigo.key(Key::Meta, Release).map_err(|e| e.to_string())?;
	}

	#[cfg(target_os = "macos")]
	{
		enigo.key(Key::Control, Press).map_err(|e| e.to_string())?;
		enigo.key(Key::Meta, Press).map_err(|e| e.to_string())?;
		enigo.key(Key::Space, Click).map_err(|e| e.to_string())?;
		enigo.key(Key::Meta, Release).map_err(|e| e.to_string())?;
		enigo.key(Key::Control, Release).map_err(|e| e.to_string())?;
	}

	#[cfg(target_os = "linux")]
	{
		enigo.key(Key::Control, Press).map_err(|e| e.to_string())?;
		enigo.key(Key::Unicode('.'), Click).map_err(|e| e.to_string())?;
		enigo.key(Key::Control, Release).map_err(|e| e.to_string())?;
	}

	Ok(())
}

/// Configura el corrector ortográfico a nivel de webview.
///
/// En **Linux (WebKitGTK)** el corrector viene DESACTIVADO por defecto y el
/// atributo HTML `spellcheck` no surte efecto hasta que se habilita en el
/// `WebContext` y se le indican los idiomas (códigos hunspell tipo `es_ES`).
/// Requiere que el diccionario del sistema esté instalado (p. ej. `hunspell-es`).
///
/// En Windows (WebView2) y macOS (WKWebView) el corrector se gobierna desde el
/// propio elemento (`spellcheck` + `lang`), así que aquí es un no-op.
#[cfg(target_os = "linux")]
#[tauri::command]
pub fn set_spellcheck(
	window: tauri::WebviewWindow,
	enabled: bool,
	languages: Vec<String>,
) -> Result<(), String> {
	use webkit2gtk::{WebContextExt, WebViewExt};

	window
		.with_webview(move |webview| {
			let wv = webview.inner();
			if let Some(context) = WebViewExt::context(&wv) {
				context.set_spell_checking_enabled(enabled);
				if enabled && !languages.is_empty() {
					let refs: Vec<&str> = languages.iter().map(String::as_str).collect();
					context.set_spell_checking_languages(&refs);
				}
			}
		})
		.map_err(|e| e.to_string())
}

#[cfg(not(target_os = "linux"))]
#[tauri::command]
pub fn set_spellcheck(
	_window: tauri::WebviewWindow,
	_enabled: bool,
	_languages: Vec<String>,
) -> Result<(), String> {
	Ok(())
}

/// Añade una palabra al diccionario personal del SO. En Linux escribe en la
/// lista personal de enchant (`$XDG_CONFIG_HOME/enchant/<locale>.dic`, una
/// palabra por línea), que es la que usa WebKitGTK y otras apps GTK. En
/// Windows/macOS es un no-op (el diccionario lo gestiona el motor propio).
#[cfg(target_os = "linux")]
#[tauri::command]
pub fn spell_add_to_system(language: String, word: String) -> Result<(), String> {
	use std::io::Write;

	let word = word.trim();
	if word.is_empty() {
		return Ok(());
	}

	let base = std::env::var_os("XDG_CONFIG_HOME")
		.map(std::path::PathBuf::from)
		.filter(|p| !p.as_os_str().is_empty())
		.or_else(|| std::env::var_os("HOME").map(|h| std::path::PathBuf::from(h).join(".config")))
		.ok_or_else(|| "no se pudo determinar el directorio de configuración".to_string())?;

	let dir = base.join("enchant");
	std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
	let file = dir.join(format!("{language}.dic"));

	// Evita duplicados.
	if let Ok(existing) = std::fs::read_to_string(&file) {
		if existing.lines().any(|line| line.trim() == word) {
			return Ok(());
		}
	}

	let mut f = std::fs::OpenOptions::new()
		.create(true)
		.append(true)
		.open(&file)
		.map_err(|e| e.to_string())?;
	writeln!(f, "{word}").map_err(|e| e.to_string())?;
	Ok(())
}

#[cfg(not(target_os = "linux"))]
#[tauri::command]
pub fn spell_add_to_system(_language: String, _word: String) -> Result<(), String> {
	Ok(())
}
