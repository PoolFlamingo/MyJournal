import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import "@/lib/fonts/fontsource-imports";
import {
	BUILTIN_FONTS,
	builtinFontById,
	customFontOption,
	customIdFromOptionId,
	type FontOption,
} from "@/lib/fonts/registry";
import { deleteFont, listFonts, readFont, registerFont } from "@/services/fontApi";

const EDITOR_FONT_STORAGE_KEY = "my-journal-editor-font";
const EDITOR_FONT_CSS_VAR = "--editor-font";

interface EditorFontState {
	/** Currently selected font option id (persisted), or null for the theme default. */
	fontId: string | null;
	setFontId: (id: string | null) => void;
	/** Bundled fonts (sans/serif/mono). */
	builtinFonts: FontOption[];
	/** User-uploaded fonts. */
	customFonts: FontOption[];
	/** Every selectable option (bundled + custom). */
	allFonts: FontOption[];
	/** Resolve a font id to its CSS `font-family` stack. */
	getStack: (id: string) => string;
	/** Upload a font file, register it and return the new option. */
	uploadFont: (file: File) => Promise<FontOption>;
	/** Delete a custom font by its option id. */
	removeCustomFont: (optionId: string) => Promise<void>;
}

const EditorFontContext = createContext<EditorFontState | undefined>(undefined);

/** Register a font's bytes as a usable `FontFace` in the document. */
async function loadFontFace(family: string, bytes: Uint8Array): Promise<void> {
	try {
		const face = new FontFace(family, bytes as BufferSource);
		await face.load();
		document.fonts.add(face);
	} catch (err) {
		console.error(`Could not register font face "${family}"`, err);
	}
}

export function EditorFontProvider({ children }: { children: React.ReactNode }) {
	const [fontId, setFontIdState] = useState<string | null>(() => {
		const saved = localStorage.getItem(EDITOR_FONT_STORAGE_KEY);
		if (!saved || saved === "theme-default" || saved === "null") return null;
		if (saved.startsWith("fs:") || saved.startsWith("custom:")) return saved;
		return null;
	});
	const [customFonts, setCustomFonts] = useState<FontOption[]>([]);
	const loadedRef = useRef(false);

	const builtinFonts = BUILTIN_FONTS;
	const allFonts = useMemo(() => [...BUILTIN_FONTS, ...customFonts], [customFonts]);

	// On first mount, ensure CSS variable is properly initialized to theme default
	useEffect(() => {
		// Clear any stale CSS variable on mount
		document.documentElement.style.removeProperty(EDITOR_FONT_CSS_VAR);
	}, []);

	const getStack = useCallback(
		(id: string | null): string => {
			if (!id) return "";
			// Built-in fonts: look up via official function
			if (id.startsWith("fs:")) {
				const found = BUILTIN_FONTS.find((f) => f.id === id);
				return found?.stack || builtinFontById(id).stack;
			}
			// Custom fonts: search in current list
			const custom = customFonts.find((f) => f.id === id);
			return custom?.stack || "";
		},
		[customFonts]
	);

	// Load and register previously uploaded fonts once on mount.
	useEffect(() => {
		if (loadedRef.current) return;
		loadedRef.current = true;
		let cancelled = false;
		(async () => {
			try {
				const stored = await listFonts();
				const options: FontOption[] = [];
				for (const meta of stored) {
					try {
						const bytes = await readFont(meta.id);
						await loadFontFace(meta.family, bytes);
						options.push(customFontOption(meta.id, meta.family));
					} catch (err) {
						console.error("Could not load stored font", meta.id, err);
					}
				}
				if (!cancelled && options.length > 0) setCustomFonts(options);
			} catch (err) {
				// Non-Tauri context (e.g. `npm run dev`) or no fonts yet — ignore.
				console.debug("Custom fonts unavailable:", err);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Apply font as CSS variable when fontId changes.
	useEffect(() => {
		if (!fontId) {
			// Clear the CSS var to use theme default via CSS fallback
			document.documentElement.style.removeProperty(EDITOR_FONT_CSS_VAR);
			return;
		}

		// Look up the font stack for the selected font ID
		let stack = "";
		if (fontId.startsWith("fs:")) {
			const found = BUILTIN_FONTS.find((f) => f.id === fontId);
			stack = found?.stack || builtinFontById(fontId).stack;
		} else if (fontId.startsWith("custom:")) {
			const custom = customFonts.find((f) => f.id === fontId);
			stack = custom?.stack || "";
		}

		// Apply the stack to the CSS variable
		if (stack) {
			document.documentElement.style.setProperty(EDITOR_FONT_CSS_VAR, stack);
		}
	}, [fontId, customFonts]);

	const setFontId = useCallback((id: string | null) => {
		setFontIdState(id);
		if (id) {
			localStorage.setItem(EDITOR_FONT_STORAGE_KEY, id);
		} else {
			localStorage.removeItem(EDITOR_FONT_STORAGE_KEY);
		}
	}, []);

	const uploadFont = useCallback(async (file: File): Promise<FontOption> => {
		const buffer = await file.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		const meta = await registerFont(file.name, bytes);
		await loadFontFace(meta.family, bytes);
		const option = customFontOption(meta.id, meta.family);
		setCustomFonts((prev) => {
			const without = prev.filter((f) => f.id !== option.id);
			return [...without, option].sort((a, b) => a.label.localeCompare(b.label));
		});
		return option;
	}, []);

	const removeCustomFont = useCallback(async (optionId: string) => {
		const rawId = customIdFromOptionId(optionId);
		if (!rawId) return;
		await deleteFont(rawId);
		setCustomFonts((prev) => prev.filter((f) => f.id !== optionId));
		setFontIdState((current) => {
			if (current === optionId) {
				localStorage.removeItem(EDITOR_FONT_STORAGE_KEY);
				return null;
			}
			return current;
		});
	}, []);

	const value: EditorFontState = useMemo(
		() => ({
			fontId,
			setFontId,
			builtinFonts,
			customFonts,
			allFonts,
			getStack,
			uploadFont,
			removeCustomFont,
		}),
		[fontId, setFontId, builtinFonts, customFonts, allFonts, getStack, uploadFont, removeCustomFont]
	);

	return (
		<EditorFontContext.Provider value={value}>{children}</EditorFontContext.Provider>
	);
}

export function useEditorFont(): EditorFontState {
	const ctx = useContext(EditorFontContext);
	if (!ctx) {
		throw new Error("useEditorFont must be used within an EditorFontProvider");
	}
	return ctx;
}
