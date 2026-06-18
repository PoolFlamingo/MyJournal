/**
 * Editor font registry. The editor's writing surface can use any of these
 * bundled families (offline), the theme default, or a user-uploaded font.
 */

export type FontCategory = "sans" | "serif" | "mono";
export type FontSource = "builtin" | "custom";

export interface FontOption {
	/** Stable identifier persisted as the user's choice. */
	id: string;
	/** Human label shown in the picker. */
	label: string;
	/** CSS `font-family` value applied to the editor (with generic fallback). */
	stack: string;
	category: FontCategory;
	source: FontSource;
}

const GENERIC_FALLBACK: Record<FontCategory, string> = {
	sans: "sans-serif",
	serif: "serif",
	mono: "monospace",
};

// [family, category] for every bundled font. Family strings match exactly what
// the corresponding @fontsource package registers (verified against the CSS).
const BUILTIN_DEFS: Array<[string, FontCategory]> = [
	// Sans-serif
	["Ancizar Sans", "sans"],
	["Inter", "sans"],
	["Roboto", "sans"],
	["Open Sans", "sans"],
	["Lato", "sans"],
	["Montserrat", "sans"],
	["Poppins", "sans"],
	["Nunito", "sans"],
	["Work Sans", "sans"],
	["Source Sans 3", "sans"],
	["Raleway", "sans"],
	["Mulish", "sans"],
	["Rubik", "sans"],
	["Karla", "sans"],
	["DM Sans", "sans"],
	["Manrope", "sans"],
	["Quicksand", "sans"],
	["Josefin Sans", "sans"],
	["Comfortaa", "sans"],
	["Albert Sans", "sans"],
	["Figtree", "sans"],
	["Outfit", "sans"],
	["Plus Jakarta Sans", "sans"],
	// Serif
	["Ancizar Serif", "serif"],
	["Merriweather", "serif"],
	["Lora", "serif"],
	["Playfair Display", "serif"],
	["PT Serif", "serif"],
	["Source Serif 4", "serif"],
	["Crimson Text", "serif"],
	["Crimson Pro", "serif"],
	["EB Garamond", "serif"],
	["Cormorant Garamond", "serif"],
	["Libre Baskerville", "serif"],
	["Bitter", "serif"],
	["Domine", "serif"],
	["Vollkorn", "serif"],
	["Spectral", "serif"],
	["Noto Serif", "serif"],
	["Frank Ruhl Libre", "serif"],
	["Zilla Slab", "serif"],
	["Alegreya", "serif"],
	["Cardo", "serif"],
	["Gelasio", "serif"],
	["Newsreader", "serif"],
	["Petrona", "serif"],
	// Monospace
	["JetBrains Mono", "mono"],
	["Fira Code", "mono"],
	["Source Code Pro", "mono"],
	["IBM Plex Mono", "mono"],
	["Space Mono", "mono"],
	["Inconsolata", "mono"],
];

export const BUILTIN_FONTS: FontOption[] = BUILTIN_DEFS.map(([family, category]) => ({
	id: `fs:${family}`,
	label: family,
	stack: `"${family}", ${GENERIC_FALLBACK[category]}`,
	category,
	source: "builtin" as const,
}));

/** Font applied out of the box: a real bundled font the user can change. */
export const DEFAULT_EDITOR_FONT_ID = "fs:Crimson Text";

/** Resolve a font id to its FontOption among the bundled fonts (or the default). */
export function builtinFontById(id: string): FontOption {
	return (
		BUILTIN_FONTS.find((f) => f.id === id) ??
		BUILTIN_FONTS.find((f) => f.id === DEFAULT_EDITOR_FONT_ID) ??
		BUILTIN_FONTS[0]
	);
}

/** Build a FontOption for an uploaded font given its detected family name. */
export function customFontOption(id: string, family: string): FontOption {
	return {
		id: `custom:${id}`,
		label: family,
		stack: `"${family}", sans-serif`,
		category: "sans",
		source: "custom",
	};
}

/** Extract the raw custom id (file name) from a `custom:<id>` option id. */
export function customIdFromOptionId(optionId: string): string | null {
	return optionId.startsWith("custom:") ? optionId.slice("custom:".length) : null;
}
