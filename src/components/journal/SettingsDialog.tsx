import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
	Package,
	Palette,
	Globe,
	RefreshCw,
	Download,
	RotateCcw,
	Check,
	Type,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";
import { useUpdate } from "@/components/update-provider";
import { useThemePreset } from "@/hooks/useThemePreset";
import { useWeekStart } from "@/hooks/useWeekStart";
import { FontPicker } from "./FontPicker";
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
	const { theme, resolvedTheme, setTheme } = useTheme();
	const { language, setLanguage, supportedLanguages } = useLanguage();
	const {
		loadTheme,
		getSavedPreset,
		availablePresets,
		getDisplayName,
		getPreviewColors,
	} = useThemePreset();
	const { weekStart, setWeekStart } = useWeekStart();
	const update = useUpdate();
	const [selectedTheme, setSelectedTheme] = useState<string | undefined>(() => {
		const saved = getSavedPreset();
		return saved ?? "caffeine";
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-2xl">
						{t("journal:menu.settings", "Configuración")}
					</DialogTitle>
					<DialogDescription>
						{t(
							"journal:menu.settingsDescription",
							"Personaliza tu experiencia en My Journal."
						)}
					</DialogDescription>
				</DialogHeader>

				<Tabs defaultValue="appearance" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="appearance" className="flex items-center gap-2">
							<Palette className="size-4" />
							<span className="hidden sm:inline">
								{t("journal:menu.appearance", "Apariencia")}
							</span>
						</TabsTrigger>
						<TabsTrigger value="language" className="flex items-center gap-2">
							<Globe className="size-4" />
							<span className="hidden sm:inline">
								{t("journal:menu.languageTab", "Idioma")}
							</span>
						</TabsTrigger>
						<TabsTrigger value="about" className="flex items-center gap-2">
							<Package className="size-4" />
							<span className="hidden sm:inline">
								{t("journal:menu.about", "Acerca de")}
							</span>
						</TabsTrigger>
					</TabsList>

					{/* Appearance Tab */}
					<TabsContent value="appearance" className="space-y-6 mt-6">
						<div className="space-y-6">
							{/* Light/Dark Mode */}
							<div>
								<Label
									htmlFor="brightness-select"
									className="text-base font-semibold mb-3 block"
								>
									{t("journal:menu.brightness", "Modo")}
								</Label>
								<Select
									value={theme}
									onValueChange={(value) =>
										setTheme(value as "dark" | "light" | "system")
									}
								>
									<SelectTrigger id="brightness-select">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="light">
											{t("journal:menu.themeLight", "Claro")}
										</SelectItem>
										<SelectItem value="dark">
											{t("journal:menu.themeDark", "Oscuro")}
										</SelectItem>
										<SelectItem value="system">
											{t("journal:menu.themeSystem", "Sistema")}
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground mt-2">
									{t(
										"journal:menu.brightnessDescription",
										"Elige si prefieres tema claro, oscuro o seguir la preferencia del sistema."
									)}
								</p>
							</div>

							{/* Color Theme Presets */}
							<div className="border-t border-border/40 pt-4">
								<Label className="text-base font-semibold mb-3 block">
									{t("journal:menu.colorTheme", "Paleta de colores")}
								</Label>
								<p className="text-sm text-muted-foreground mb-4">
									{t(
										"journal:menu.selectTheme",
										"Elige un tema predefinido para personalizar tu experiencia."
									)}
								</p>
								<div className="grid max-h-[220px] grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-3">
									{availablePresets.map((preset) => {
										const colors = getPreviewColors(preset, resolvedTheme);
										const active = selectedTheme === preset;
										return (
											<motion.button
												key={preset}
												type="button"
												whileHover={{ scale: 1.03 }}
												whileTap={{ scale: 0.96 }}
												transition={{ type: "spring", stiffness: 400, damping: 25 }}
												onClick={() => {
													setSelectedTheme(preset);
													void loadTheme(preset);
												}}
												title={getDisplayName(preset)}
												className={cn(
													"group flex flex-col gap-1.5 rounded-lg border-2 p-1.5 text-left transition-colors",
													active
														? "border-primary ring-2 ring-primary/20"
														: "border-border/50 hover:border-primary/40 hover:bg-muted/30"
												)}
											>
												<div
													className="flex h-10 items-center gap-1 overflow-hidden rounded-md border px-2"
													style={{
														background: colors.background,
														borderColor: colors.border,
													}}
												>
													<span
														className="flex size-6 items-center justify-center rounded text-[11px] font-bold"
														style={{ background: colors.card, color: colors.foreground }}
													>
														Aa
													</span>
													<span
														className="size-3 rounded-full"
														style={{ background: colors.primary }}
													/>
													<span
														className="size-3 rounded-full"
														style={{ background: colors.secondary }}
													/>
													<span
														className="size-3 rounded-full"
														style={{ background: colors.accent }}
													/>
												</div>
												<span className="flex items-center justify-between gap-1 px-0.5">
													<span className="truncate text-xs font-medium">
														{getDisplayName(preset)}
													</span>
													{active && <Check className="size-3.5 shrink-0 text-primary" />}
												</span>
											</motion.button>
										);
									})}
								</div>
							</div>

							{/* Editor Typography */}
							<div className="border-t border-border/40 pt-4">
								<Label className="text-base font-semibold mb-3 flex items-center gap-2">
									<Type className="size-4" />
									{t("journal:menu.editorFont", "Fuente por defecto del editor")}
								</Label>
								<p className="text-sm text-muted-foreground mb-3">
									{t(
										"journal:menu.editorFontDescription",
										"Elige la fuente con la que se muestran todas tus entradas. Puedes elegir cualquiera de la lista o subir la tuya (.ttf, .otf, .woff, .woff2)."
									)}
								</p>
								<FontPicker />
							</div>

							{/* Week Start */}
							<div className="border-t border-border/40 pt-4">
								<Label
									htmlFor="week-start-select"
									className="text-base font-semibold mb-3 block"
								>
									{t("journal:settings.weekStart", "Inicio de la semana")}
								</Label>
								<Select
									value={weekStart.toString()}
									onValueChange={(value) => setWeekStart(value === "0" ? 0 : 1)}
								>
									<SelectTrigger id="week-start-select">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="0">
											{t("journal:settings.weekStartSunday", "Domingo")}
										</SelectItem>
										<SelectItem value="1">
											{t("journal:settings.weekStartMonday", "Lunes")}
										</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground mt-2">
									{t(
										"journal:settings.weekStartDescription",
										"Elige si la semana comienza el domingo o el lunes."
									)}
								</p>
							</div>
						</div>
					</TabsContent>

					{/* Language Tab */}
					<TabsContent value="language" className="space-y-6 mt-6">
						<div className="space-y-3">
							<Label htmlFor="language-select" className="text-base font-semibold">
								{t("journal:menu.language", "Idioma")}
							</Label>
							<Select
								value={language}
								onValueChange={(value) => void setLanguage(value as "es" | "en")}
							>
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
								{t(
									"journal:menu.languageDescription",
									"Selecciona el idioma de la interfaz."
								)}
							</p>
						</div>
					</TabsContent>

					{/* About Tab */}
					<TabsContent value="about" className="space-y-6 mt-6">
						<div className="space-y-4">
							<div className="rounded-lg border border-border/50 bg-muted/30 p-4">
								<h3 className="font-semibold text-foreground mb-2">My Journal</h3>
								<p className="text-sm text-muted-foreground mb-3">
									{t(
										"journal:menu.aboutDescription",
										"Una aplicación de diario personal para reflexionar y proteger tus pensamientos."
									)}
								</p>
								<div className="space-y-1 text-xs text-muted-foreground">
									<p>
										<span className="font-medium text-foreground">
											{t("journal:menu.versionLabel")}:
										</span>{" "}
										{update.currentVersion}
									</p>
									<p>
										<span className="font-medium text-foreground">
											{t("journal:menu.technologyLabel")}:
										</span>{" "}
										Tauri + React + TypeScript
									</p>
									<p>
										<span className="font-medium text-foreground">
											{t("journal:menu.storageLabel")}:
										</span>{" "}
										{t("journal:menu.storageValue")}
									</p>
								</div>
							</div>

							{/* Update section */}
							<div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
								<h4 className="font-semibold text-foreground text-sm">
									{t("journal:settings.updates")}
								</h4>

								{/* Update status */}
								{update.error && (
									<p
										className="text-xs text-destructive cursor-pointer"
										onClick={update.dismissError}
									>
										{t("journal:settings.updateError")}: {update.error}
									</p>
								)}

								{update.downloaded && update.availableVersion && (
									<div className="space-y-2">
										<p className="text-xs text-emerald-600 dark:text-emerald-400">
											{t("journal:settings.readyToInstallDescription", {
												version: update.availableVersion,
											})}
										</p>
										<Button
											size="sm"
											onClick={() => void update.installAndRestart()}
											className="gap-2"
										>
											<RotateCcw className="size-3" />
											{t("journal:settings.installAndRestart")}
										</Button>
									</div>
								)}

								{!update.downloaded && update.availableVersion && !update.downloading && (
									<div className="space-y-2">
										<p className="text-xs text-amber-600 dark:text-amber-400">
											{t("journal:settings.updateAvailableDescription", {
												version: update.availableVersion,
											})}
										</p>
										<Button
											size="sm"
											variant="outline"
											onClick={() => void update.downloadUpdate()}
											className="gap-2"
										>
											<Download className="size-3" />
											{t("journal:settings.downloadAndInstall")}
										</Button>
									</div>
								)}

								{update.downloading && (
									<div className="space-y-2">
										<p className="text-xs text-muted-foreground">
											{t("journal:settings.downloading")}
										</p>
										{update.progress && update.progress.contentLength > 0 && (
											<div className="h-1.5 w-full rounded-full bg-muted">
												<div
													className="h-1.5 rounded-full bg-primary transition-all"
													style={{
														width: `${Math.round((update.progress.downloaded / update.progress.contentLength) * 100)}%`,
													}}
												/>
											</div>
										)}
									</div>
								)}

								{!update.availableVersion && !update.checking && !update.error && (
									<p className="text-xs text-muted-foreground">
										{t("journal:settings.noUpdate")}
									</p>
								)}

								{/* Check for updates button */}
								<Button
									size="sm"
									variant="ghost"
									disabled={update.checking || update.downloading}
									onClick={() => void update.checkNow()}
									className="gap-2"
								>
									<RefreshCw
										className={cn("size-3", update.checking && "animate-spin")}
									/>
									{update.checking
										? t("journal:settings.checking")
										: t("journal:settings.checkForUpdates")}
								</Button>

								{/* Update mode selector */}
								<div className="border-t border-border/40 pt-3">
									<Label
										htmlFor="update-mode-select"
										className="text-xs font-medium mb-2 block"
									>
										{t("journal:settings.updateMode")}
									</Label>
									<Select
										value={update.mode}
										onValueChange={(value) =>
											void update.setMode(value as "notify" | "background")
										}
									>
										<SelectTrigger id="update-mode-select" className="h-8 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="notify">
												{t("journal:settings.updateModeNotify")}
											</SelectItem>
											<SelectItem value="background">
												{t("journal:settings.updateModeBackground")}
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground mt-1">
										{update.mode === "notify"
											? t("journal:settings.updateModeNotifyDescription")
											: t("journal:settings.updateModeBackgroundDescription")}
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
