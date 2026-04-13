import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertTriangle, KeyRound, ChevronLeft } from "lucide-react";
import type { JournalSummary } from "@/types/journal";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";

interface UnlockScreenProps {
	journal: JournalSummary;
	onUnlock: (id: string, password: string) => Promise<void>;
	onBack: () => void;
}

export function UnlockScreen({ journal, onUnlock, onBack }: UnlockScreenProps) {
	const { t } = useTranslation("journal");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [unlocking, setUnlocking] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!password.trim()) return;

		setUnlocking(true);
		setError(null);

		try {
			await onUnlock(journal.id, password);
		} catch (err) {
			if (err instanceof Error && err.message === "INVALID_PASSWORD") {
				setError(t("unlock.invalidPassword"));
			} else {
				setError(
					err instanceof Error ? err.message : t("errors.unlockFailed"),
				);
			}
		} finally {
			setUnlocking(false);
		}
	}

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
			{/* Decorative background */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
				<div className="h-[30rem] w-[30rem] rounded-full bg-primary/30 blur-3xl filter" />
			</div>

			<div className="absolute left-6 top-6 z-10">
				<Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
					<ChevronLeft className="mr-2 size-4" />
					{t("common.back", "Volver")}
				</Button>
			</div>
			
			<div className="absolute right-6 top-6 z-10 flex items-center gap-2">
				<ThemeToggle />
				<LanguageSwitch />
			</div>

			<Card className="z-10 w-full max-w-md border border-border/50 bg-card/60 shadow-2xl backdrop-blur-xl">
				<CardHeader className="text-center space-y-4 pb-6">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Lock className="size-8 text-primary" />
					</div>
					<div className="space-y-1">
						<CardTitle className="text-2xl font-bold tracking-tight">{t("unlock.title", "Diario bloqueado")}</CardTitle>
						<p className="text-sm font-medium text-muted-foreground">{journal.name}</p>
					</div>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-6">
						<div className="relative">
							<div className="absolute inset-x-0 -top-3 flex justify-center">
								<span className="bg-card px-2 text-xs text-muted-foreground border border-border/50 rounded-full">
									{t("unlock.privacyRequired")}
								</span>
							</div>
							<div className="space-y-4 rounded-xl bg-muted/30 p-5 pt-7 border border-border/30">
								{error && (
									<Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1 bg-destructive/10 border-destructive/20 text-destructive">
										<AlertTriangle className="size-4" />
										<AlertDescription className="text-xs font-medium">{error}</AlertDescription>
									</Alert>
								)}

								<div className="space-y-2.5">
									<Label htmlFor="unlock-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
										{t("unlock.passwordLabel", "Contraseña")}
									</Label>
									<div className="relative">
									<KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60 z-10" />
									<PasswordInput
										id="unlock-password"
											placeholder={t("unlock.passwordPlaceholder")}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="pl-9 h-11 bg-background focus-visible:ring-primary/30"
											autoFocus
										/>
									</div>
								</div>
							</div>
						</div>

						<Button
							type="submit"
							size="lg"
							className="w-full text-base h-11"
							disabled={unlocking || !password.trim()}
						>
							{unlocking ? t("common.loading", "Desbloqueando...") : t("unlock.submit", "Desbloquear")}
						</Button>

						<p className="text-center text-xs text-muted-foreground/70 flex items-center justify-center gap-1.5 mt-2">
							<AlertTriangle className="size-3" />
							{t("unlock.noRecovery", "Sin recuperación si olvidas la contraseña")}
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
