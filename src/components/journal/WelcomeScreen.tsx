import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { BookOpen, Plus } from "lucide-react";
import type { CreateJournalDto, JournalPrivacy, JournalSummary } from "@/types/journal";

interface WelcomeScreenProps {
	journals: JournalSummary[];
	onCreateJournal: (data: CreateJournalDto) => Promise<void>;
	onOpenJournal: (id: string) => Promise<void>;
}

export function WelcomeScreen({
	journals,
	onCreateJournal,
	onOpenJournal,
}: WelcomeScreenProps) {
	const { t } = useTranslation("journal");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [creating, setCreating] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [privacy, setPrivacy] = useState<JournalPrivacy>("public");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	async function handleCreate() {
		if (!name.trim()) return;
		if (privacy === "private" && password !== confirmPassword) return;

		setCreating(true);
		try {
			await onCreateJournal({
				name: name.trim(),
				description: description.trim() || undefined,
				privacy,
				password: privacy === "private" ? password : undefined,
			});
			setShowCreateDialog(false);
			resetForm();
		} finally {
			setCreating(false);
		}
	}

	function resetForm() {
		setName("");
		setDescription("");
		setPrivacy("public");
		setPassword("");
		setConfirmPassword("");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
			<div className="text-center">
				<BookOpen className="mx-auto mb-4 size-16 text-primary" />
				<h1 className="text-4xl font-bold tracking-tight text-foreground">
					{t("welcome.title")}
				</h1>
				<p className="mt-2 text-lg text-muted-foreground">{t("welcome.subtitle")}</p>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row">
				<Button size="lg" onClick={() => setShowCreateDialog(true)}>
					<Plus className="mr-2 size-5" />
					{t("welcome.createNew")}
				</Button>
				{/* TODO: Phase 5 — import journal button */}
			</div>

			{journals.length > 0 && (
				<div className="mt-4 w-full max-w-md">
					<h2 className="mb-3 text-sm font-medium text-muted-foreground">
						{t("sidebar.journals")}
					</h2>
					<div className="flex flex-col gap-2">
						{journals.map((journal) => (
							<Button
								key={journal.id}
								variant="outline"
								className="justify-start"
								onClick={() => onOpenJournal(journal.id)}
							>
								<BookOpen className="mr-2 size-4" />
								<span className="flex-1 text-left">{journal.name}</span>
								{journal.privacy === "private" && (
									<span className="text-xs text-muted-foreground">
										🔒
									</span>
								)}
							</Button>
						))}
					</div>
				</div>
			)}

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("welcome.createNew")}</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<div className="space-y-2">
							<Label htmlFor="journal-name">{t("journal.name")}</Label>
							<Input
								id="journal-name"
								placeholder={t("journal.namePlaceholder")}
								value={name}
								onChange={(e) => setName(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="journal-description">
								{t("journal.description")}
							</Label>
							<Textarea
								id="journal-description"
								placeholder={t("journal.descriptionPlaceholder")}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={2}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("journal.privacy")}</Label>
							<Select
								value={privacy}
								onValueChange={(v) => setPrivacy(v as JournalPrivacy)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="public">
										{t("journal.public")}
									</SelectItem>
									<SelectItem value="private">
										{t("journal.private")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{privacy === "private" && (
							<>
								<div className="space-y-2">
									<Label htmlFor="journal-password">
										{t("journal.password")}
									</Label>
									<Input
										id="journal-password"
										type="password"
										placeholder={t("journal.passwordPlaceholder")}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="journal-confirm-password">
										{t("journal.confirmPassword")}
									</Label>
									<Input
										id="journal-confirm-password"
										type="password"
										placeholder={t("journal.passwordPlaceholder")}
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
									/>
								</div>
							</>
						)}
					</div>
					<DialogFooter>
						<Button
							onClick={handleCreate}
							disabled={
								creating ||
								!name.trim() ||
								(privacy === "private" &&
									(!password || password !== confirmPassword))
							}
						>
							{t("journal.create")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
