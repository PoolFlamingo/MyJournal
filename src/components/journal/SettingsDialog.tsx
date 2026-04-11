import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, Palette, Globe } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useThemePreset } from "@/hooks/useThemePreset";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
	const { t } = useTranslation(["journal", "common"]);
	const { theme, setTheme } = useTheme();
	const { language, setLanguage, supportedLanguages } = useLanguage();
	const { loadTheme, getSavedPreset, availablePresets, getDisplayName } = useThemePreset();
	const [selectedTheme, setSelectedTheme] = useState<string | undefined>(() => {
		const saved = getSavedPreset();
		return saved ?? "caffeine";
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-2xl">{t("journal:menu.settings", "Configuración")}</DialogTitle>
					<DialogDescription>{t("journal:menu.settingsDescription", "Personaliza tu experiencia en My Journal.")}</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="appearance" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="appearance" className="flex items-center gap-2">
							<Palette className="size-4" />
							<span className="hidden sm:inline">{t("journal:menu.appearance", "Apariencia")}</span>
						</TabsTrigger>
						<TabsTrigger value="language" className="flex items-center gap-2">
							<Globe className="size-4" />
							<span className="hidden sm:inline">{t("journal:menu.languageTab", "Idioma")}</span>
						</TabsTrigger>
						<TabsTrigger value="about" className="flex items-center gap-2">
							<Package className="size-4" />
							<span className="hidden sm:inline">{t("journal:menu.about", "Acerca de")}</span>
						</TabsTrigger>
					</TabsList>

					{/* Appearance Tab */}
					<TabsContent value="appearance" className="space-y-6 mt-6">
						<div className="space-y-6">
							{/* Light/Dark Mode */}
							<div>
								<Label htmlFor="brightness-select" className="text-base font-semibold mb-3 block">
									{t("journal:menu.brightness", "Modo")}
								</Label>
								<Select value={theme} onValueChange={(value) => setTheme(value as "dark" | "light" | "system")}>
									<SelectTrigger id="brightness-select">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="light">{t("journal:menu.themeLight", "Claro")}</SelectItem>
										<SelectItem value="dark">{t("journal:menu.themeDark", "Oscuro")}</SelectItem>
										<SelectItem value="system">{t("journal:menu.themeSystem", "Sistema")}</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground mt-2">
									{t("journal:menu.brightnessDescription", "Elige si prefieres tema claro, oscuro o seguir la preferencia del sistema.")}
								</p>
							</div>

							{/* Color Theme Presets */}
							<div className="border-t border-border/40 pt-4">
								<Label className="text-base font-semibold mb-3 block">
									{t("journal:menu.colorTheme", "Paleta de colores")}
								</Label>
								<p className="text-sm text-muted-foreground mb-4">
									{t("journal:menu.selectTheme", "Elige un tema predefinido para personalizar tu experiencia.")}
								</p>
								<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
									{availablePresets.map((preset) => (
										<button
											key={preset}
											onClick={() => {
												setSelectedTheme(preset);
												void loadTheme(preset);
											}}
											className={cn(
												"rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
												selectedTheme === preset
													? "border-primary bg-primary/10 text-primary"
													: "border-border/50 bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-muted/40"
											)}
											title={getDisplayName(preset)}
										>
											{getDisplayName(preset)}
										</button>
									))}
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Language Tab */}
					<TabsContent value="language" className="space-y-6 mt-6">
						<div className="space-y-3">
							<Label htmlFor="language-select" className="text-base font-semibold">
								{t("journal:menu.language", "Idioma")}
							</Label>
							<Select value={language} onValueChange={(value) => void setLanguage(value as "es" | "en")}>
								<SelectTrigger id="language-select">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{supportedLanguages.map((lang) => (
										<SelectItem key={lang.code} value={lang.code}>
											{lang.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-sm text-muted-foreground">
								{t("journal:menu.languageDescription", "Selecciona el idioma de la interfaz.")}
							</p>
						</div>
					</TabsContent>

					{/* About Tab */}
					<TabsContent value="about" className="space-y-6 mt-6">
						<div className="space-y-4">
							<div className="rounded-lg border border-border/50 bg-muted/30 p-4">
								<h3 className="font-semibold text-foreground mb-2">My Journal</h3>
								<p className="text-sm text-muted-foreground mb-3">
									{t("journal:menu.aboutDescription", "Una aplicación de diario personal para reflexionar y proteger tus pensamientos.")}
								</p>
								<div className="space-y-1 text-xs text-muted-foreground">
									<p>
										<span className="font-medium text-foreground">Versión:</span> 0.1.0
									</p>
									<p>
										<span className="font-medium text-foreground">Tecnología:</span> Tauri + React + TypeScript
									</p>
									<p>
										<span className="font-medium text-foreground">Sidecar:</span> Bun + SQLite
									</p>
								</div>
							</div>

							<div className="rounded-lg border border-border/50 bg-muted/30 p-4">
								<h4 className="font-semibold text-foreground mb-2 text-sm">
									{t("journal:menu.features", "Características")}
								</h4>
								<ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
									<li>{t("journal:menu.feature1", "Diarios públicos y privados")}</li>
									<li>{t("journal:menu.feature2", "Protección con contraseña")}</li>
									<li>{t("journal:menu.feature3", "Editor de texto enriquecido")}</li>
									<li>{t("journal:menu.feature4", "Navegación por calendario")}</li>
									<li>{t("journal:menu.feature5", "Temas personalizables")}</li>
								</ul>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
