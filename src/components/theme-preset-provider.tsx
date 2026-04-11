import { useEffect } from "react";
import { useThemePreset } from "@/hooks/useThemePreset";

/**
 * ThemePresetProvider ensures theme presets are loaded on app start.
 * This wraps the app to apply saved theme preference during initialization.
 */
export function ThemePresetProvider({ children }: { children: React.ReactNode }) {
	const { applySavedTheme } = useThemePreset();

	useEffect(() => {
		// Load saved theme preset on mount
		applySavedTheme();
	}, [applySavedTheme]);

	return <>{children}</>;
}
