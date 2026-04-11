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
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Book, Plus, Lock, ChevronRight, BookOpenText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateJournalDto, JournalPrivacy, JournalSummary } from "@/types/journal";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";

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
		<div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-12">
			{/* Decorative background blur */}
			<div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
				<div className="h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-3xl filter" />
			</div>

			<div className="absolute right-6 top-6 flex items-center gap-2">
				<ThemeToggle />
				<LanguageSwitch />
			</div>

			<div className="z-10 flex w-full max-w-4xl flex-col gap-12 lg:flex-row lg:items-center mt-12 lg:mt-0">
				{/* Left Side: Hero */}
				<div className="flex flex-1 flex-col items-start text-left">
					<div className="mb-6 rounded-2xl bg-primary/10 p-4 text-primary">
						<BookOpenText className="size-10" />
					</div>
					<h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
						{t("welcome.title", "Captura tu mundo interior")}
					</h1>
					<p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
						{t("welcome.subtitle", "Escribe, reflexiona y protege tus pensamientos en un espacio diseñado a tu medida y completamente privado.")}
					</p>

					<div className="mt-8 flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
						<Button size="lg" className="h-12 px-8 text-base shadow-lg transition-all hover:-translate-y-0.5" onClick={() => setShowCreateDialog(true)}>
							<Plus className="mr-2 size-5" />
							{t("welcome.createNew", "Crear nuevo diario")}
						</Button>
					</div>
				</div>

				{/* Right Side: Journals List */}
				<div className="flex w-full flex-1 flex-col gap-4 lg:max-w-md">
					{journals.length > 0 ? (
						<>
							<div className="mb-2 flex items-center justify-between px-1">
								<h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
									{t("sidebar.journals", "Tus diarios")}
								</h2>
							</div>
							<div className="flex flex-col gap-3">
								{journals.map((journal) => (
									<Card 
										key={journal.id} 
										className="group cursor-pointer border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card hover:shadow-md"
										onClick={() => onOpenJournal(journal.id)}
									>
										<CardContent className="flex items-center justify-between p-4">
											<div className="flex items-center gap-3">
												<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
													{journal.privacy === "private" ? <Lock className="size-4" /> : <Book className="size-4" />}
												</div>
												<div className="flex flex-col">
													<span className="font-semibold leading-none mb-1 text-foreground">{journal.name}</span>
													{journal.description ? (
														<span className="text-xs text-muted-foreground line-clamp-1">{journal.description}</span>
													) : (
														<span className="text-xs text-muted-foreground">
															{journal.privacy === "private" ? t("journal.private", "Privado") : t("journal.public", "Público")}
														</span>
													)}
												</div>
											</div>
											<ChevronRight className="size-5 text-muted-foreground opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
										</CardContent>
									</Card>
								))}
							</div>
						</>
					) : (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center backdrop-blur-sm">
							<Book className="mb-3 size-10 text-muted-foreground/50" />
							<h3 className="text-lg font-medium text-foreground">Ningún diario</h3>
							<p className="mt-1 text-sm text-muted-foreground">Comienza creando tu primer diario personal.</p>
						</div>
					)}
				</div>
			</div>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-2xl">{t("welcome.createNew", "Crear nuevo diario")}</DialogTitle>
						<DialogDescription>
							Configura el nombre y la privacidad de tu nuevo espacio personal.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-6 py-4">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="journal-name" className="text-sm font-semibold">{t("journal.name")}</Label>
								<Input
									id="journal-name"
									placeholder={t("journal.namePlaceholder")}
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="h-11 transition-shadow focus-visible:ring-primary/20"
									autoFocus
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="journal-description" className="text-sm font-semibold">
									{t("journal.description")} <span className="text-muted-foreground font-normal">(Opcional)</span>
								</Label>
								<Textarea
									id="journal-description"
									placeholder={t("journal.descriptionPlaceholder")}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="resize-none focus-visible:ring-primary/20"
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-semibold">{t("journal.privacy", "Privacidad")}</Label>
								<Select
									value={privacy}
									onValueChange={(v) => setPrivacy(v as JournalPrivacy)}
								>
									<SelectTrigger className="h-11 focus:ring-primary/20">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="public">
											<div className="flex items-center gap-2">
												<Book className="size-4" />
												<span>{t("journal.public", "Público (Sin contraseña)")}</span>
											</div>
										</SelectItem>
										<SelectItem value="private">
											<div className="flex items-center gap-2">
												<Lock className="size-4" />
												<span>{t("journal.private", "Privado (Protegido)")}</span>
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						
						{privacy === "private" && (
							<div className="animate-in fade-in slide-in-from-top-2 space-y-4 rounded-lg bg-muted/50 p-4 border border-border/50">
								<p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 leading-relaxed">
									<Lock className="size-3.5" />
									La contraseña cifrará permanentemente tu diario. Si la olvidas, perderás el acceso a tus entradas.
								</p>
								<div className="space-y-2">
									<Label htmlFor="journal-password">{t("journal.password")}</Label>
									<Input
										id="journal-password"
										type="password"
										className="h-11 border-border/50 bg-background"
										placeholder={t("journal.passwordPlaceholder")}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="journal-confirm-password">{t("journal.confirmPassword")}</Label>
									<Input
										id="journal-confirm-password"
										type="password"
										className="h-11 border-border/50 bg-background"
										placeholder={t("journal.passwordPlaceholder")}
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
									/>
								</div>
							</div>
						)}
					</div>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
							Cancelar
						</Button>
						<Button
							className="h-10 px-6"
							onClick={handleCreate}
							disabled={
								creating ||
								!name.trim() ||
								(privacy === "private" &&
									(!password || password !== confirmPassword))
							}
						>
							{creating ? "Creando..." : t("welcome.createNew", "Crear diario")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
