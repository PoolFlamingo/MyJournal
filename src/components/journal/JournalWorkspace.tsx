import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { JournalSidebar } from "@/components/journal/JournalSidebar";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { BookOpenText } from "lucide-react";
import type {
	JournalSummary,
	JournalDetails,
	CalendarDayState,
	EntryDocument,
	SaveEntryDto,
} from "@/types/journal";
import { Separator } from "@/components/ui/separator";

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
	onRequestCreateJournal: () => void;
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
				onCreateJournal={onRequestCreateJournal}
			/>
			<SidebarInset className="bg-background flex flex-col h-screen overflow-hidden">
				<header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
					<SidebarTrigger className="text-muted-foreground hover:text-foreground" />
					<Separator orientation="vertical" className="h-4 bg-border/60" />
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
						onSave={onSaveEntry}
						onDelete={onDeleteEntry}
					/>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
