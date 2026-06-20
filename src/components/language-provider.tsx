import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { locale as getSystemLocale } from "@tauri-apps/plugin-os";
import { Store } from "@tauri-apps/plugin-store";
import i18n from "@/i18n/i18n";
import {
	SUPPORTED_LANGUAGES,
	SUPPORTED_LANGUAGE_LIST,
	type LanguageMeta,
	type SupportedLanguage,
} from "@/i18n/resources";

const STORAGE_FILE = "settings.json";
const STORAGE_KEY = "language";

interface LanguageContextValue {
	language: SupportedLanguage;
	setLanguage: (language: SupportedLanguage) => Promise<void>;
	supportedLanguages: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function parseSupportedLanguage(
	value: string | null | undefined
): SupportedLanguage | null {
	if (!value) return null;
	const normalized = value.toLowerCase();

	for (const code of SUPPORTED_LANGUAGES) {
		if (
			normalized === code ||
			normalized.startsWith(`${code}-`) ||
			normalized.startsWith(`${code}_`)
		) {
			return code;
		}
	}

	return null;
}

/** Mantiene `<html lang>` sincronizado: mejora el corrector ortográfico y la a11y. */
function applyDocumentLang(language: SupportedLanguage): void {
	if (typeof document !== "undefined") {
		document.documentElement.lang = language;
	}
}

async function readSavedLanguage(): Promise<SupportedLanguage | null> {
	try {
		const store = await Store.load(STORAGE_FILE);
		const saved = await store.get<SupportedLanguage>(STORAGE_KEY);
		return parseSupportedLanguage(saved ?? null);
	} catch {
		return null;
	}
}

async function saveLanguage(language: SupportedLanguage): Promise<void> {
	try {
		const store = await Store.load(STORAGE_FILE);
		await store.set(STORAGE_KEY, language);
		await store.save();
	} catch {
		// Ignore persistence failures in development mode.
	}
}

async function readSystemLanguage(): Promise<SupportedLanguage | null> {
	try {
		const osLocale = await getSystemLocale();
		const preferred = parseSupportedLanguage(osLocale ?? null);
		if (preferred) return preferred;
	} catch {
		// Fallback to browser locale when Tauri OS is unavailable.
	}

	if (typeof navigator !== "undefined") {
		return parseSupportedLanguage(navigator.language ?? navigator.languages?.[0] ?? null);
	}

	return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [language, setLanguageState] = useState<SupportedLanguage>(
		(i18n.language as SupportedLanguage) || "es"
	);

	useEffect(() => {
		let mounted = true;

		async function bootstrap() {
			const saved = await readSavedLanguage();
			const system = saved ?? (await readSystemLanguage());
			const nextLanguage = system ?? "es";

			await i18n.changeLanguage(nextLanguage);
			applyDocumentLang(nextLanguage);
			if (mounted) {
				setLanguageState(nextLanguage);
			}
		}

		bootstrap();
		return () => {
			mounted = false;
		};
	}, []);

	const setLanguage = useCallback(async (nextLanguage: SupportedLanguage) => {
		await i18n.changeLanguage(nextLanguage);
		applyDocumentLang(nextLanguage);
		setLanguageState(nextLanguage);
		await saveLanguage(nextLanguage);
	}, []);

	return (
		<LanguageContext.Provider
			value={{ language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGE_LIST }}
		>
			<I18nextProvider i18n={i18n}>{children}</I18nextProvider>
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (!context) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}
