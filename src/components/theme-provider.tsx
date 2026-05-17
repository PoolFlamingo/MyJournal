import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

interface ThemeProviderState {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "system",
	resolvedTheme: "light",
	setTheme: () => null,
});

function getSystemTheme(): ResolvedTheme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "tauract-ui-theme",
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
		() => (localStorage.getItem(storageKey) as Theme) || defaultTheme
	);
	const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

	const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

	// Apply the resolved theme as a class on <html>.
	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove("light", "dark");
		root.classList.add(resolvedTheme);
	}, [resolvedTheme]);

	// Stay in sync with the OS color-scheme preference.
	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => setSystemTheme(media.matches ? "dark" : "light");
		media.addEventListener("change", handler);
		return () => media.removeEventListener("change", handler);
	}, []);

	const value = {
		theme,
		resolvedTheme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);
	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");
	return context;
};
