/**
 * Catálogo de idiomas soportados por la interfaz.
 *
 * `SUPPORTED_LANGUAGES` es la fuente de verdad de los códigos; añadir uno aquí
 * y crear su carpeta en `./locales/<code>/` es suficiente: `i18n.ts` carga los
 * JSON con `import.meta.glob`, así que no hay imports que mantener.
 *
 * `region` es el código de país ISO-3166 que usa la bandera SVG local de
 * `flag-icons` (ver componente `Flag`).
 */
export const SUPPORTED_LANGUAGES = [
	"es",
	"en",
	"fr",
	"de",
	"it",
	"pt",
	"ru",
	"ro",
	"nl",
	"pl",
	"zh",
	"ja",
	"ko",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageMeta {
	code: SupportedLanguage;
	/** Nombre del idioma en su propia lengua. */
	label: string;
	/**
	 * Código de país ISO-3166 (minúsculas) para la bandera SVG de `flag-icons`.
	 * Se usa SVG local en vez de emoji porque WebKitGTW (Linux) no dibuja las
	 * banderas de "regional indicators".
	 */
	region: string;
}

export const LANGUAGE_META: Record<SupportedLanguage, LanguageMeta> = {
	es: { code: "es", label: "Español", region: "es" },
	en: { code: "en", label: "English", region: "gb" },
	fr: { code: "fr", label: "Français", region: "fr" },
	de: { code: "de", label: "Deutsch", region: "de" },
	it: { code: "it", label: "Italiano", region: "it" },
	pt: { code: "pt", label: "Português", region: "pt" },
	ru: { code: "ru", label: "Русский", region: "ru" },
	ro: { code: "ro", label: "Română", region: "ro" },
	nl: { code: "nl", label: "Nederlands", region: "nl" },
	pl: { code: "pl", label: "Polski", region: "pl" },
	zh: { code: "zh", label: "中文", region: "cn" },
	ja: { code: "ja", label: "日本語", region: "jp" },
	ko: { code: "ko", label: "한국어", region: "kr" },
};

export const SUPPORTED_LANGUAGE_LIST: LanguageMeta[] = SUPPORTED_LANGUAGES.map(
	(code) => LANGUAGE_META[code]
);
