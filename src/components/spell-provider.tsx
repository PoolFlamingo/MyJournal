import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useLanguage } from "./language-provider";
import { useSpellcheck } from "./spellcheck-provider";
import { addWord as addWordEngine, getSpeller, type Speller } from "@/lib/spell/engine";
import { hasDictionary } from "@/lib/spell/dictionaries";
import { spellcheckLocales } from "@/services/systemApi";

interface SpellContextValue {
	/** El diccionario del idioma activo está cargado. */
	ready: boolean;
	/** El corrector está activado por el usuario. */
	enabled: boolean;
	/** Idioma activo. */
	language: string;
	/** Cambia al cargar el diccionario o al añadir una palabra (para re-subrayar). */
	revision: number;
	/** `true` si la palabra es correcta (o si no hay diccionario). */
	check: (word: string) => boolean;
	suggest: (word: string) => string[];
	addWord: (word: string) => Promise<void>;
}

const SpellContext = createContext<SpellContextValue | undefined>(undefined);

export function SpellProvider({ children }: { children: React.ReactNode }) {
	const { language } = useLanguage();
	const { enabled } = useSpellcheck();
	const spellerRef = useRef<Speller | null>(null);
	const [ready, setReady] = useState(false);
	const [revision, setRevision] = useState(0);

	useEffect(() => {
		let active = true;
		spellerRef.current = null;
		setReady(false);

		if (!hasDictionary(language)) {
			setRevision((r) => r + 1);
			return;
		}

		getSpeller(language).then((speller) => {
			if (!active) return;
			spellerRef.current = speller;
			setReady(Boolean(speller));
			setRevision((r) => r + 1);
		});

		return () => {
			active = false;
		};
	}, [language]);

	const check = useCallback((word: string) => {
		const speller = spellerRef.current;
		if (!speller) return true; // sin diccionario: no marcar nada
		return speller.correct(word);
	}, []);

	const suggest = useCallback((word: string) => {
		const speller = spellerRef.current;
		return speller ? speller.suggest(word).slice(0, 6) : [];
	}, []);

	const addWord = useCallback(
		async (word: string) => {
			const locale = spellcheckLocales(language)[0] ?? language;
			await addWordEngine(language, locale, word);
			setRevision((r) => r + 1);
		},
		[language]
	);

	return (
		<SpellContext.Provider
			value={{ ready, enabled, language, revision, check, suggest, addWord }}
		>
			{children}
		</SpellContext.Provider>
	);
}

export function useSpell() {
	const context = useContext(SpellContext);
	if (!context) {
		throw new Error("useSpell must be used within a SpellProvider");
	}
	return context;
}
