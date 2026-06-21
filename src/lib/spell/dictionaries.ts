/**
 * Idiomas con diccionario hunspell disponible. Los archivos `.aff`/`.dic` se
 * copian a `public/dictionaries/` en `predev`/`prebuild`
 * (ver `scripts/copy-dictionaries.mjs`) y se cargan en runtime con `fetch`.
 *
 * zh y ja se omiten (no hay diccionario hunspell de calidad).
 */
export const DICTIONARY_LANGUAGES = new Set([
	"en",
	"es",
	"fr",
	"de",
	"it",
	"pt",
	"ru",
	"ro",
	"nl",
	"pl",
	"ko",
]);

export function hasDictionary(language: string): boolean {
	return DICTIONARY_LANGUAGES.has(language);
}

export function dictionaryUrls(language: string): { aff: string; dic: string } {
	const base = import.meta.env.BASE_URL ?? "/";
	return {
		aff: `${base}dictionaries/${language}.aff`,
		dic: `${base}dictionaries/${language}.dic`,
	};
}
