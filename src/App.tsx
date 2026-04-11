import { useJournal } from "@/hooks/useJournal";
import { WelcomeScreen } from "@/components/journal/WelcomeScreen";
import { UnlockScreen } from "@/components/journal/UnlockScreen";
import { JournalWorkspace } from "@/components/journal/JournalWorkspace";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function App() {
	const journal = useJournal();

	// Dismiss error overlay
	const errorOverlay = journal.error && (
		<div className="fixed inset-x-0 top-4 z-50 mx-auto max-w-md">
			<Alert variant="destructive" onClick={journal.dismissError} className="cursor-pointer">
				<AlertCircle className="size-4" />
				<AlertDescription>{journal.error}</AlertDescription>
			</Alert>
		</div>
	);

	if (journal.view === "loading") {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background">
				<Spinner className="size-8" />
			</main>
		);
	}

	if (journal.view === "unlock" && journal.pendingUnlockJournal) {
		return (
			<main className="min-h-screen bg-background">
				{errorOverlay}
				<UnlockScreen
					journal={journal.pendingUnlockJournal}
					onUnlock={journal.unlockJournal}
					onBack={() => window.location.reload()}
				/>
			</main>
		);
	}

	if (journal.view === "workspace" && journal.activeJournal) {
		return (
			<main className="min-h-screen bg-background">
				{errorOverlay}
				<JournalWorkspace
					journals={journal.journals}
					activeJournal={journal.activeJournal}
					calendarDays={journal.calendarDays}
					selectedDate={journal.selectedDate}
					currentEntry={journal.currentEntry}
					entryLoading={journal.entryLoading}
					onSelectDate={journal.selectDate}
					onMonthChange={journal.loadMonth}
					onOpenJournal={journal.openJournal}
					onLockJournal={journal.lockJournal}
					onRequestCreateJournal={journal.createJournal}
					onSaveEntry={journal.saveEntry}
					onDeleteEntry={journal.deleteEntry}
				/>
			</main>
		);
	}

	// Default: welcome
	return (
		<main className="min-h-screen bg-background">
			{errorOverlay}
			<WelcomeScreen
				journals={journal.journals}
				onCreateJournal={journal.createJournal}
				onOpenJournal={journal.openJournal}
			/>
		</main>
	);
}

export default App;
