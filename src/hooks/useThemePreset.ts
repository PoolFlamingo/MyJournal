import { useCallback } from "react";

/**
 * Theme presets are loaded dynamically from every JSON file in
 * `src/assets/themes/`. Dropping a new tweakcn registry-item JSON into that
 * folder is enough to make it appear in the palette — no code changes needed.
 */

export type ThemePreset = string;

type ThemeVars = Record<string, string>;
type ThemeJson = {
	name?: string;
	cssVars?: {
		theme?: ThemeVars;
		light?: ThemeVars;
		dark?: ThemeVars;
	};
};

const THEME_STORAGE_KEY = "my-journal-theme-preset";
const STYLE_ELEMENT_ID = "my-journal-preset-styles";
const DEFAULT_PRESET = "caffeine";

// Eagerly import every theme JSON. Vite resolves the glob at build time.
const themeModules = import.meta.glob<{ default: ThemeJson }>("../assets/themes/*.json", {
	eager: true,
});

const THEME_DATA: Record<string, ThemeJson> = {};
for (const [path, mod] of Object.entries(themeModules)) {
	const slug = path
		.split("/")
		.pop()!
		.replace(/\.json$/, "");
	THEME_DATA[slug] = mod.default;
}

// The presets that shipped first stay at the front so the palette feels stable;
// everything else follows alphabetically.
const FEATURED_ORDER = [
	"caffeine",
	"notebook",
	"vintage-paper",
	"omegon",
	"sunset-horizon",
	"cyberpunk",
];

const AVAILABLE_PRESETS: ThemePreset[] = (() => {
	const all = Object.keys(THEME_DATA);
	const featured = FEATURED_ORDER.filter((s) => all.includes(s));
	const rest = all
		.filter((s) => !featured.includes(s))
		.sort((a, b) => a.localeCompare(b));
	return [...featured, ...rest];
})();

/** "modern-minimal" → "Modern Minimal", "doom-64" → "Doom 64", "t3-chat" → "T3 Chat". */
function slugToTitle(slug: string): string {
	return slug
		.split("-")
		.map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
		.join(" ");
}

const THEME_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
	AVAILABLE_PRESETS.map((slug) => [slug, slugToTitle(slug)])
);

export interface PreviewColors {
	background: string;
	card: string;
	foreground: string;
	primary: string;
	secondary: string;
	accent: string;
	border: string;
}

const FALLBACK_COLOR = "oklch(0.5 0 0)";

function pick(vars: ThemeVars | undefined, key: string): string {
	return vars?.[key] ?? FALLBACK_COLOR;
}

/** Colors used by the palette swatches so a theme can be previewed without applying it. */
function getPreviewColors(preset: ThemePreset, mode: "light" | "dark"): PreviewColors {
	const data = THEME_DATA[preset];
	const vars = (mode === "dark" ? data?.cssVars?.dark : data?.cssVars?.light) ?? {};
	return {
		background: pick(vars, "background"),
		card: pick(vars, "card"),
		foreground: pick(vars, "foreground"),
		primary: pick(vars, "primary"),
		secondary: pick(vars, "secondary"),
		accent: pick(vars, "accent"),
		border: pick(vars, "border"),
	};
}

function buildVarsBlock(vars: Record<string, string>): string {
	return Object.entries(vars)
		.map(([key, value]) => `  --${key}: ${value};`)
		.join("\n");
}

function applyPreset(preset: ThemePreset): void {
	const data = THEME_DATA[preset] ?? THEME_DATA[DEFAULT_PRESET];
	if (!data?.cssVars) return;

	// Remove previous preset style element
	document.getElementById(STYLE_ELEMENT_ID)?.remove();

	let css = "";

	// Shared theme-level vars (fonts, radius, etc.) go on :root always
	if (data.cssVars.theme) {
		css += `:root {\n${buildVarsBlock(data.cssVars.theme)}\n}\n`;
	}

	// Light mode vars on :root (default)
	if (data.cssVars.light) {
		css += `:root {\n${buildVarsBlock(data.cssVars.light)}\n}\n`;
	}

	// Dark mode vars under .dark selector so ThemeProvider class wins correctly
	if (data.cssVars.dark) {
		css += `.dark {\n${buildVarsBlock(data.cssVars.dark)}\n}\n`;
	}

	const style = document.createElement("style");
	style.id = STYLE_ELEMENT_ID;
	style.textContent = css;
	document.head.appendChild(style);

	localStorage.setItem(THEME_STORAGE_KEY, preset);
}

export function useThemePreset() {
	const loadTheme = useCallback((preset: ThemePreset) => {
		applyPreset(preset);
	}, []);

	const getSavedPreset = useCallback((): ThemePreset | null => {
		const saved = localStorage.getItem(THEME_STORAGE_KEY);
		if (saved && AVAILABLE_PRESETS.includes(saved)) {
			return saved;
		}
		return null;
	}, []);

	const applySavedTheme = useCallback(() => {
		const saved = getSavedPreset();
		applyPreset(saved ?? DEFAULT_PRESET);
	}, [getSavedPreset]);

	return {
		loadTheme,
		getSavedPreset,
		applySavedTheme,
		availablePresets: AVAILABLE_PRESETS,
		getDisplayName: (preset: ThemePreset) =>
			THEME_DISPLAY_NAMES[preset] ?? slugToTitle(preset),
		getPreviewColors,
	};
}
