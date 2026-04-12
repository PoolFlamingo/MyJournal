import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { JournalSidebar } from "@/components/journal/JournalSidebar";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { BookOpenText } from "lucide-react";
import type {
	JournalSummary,
	JournalDetails,
	CalendarDayState,
	EntryDocument,
	CreateJournalDto,
	JournalPrivacy,
	SaveEntryDto,
} from "@/types/journal";
import { Separator } from "@/components/ui/separator";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { EntryEditorCommands } from "@/components/journal/EntryEditor";
import { SettingsDialog } from "@/components/journal/SettingsDialog";

interface JournalWorkspaceProps {
	journals: JournalSummary[];
	activeJournal: JournalDetails;
	calendarDays: CalendarDayState[];
	selectedDate: string;
	currentEntry: EntryDocument | null;
	entryLoading: boolean;
	onSelectDate: (date: string) => Promise<void>;
	onMonthChange: (year: number, month: number) => Promise<void>;
	onOpenJournal: (id: string) => Promise<void>;
	onLockJournal: (id: string) => Promise<void>;
	onRequestCreateJournal: (data: CreateJournalDto) => Promise<void>;
	onSaveEntry: (data: SaveEntryDto) => Promise<void>;
	onDeleteEntry: (date: string) => Promise<void>;
}

export function JournalWorkspace({
	journals,
	activeJournal,
	calendarDays,
	selectedDate,
	currentEntry,
	entryLoading,
	onSelectDate,
	onMonthChange,
	onOpenJournal,
	onLockJournal,
	onRequestCreateJournal,
	onSaveEntry,
	onDeleteEntry,
}: JournalWorkspaceProps) {
	const { t } = useTranslation("journal");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [creating, setCreating] = useState(false);
	const [showShortcuts, setShowShortcuts] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [privacy, setPrivacy] = useState<JournalPrivacy>("public");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [titleRequired, setTitleRequired] = useState(true);
	const [editorCommands, setEditorCommands] = useState<EntryEditorCommands | null>(null);

	const resetCreateForm = () => {
		setName("");
		setDescription("");
		setPrivacy("public");
		setPassword("");
		setConfirmPassword("");
		setTitleRequired(true);
	};

	const handleCreateJournal = async () => {
		if (!name.trim()) return;
		if (privacy === "private" && password !== confirmPassword) return;

		setCreating(true);
		try {
			await onRequestCreateJournal({
				name: name.trim(),
				description: description.trim() || undefined,
				privacy,
				password: privacy === "private" ? password : undefined,
				titleRequired,
			});
			setShowCreateDialog(false);
			resetCreateForm();
		} finally {
			setCreating(false);
		}
	};

	const today = new Date().toISOString().split("T")[0];

	return (
		<SidebarProvider>
			<JournalSidebar
				journals={journals}
				activeJournalId={activeJournal.id}
				calendarDays={calendarDays}
				selectedDate={selectedDate}
				onSelectDate={(date) => onSelectDate(date)}
				onMonthChange={onMonthChange}
				onOpenJournal={(id) => onOpenJournal(id)}
				onLockJournal={(id) => onLockJournal(id)}
				onCreateJournal={() => setShowCreateDialog(true)}
			/>
			<SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
				<header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
					<SidebarTrigger className="text-muted-foreground hover:text-foreground" />
					<Separator orientation="vertical" className="h-4 bg-border/60" />
					<Menubar className="h-8 rounded-lg border-border/60">
						<MenubarMenu>
							<MenubarTrigger>{t("menu.file", "Archivo")}</MenubarTrigger>
							<MenubarContent>
								<MenubarItem onClick={() => setShowCreateDialog(true)}>
									{t("menu.newJournal", "Nuevo diario")}
									<MenubarShortcut>Ctrl+N</MenubarShortcut>
								</MenubarItem>
								<MenubarSub>
									<MenubarSubTrigger>{t("menu.openJournal", "Abrir diario")}</MenubarSubTrigger>
									<MenubarSubContent>
										{journals.map((journal) => (
											<MenubarItem key={journal.id} onClick={() => void onOpenJournal(journal.id)}>
												{journal.name}
											</MenubarItem>
										))}
									</MenubarSubContent>
								</MenubarSub>
								<MenubarSeparator />
								<MenubarItem
									onClick={() => void editorCommands?.save()}
									disabled={!editorCommands?.canSave}
								>
									{t("menu.saveEntry", "Guardar entrada")}
									<MenubarShortcut>Ctrl+S</MenubarShortcut>
								</MenubarItem>
								<MenubarItem
									onClick={() => void editorCommands?.deleteEntry()}
									disabled={!editorCommands?.canDelete}
									variant="destructive"
								>
									{t("menu.deleteEntry", "Eliminar entrada")}
								</MenubarItem>
								<MenubarSeparator />
								<MenubarItem
									onClick={() => void onLockJournal(activeJournal.id)}
									disabled={activeJournal.privacy !== "private"}
								>
									{t("menu.lockJournal", "Bloquear diario")}
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger>{t("menu.edit", "Editar")}</MenubarTrigger>
							<MenubarContent>
								<MenubarItem onClick={() => editorCommands?.undo()} disabled={!editorCommands?.canUndo}>
									{t("menu.undo", "Deshacer")}
									<MenubarShortcut>Ctrl+Z</MenubarShortcut>
								</MenubarItem>
								<MenubarItem onClick={() => editorCommands?.redo()} disabled={!editorCommands?.canRedo}>
									{t("menu.redo", "Rehacer")}
									<MenubarShortcut>Ctrl+Y</MenubarShortcut>
								</MenubarItem>
								<MenubarSeparator />
								<MenubarItem onClick={() => editorCommands?.toggleBold()} disabled={!editorCommands}>
									{t("menu.bold", "Negrita")}
									<MenubarShortcut>Ctrl+B</MenubarShortcut>
								</MenubarItem>
								<MenubarItem onClick={() => editorCommands?.toggleItalic()} disabled={!editorCommands}>
									{t("menu.italic", "Cursiva")}
									<MenubarShortcut>Ctrl+I</MenubarShortcut>
								</MenubarItem>
								<MenubarItem onClick={() => editorCommands?.toggleUnderline()} disabled={!editorCommands}>
									{t("menu.underline", "Subrayado")}
									<MenubarShortcut>Ctrl+U</MenubarShortcut>
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger>{t("menu.journal", "Diario")}</MenubarTrigger>
							<MenubarContent>
								<MenubarItem onClick={() => void onSelectDate(today)}>
									{t("menu.goToday", "Ir a hoy")}
								</MenubarItem>
								<MenubarItem onClick={() => void onOpenJournal(activeJournal.id)}>
									{t("menu.reopenJournal", "Recargar diario activo")}
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger>{t("menu.view", "Ver")}</MenubarTrigger>
							<MenubarContent>
								<MenubarItem onClick={() => setShowSettings(true)}>
									{t("menu.settings", "Configuración")}
									<MenubarShortcut>Ctrl+,</MenubarShortcut>
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>

						<MenubarMenu>
							<MenubarTrigger>{t("menu.help", "Ayuda")}</MenubarTrigger>
							<MenubarContent>
								<MenubarItem onClick={() => setShowShortcuts(true)}>
									{t("menu.shortcuts", "Atajos de teclado")}
								</MenubarItem>
							</MenubarContent>
						</MenubarMenu>
					</Menubar>
					<div className="flex items-center gap-2">
						<BookOpenText className="size-4 text-primary" />
						<h2 className="text-sm font-semibold tracking-tight">{activeJournal.name}</h2>
						{activeJournal.privacy === "private" && (
							<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary">
								Privado
							</span>
						)}
					</div>
				</header>
				<main className="flex-1 overflow-hidden relative">
					<EntryEditor
						journalId={activeJournal.id}
						selectedDate={selectedDate}
						entry={currentEntry}
						loading={entryLoading}
						titleRequired={activeJournal.titleRequired}
						onSave={onSaveEntry}
						onDelete={onDeleteEntry}
						onCommandsChange={setEditorCommands}
					/>
				</main>
			</SidebarInset>

			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-2xl">{t("menu.newJournal", "Nuevo diario")}</DialogTitle>
						<DialogDescription>{t("menu.createJournalDescription", "Crea un diario y empieza a escribir en segundos.")}</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-5 py-2">
						<div className="space-y-2">
							<Label htmlFor="workspace-journal-name">{t("journal.name")}</Label>
							<Input
								id="workspace-journal-name"
								placeholder={t("journal.namePlaceholder")}
								value={name}
								onChange={(event) => setName(event.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="workspace-journal-description">{t("journal.description")}</Label>
							<Textarea
								id="workspace-journal-description"
								placeholder={t("journal.descriptionPlaceholder")}
								value={description}
								onChange={(event) => setDescription(event.target.value)}
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t("journal.privacy")}</Label>
							<Select value={privacy} onValueChange={(value) => setPrivacy(value as JournalPrivacy)}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="public">{t("journal.public")}</SelectItem>
									<SelectItem value="private">{t("journal.private")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{privacy === "private" && (
							<div className="grid gap-3 rounded-md border border-border/60 bg-muted/30 p-3">
								<div className="space-y-2">
									<Label htmlFor="workspace-journal-password">{t("journal.password")}</Label>
									<Input
										id="workspace-journal-password"
										type="password"
										placeholder={t("journal.passwordPlaceholder")}
										value={password}
										onChange={(event) => setPassword(event.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="workspace-journal-confirm">{t("journal.confirmPassword")}</Label>
									<Input
										id="workspace-journal-confirm"
										type="password"
										placeholder={t("journal.passwordPlaceholder")}
										value={confirmPassword}
										onChange={(event) => setConfirmPassword(event.target.value)}
									/>
								</div>
							</div>
						)}
						
						{/* Title Required Option */}
						<div className="border-t border-border/50 pt-4">
							<div className="flex items-start gap-3">
								<Checkbox
									id="title-required"
									checked={titleRequired}
									onCheckedChange={(checked) => setTitleRequired(checked === true)}
									className="mt-1"
								/>
								<div className="flex-1">
									<Label htmlFor="title-required" className="text-sm font-medium cursor-pointer">
										{t("journal.titleRequired", "Título requerido")}
									</Label>
									<p className="text-xs text-muted-foreground mt-1">
										{t("journal.titleRequiredDescription", "Requerir que las entradas tengan un título.")}
									</p>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
							{t("menu.cancel", "Cancelar")}
						</Button>
						<Button
							onClick={() => void handleCreateJournal()}
							disabled={
								creating ||
								!name.trim() ||
								(privacy === "private" && (!password || password !== confirmPassword))
							}
						>
							{creating ? t("menu.creating", "Creando...") : t("journal.create", "Crear diario")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("menu.shortcuts", "Atajos de teclado")}</DialogTitle>
						<DialogDescription>{t("menu.shortcutsDescription", "Combinaciones rápidas para escribir más fluido.")}</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2 text-sm text-muted-foreground">
						<p>Ctrl+S · {t("menu.saveEntry", "Guardar entrada")}</p>
						<p>Ctrl+Z · {t("menu.undo", "Deshacer")}</p>
						<p>Ctrl+Y · {t("menu.redo", "Rehacer")}</p>
						<p>Ctrl+B · {t("menu.bold", "Negrita")}</p>
						<p>Ctrl+I · {t("menu.italic", "Cursiva")}</p>
						<p>Ctrl+U · {t("menu.underline", "Subrayado")}</p>
					</div>
				</DialogContent>
			</Dialog>

			<SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
		</SidebarProvider>
	);
}
