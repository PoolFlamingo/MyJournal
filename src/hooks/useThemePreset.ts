import { useCallback } from "react";
import caffeineTheme from "@/assets/themes/caffeine.json";
import cyberpunkTheme from "@/assets/themes/cyberpunk.json";
import notebookTheme from "@/assets/themes/notebook.json";
import omegonTheme from "@/assets/themes/omegon.json";
import sunsetHorizonTheme from "@/assets/themes/sunset-horizon.json";
import vintagePaperTheme from "@/assets/themes/vintage-paper.json";

export type ThemePreset = "caffeine" | "cyberpunk" | "notebook" | "omegon" | "sunset-horizon" | "vintage-paper";

const THEME_STORAGE_KEY = "my-journal-theme-preset";
const STYLE_ELEMENT_ID = "my-journal-preset-styles";

const AVAILABLE_PRESETS: ThemePreset[] = [
	"caffeine",
	"cyberpunk",
	"notebook",
	"omegon",
	"sunset-horizon",
	"vintage-paper",
];

const THEME_DISPLAY_NAMES: Record<ThemePreset, string> = {
	"caffeine": "Caffeine",
	"cyberpunk": "Cyberpunk",
	"notebook": "Notebook",
	"omegon": "Omegon",
	"sunset-horizon": "Sunset Horizon",
	"vintage-paper": "Vintage Paper",
};

type ThemeJson = typeof caffeineTheme;

const THEME_DATA: Record<ThemePreset, ThemeJson> = {
	"caffeine": caffeineTheme,
	"cyberpunk": cyberpunkTheme,
	"notebook": notebookTheme,
	"omegon": omegonTheme,
	"sunset-horizon": sunsetHorizonTheme,
	"vintage-paper": vintagePaperTheme,
};

function buildVarsBlock(vars: Record<string, string>): string {
	return Object.entries(vars)
		.map(([key, value]) => `  --${key}: ${value};`)
		.join("\n");
}

function applyPreset(preset: ThemePreset): void {
	const data = THEME_DATA[preset];
	if (!data?.cssVars) return;

	// Remove previous preset style element
	document.getElementById(STYLE_ELEMENT_ID)?.remove();

	let css = "";

	// Shared theme-level vars (fonts, radius, etc.) go on :root always
	if (data.cssVars.theme) {
		css += `:root {\n${buildVarsBlock(data.cssVars.theme as Record<string, string>)}\n}\n`;
	}

	// Light mode vars on :root (default)
	if (data.cssVars.light) {
		css += `:root {\n${buildVarsBlock(data.cssVars.light as Record<string, string>)}\n}\n`;
	}

	// Dark mode vars under .dark selector so ThemeProvider class wins correctly
	if (data.cssVars.dark) {
		css += `.dark {\n${buildVarsBlock(data.cssVars.dark as Record<string, string>)}\n}\n`;
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
		if (saved && AVAILABLE_PRESETS.includes(saved as ThemePreset)) {
			return saved as ThemePreset;
		}
		return null;
	}, []);

	const applySavedTheme = useCallback(() => {
		const saved = getSavedPreset();
		applyPreset(saved ?? "caffeine");
	}, [getSavedPreset]);

	return {
		loadTheme,
		getSavedPreset,
		applySavedTheme,
		availablePresets: AVAILABLE_PRESETS,
		getDisplayName: (preset: ThemePreset) => THEME_DISPLAY_NAMES[preset],
	};
}
