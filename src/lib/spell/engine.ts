import nspell from "nspell";
import { invoke } from "@tauri-apps/api/core";
import { dictionaryUrls, hasDictionary } from "./dictionaries";

export interface Speller {
	correct(word: string): boolean;
	suggest(word: string): string[];
	add(word: string): unknown;
}

// Un speller por idioma (la carga del diccionario es cara, se cachea).
const cache = new Map<string, Promise<Speller | null>>();

function personalKey(language: string): string {
	return `my-journal-personal-dict-${language}`;
}

export function readPersonalWords(language: string): string[] {
	try {
		const raw = localStorage.getItem(personalKey(language));
		return raw ? (JSON.parse(raw) as string[]) : [];
	} catch {
		return [];
	}
}

function writePersonalWords(language: string, words: string[]): void {
	try {
		localStorage.setItem(personalKey(language), JSON.stringify(words));
	} catch {
		// localStorage no disponible; se ignora.
	}
}

async function build(language: string): Promise<Speller | null> {
	if (!hasDictionary(language)) return null;
	const { aff, dic } = dictionaryUrls(language);
	const [affRes, dicRes] = await Promise.all([fetch(aff), fetch(dic)]);
	if (!affRes.ok || !dicRes.ok) return null;
	const decoder = new TextDecoder("utf-8");
	const affText = decoder.decode(await affRes.arrayBuffer());
	const dicText = decoder.decode(await dicRes.arrayBuffer());
	const speller = nspell(affText, dicText) as Speller;
	for (const word of readPersonalWords(language)) speller.add(word);
	return speller;
}

export function getSpeller(language: string): Promise<Speller | null> {
	let entry = cache.get(language);
	if (!entry) {
		entry = build(language).catch(() => null);
		cache.set(language, entry);
	}
	return entry;
}

/**
 * Añade una palabra al diccionario personal (persistido), al speller activo y
 * —en Linux— también al diccionario del SO (enchant), compartido con otras apps.
 */
export async function addWord(
	language: string,
	systemLocale: string,
	word: string
): Promise<void> {
	const trimmed = word.trim();
	if (!trimmed) return;

	const words = readPersonalWords(language);
	if (!words.includes(trimmed)) {
		words.push(trimmed);
		writePersonalWords(language, words);
	}

	const speller = await getSpeller(language);
	speller?.add(trimmed);

	try {
		await invoke("spell_add_to_system", {
			language: systemLocale || language,
			word: trimmed,
		});
	} catch {
		// No disponible (Windows/macOS o sin enchant); se ignora.
	}
}
