import { AnimatePresence, motion } from "motion/react";
import { useJournal } from "@/hooks/useJournal";
import { WelcomeScreen } from "@/components/journal/WelcomeScreen";
import { UnlockScreen } from "@/components/journal/UnlockScreen";
import { JournalWorkspace } from "@/components/journal/JournalWorkspace";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const viewTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

function App() {
	const journal = useJournal();

	// Dismiss error overlay
	const errorOverlay = journal.error && (
		<div className="fixed inset-x-0 top-4 z-50 mx-auto max-w-md">
			<Alert
				variant="destructive"
				onClick={journal.dismissError}
				className="cursor-pointer"
			>
				<AlertCircle className="size-4" />
				<AlertDescription>{journal.error}</AlertDescription>
			</Alert>
		</div>
	);

	// Resolve the active view once so it can be cross-faded by AnimatePresence.
	let viewKey: string;
	let className: string;
	let content: React.ReactNode;

	if (journal.view === "loading") {
		viewKey = "loading";
		className = "flex min-h-screen items-center justify-center bg-background";
		content = <Spinner className="size-8" />;
	} else if (journal.view === "unlock" && journal.pendingUnlockJournal) {
		viewKey = "unlock";
		className = "min-h-screen bg-background";
		content = (
			<UnlockScreen
				journal={journal.pendingUnlockJournal}
				onUnlock={journal.unlockJournal}
				onBack={journal.cancelUnlock}
			/>
		);
	} else if (journal.view === "workspace" && journal.activeJournal) {
		viewKey = "workspace";
		className = "h-screen overflow-hidden bg-background";
		content = (
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
				onDeleteJournal={journal.deleteJournal}
				onSaveEntry={journal.saveEntry}
				onDeleteEntry={journal.deleteEntry}
			/>
		);
	} else {
		viewKey = "welcome";
		className = "min-h-screen bg-background";
		content = (
			<WelcomeScreen
				journals={journal.journals}
				onCreateJournal={journal.createJournal}
				onOpenJournal={journal.openJournal}
			/>
		);
	}

	return (
		<>
			{errorOverlay}
			<AnimatePresence mode="wait">
				<motion.main
					key={viewKey}
					className={className}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -8 }}
					transition={viewTransition}
				>
					{content}
				</motion.main>
			</AnimatePresence>
		</>
	);
}

export default App;
