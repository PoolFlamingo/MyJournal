import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
	const { t } = useTranslation("common");
	const { resolvedTheme, setTheme } = useTheme();

	const isDark = resolvedTheme === "dark";
	const next = isDark ? "light" : "dark";
	const label = isDark
		? t("theme.toggleToLight", "Cambiar a tema claro")
		: t("theme.toggleToDark", "Cambiar a tema oscuro");

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={() => setTheme(next)}
			aria-label={label}
			title={label}
		>
			<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">{label}</span>
		</Button>
	);
}
