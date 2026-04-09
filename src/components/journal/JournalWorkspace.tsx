import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { JournalSidebar } from "@/components/journal/JournalSidebar";
import { EntryEditor } from "@/components/journal/EntryEditor";
import type {
	JournalSummary,
	JournalDetails,
	CalendarDayState,
	EntryDocument,
	SaveEntryDto,
} from "@/types/journal";

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
			<SidebarInset>
				<header className="flex items-center gap-2 border-b px-4 py-2">
					<SidebarTrigger />
					<h2 className="text-sm font-semibold">{activeJournal.name}</h2>
				</header>
				<EntryEditor
					journalId={activeJournal.id}
					selectedDate={selectedDate}
					entry={currentEntry}
					loading={entryLoading}
					onSave={onSaveEntry}
					onDelete={onDeleteEntry}
				/>
			</SidebarInset>
		</SidebarProvider>
	);
}
