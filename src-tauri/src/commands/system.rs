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
