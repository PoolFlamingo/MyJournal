import { invoke } from "@tauri-apps/api/core";

/**
 * Abre el selector de emoji nativo del sistema operativo (comando Rust con
 * `enigo`, que simula el atajo del SO: Win+. / Ctrl+Cmd+Space / Ctrl+.).
 * El emoji se inserta en el control que tenga el foco, por lo que el editor
 * debe estar enfocado antes de llamar.
 */
export async function openEmojiPicker(): Promise<void> {
	try {
		await invoke("open_emoji_picker");
	} catch (error) {
		// El atajo del SO puede fallar (p. ej. Wayland sin X11); no rompemos la UI.
		console.warn("No se pudo abrir el selector de emoji del sistema", error);
	}
}

/**
 * Códigos de diccionario (hunspell) para el corrector de WebKitGTK por idioma.
 * Los idiomas sin diccionario habitual (zh, ja) quedan vacíos: el corrector
 * simplemente no marca nada en ellos.
 */
const SPELLCHECK_LOCALES: Record<string, string[]> = {
	es: ["es_ES"],
	en: ["en_US"],
	fr: ["fr_FR"],
	de: ["de_DE"],
	it: ["it_IT"],
	pt: ["pt_PT"],
	ru: ["ru_RU"],
	ro: ["ro_RO"],
	nl: ["nl_NL"],
	pl: ["pl_PL"],
	zh: [],
	ja: [],
	ko: ["ko_KR"],
};

export function spellcheckLocales(language: string): string[] {
	return SPELLCHECK_LOCALES[language] ?? [];
}

/**
 * Configura el corrector a nivel de webview. Solo tiene efecto real en Linux
 * (WebKitGTK), donde el atributo `spellcheck` no basta; en Windows/macOS es
 * un no-op en el lado Rust.
 */
export async function setSpellcheck(
	enabled: boolean,
	languages: string[]
): Promise<void> {
	try {
		await invoke("set_spellcheck", { enabled, languages });
	} catch (error) {
		console.warn("No se pudo configurar el corrector del webview", error);
	}
}
