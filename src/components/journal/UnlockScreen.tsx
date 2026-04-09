import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertTriangle } from "lucide-react";
import type { JournalSummary } from "@/types/journal";

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
		<div className="flex min-h-screen items-center justify-center bg-background p-8">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<Lock className="mx-auto mb-2 size-10 text-muted-foreground" />
					<CardTitle>{t("unlock.title")}</CardTitle>
					<p className="text-sm text-muted-foreground">{journal.name}</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<p className="text-sm text-muted-foreground">
							{t("unlock.message")}
						</p>

						{error && (
							<Alert variant="destructive">
								<AlertTriangle className="size-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="unlock-password">
								{t("unlock.passwordLabel")}
							</Label>
							<Input
								id="unlock-password"
								type="password"
								placeholder={t("unlock.passwordPlaceholder")}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoFocus
							/>
						</div>

						<p className="text-xs text-muted-foreground">
							{t("unlock.noRecovery")}
						</p>

						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={onBack}
							>
								{t("journal.open")}
							</Button>
							<Button
								type="submit"
								className="flex-1"
								disabled={unlocking || !password.trim()}
							>
								{t("unlock.submit")}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
