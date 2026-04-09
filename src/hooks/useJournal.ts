import { useState, useEffect, useCallback, useRef } from "react";
import { sidecar } from "@/services/sidecar";
import * as journalApi from "@/services/journalApi";
import type {
	JournalSummary,
	JournalDetails,
	CreateJournalDto,
	CalendarDayState,
	EntryDocument,
	SaveEntryDto,
} from "@/types/journal";

export type AppView = "loading" | "welcome" | "unlock" | "workspace";

export interface UseJournalReturn {
	// App state
	view: AppView;
	loading: boolean;
	error: string | null;
	// Journals
	journals: JournalSummary[];
	activeJournal: JournalDetails | null;
	// Calendar
	calendarDays: CalendarDayState[];
	selectedDate: string;
	// Entry
	currentEntry: EntryDocument | null;
	entryLoading: boolean;
	// Journal requiring unlock
	pendingUnlockJournal: JournalSummary | null;
	// Actions
	createJournal: (data: CreateJournalDto) => Promise<void>;
	openJournal: (id: string) => Promise<void>;
	deleteJournal: (id: string) => Promise<void>;
	renameJournal: (id: string, name: string) => Promise<void>;
	unlockJournal: (id: string, password: string) => Promise<void>;
	lockJournal: (id: string) => Promise<void>;
	selectDate: (date: string) => Promise<void>;
	loadMonth: (year: number, month: number) => Promise<void>;
	saveEntry: (data: SaveEntryDto) => Promise<void>;
	deleteEntry: (date: string) => Promise<void>;
	dismissError: () => void;
}

export function useJournal(): UseJournalReturn {
	const mountedRef = useRef(true);
	const [view, setView] = useState<AppView>("loading");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [journals, setJournals] = useState<JournalSummary[]>([]);
	const [activeJournal, setActiveJournal] = useState<JournalDetails | null>(null);
	const [calendarDays, setCalendarDays] = useState<CalendarDayState[]>([]);
	const [selectedDate, setSelectedDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [currentEntry, setCurrentEntry] = useState<EntryDocument | null>(null);
	const [entryLoading, setEntryLoading] = useState(false);
	const [pendingUnlockJournal, setPendingUnlockJournal] = useState<JournalSummary | null>(null);

	// ── Bootstrap ───────────────────────────────────────────────────
	useEffect(() => {
		mountedRef.current = true;

		async function init() {
			try {
				await sidecar.init();
				if (!mountedRef.current) return;

				const result = await journalApi.appBootstrap();
				if (!mountedRef.current) return;

				setJournals(result.journals);

				if (result.journals.length === 0) {
					setView("welcome");
					setLoading(false);
					return;
				}

				// Try to open last journal
				if (result.lastJournalId) {
					const lastJournal = result.journals.find(
						(j) => j.id === result.lastJournalId,
					);
					if (lastJournal) {
						if (lastJournal.privacy === "private" && lastJournal.isLocked) {
							setPendingUnlockJournal(lastJournal);
							setView("unlock");
							setLoading(false);
							return;
						}
						try {
							const details = await journalApi.openJournal(lastJournal.id);
							if (!mountedRef.current) return;
							setActiveJournal(details);
							setView("workspace");
						} catch {
							setView("welcome");
						}
					} else {
						setView("welcome");
					}
				} else {
					setView("welcome");
				}

				setLoading(false);
			} catch (err) {
				if (!mountedRef.current) return;
				setError(err instanceof Error ? err.message : "Bootstrap failed");
				setView("welcome");
				setLoading(false);
			}
		}

		init();

		return () => {
			mountedRef.current = false;
			sidecar.destroy();
		};
	}, []);

	// ── Load month entries when active journal or date changes ──────
	const loadMonth = useCallback(
		async (year: number, month: number) => {
			if (!activeJournal) return;
			try {
				const days = await journalApi.listMonth(activeJournal.id, year, month);
				if (mountedRef.current) setCalendarDays(days);
			} catch (err) {
				console.error("Failed to load month:", err);
			}
		},
		[activeJournal],
	);

	// Load current month when journal opens
	useEffect(() => {
		if (!activeJournal) return;
		const now = new Date();
		loadMonth(now.getFullYear(), now.getMonth() + 1);
	}, [activeJournal, loadMonth]);

	// Load entry when date changes
	useEffect(() => {
		if (!activeJournal || !selectedDate) return;

		let cancelled = false;
		setEntryLoading(true);

		journalApi
			.getEntryByDate(activeJournal.id, selectedDate)
			.then((entry) => {
				if (!cancelled && mountedRef.current) {
					setCurrentEntry(entry);
					setEntryLoading(false);
				}
			})
			.catch((err) => {
				if (!cancelled && mountedRef.current) {
					console.error("Failed to load entry:", err);
					setCurrentEntry(null);
					setEntryLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [activeJournal, selectedDate]);

	// ── Actions ─────────────────────────────────────────────────────

	const createJournalAction = useCallback(async (data: CreateJournalDto) => {
		try {
			const created = await journalApi.createJournal(data);
			if (!mountedRef.current) return;

			const details = await journalApi.openJournal(created.id);
			if (!mountedRef.current) return;

			setJournals((prev) => [...prev, created]);
			setActiveJournal(details);
			setView("workspace");
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Failed to create journal");
			}
		}
	}, []);

	const openJournalAction = useCallback(async (id: string) => {
		try {
			const journal = journals.find((j) => j.id === id);
			if (journal?.privacy === "private" && journal.isLocked) {
				setPendingUnlockJournal(journal);
				setView("unlock");
				return;
			}

			const details = await journalApi.openJournal(id);
			if (!mountedRef.current) return;

			setActiveJournal(details);
			setView("workspace");
			setSelectedDate(new Date().toISOString().split("T")[0]);
		} catch (err) {
			if (mountedRef.current) {
				if (err instanceof Error && err.message === "JOURNAL_LOCKED") {
					const journal = journals.find((j) => j.id === id);
					if (journal) {
						setPendingUnlockJournal(journal);
						setView("unlock");
						return;
					}
				}
				setError(err instanceof Error ? err.message : "Failed to open journal");
			}
		}
	}, [journals]);

	const deleteJournalAction = useCallback(async (id: string) => {
		try {
			await journalApi.deleteJournal(id);
			if (!mountedRef.current) return;

			setJournals((prev) => prev.filter((j) => j.id !== id));
			if (activeJournal?.id === id) {
				setActiveJournal(null);
				setCurrentEntry(null);
				setCalendarDays([]);
				setView("welcome");
			}
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Failed to delete journal");
			}
		}
	}, [activeJournal]);

	const renameJournalAction = useCallback(async (id: string, name: string) => {
		try {
			const updated = await journalApi.renameJournal(id, name);
			if (!mountedRef.current) return;

			setJournals((prev) => prev.map((j) => (j.id === id ? updated : j)));
			if (activeJournal?.id === id) {
				setActiveJournal((prev) => (prev ? { ...prev, name: updated.name } : null));
			}
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Failed to rename journal");
			}
		}
	}, [activeJournal]);

	const unlockJournalAction = useCallback(async (id: string, password: string) => {
		try {
			await journalApi.unlockJournal(id, password);
			if (!mountedRef.current) return;

			const details = await journalApi.openJournal(id);
			if (!mountedRef.current) return;

			setJournals((prev) =>
				prev.map((j) => (j.id === id ? { ...j, isLocked: false } : j)),
			);
			setActiveJournal(details);
			setPendingUnlockJournal(null);
			setView("workspace");
			setSelectedDate(new Date().toISOString().split("T")[0]);
		} catch (err) {
			if (mountedRef.current) {
				throw err;
			}
		}
	}, []);

	const lockJournalAction = useCallback(async (id: string) => {
		try {
			await journalApi.lockJournal(id);
			if (!mountedRef.current) return;

			setJournals((prev) =>
				prev.map((j) => (j.id === id ? { ...j, isLocked: true } : j)),
			);
			if (activeJournal?.id === id) {
				setActiveJournal(null);
				setCurrentEntry(null);
				setCalendarDays([]);
				setView("welcome");
			}
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Failed to lock journal");
			}
		}
	}, [activeJournal]);

	const selectDateAction = useCallback(
		async (date: string) => {
			setSelectedDate(date);
		},
		[],
	);

	const saveEntryAction = useCallback(
		async (data: SaveEntryDto) => {
			try {
				const saved = await journalApi.saveEntry(data);
				if (!mountedRef.current) return;

				// Reload entry
				const entry = await journalApi.getEntryByDate(data.journalId, data.date);
				if (mountedRef.current) setCurrentEntry(entry);

				// Update calendar if this is a new entry
				setCalendarDays((prev) => {
					if (prev.some((d) => d.date === data.date)) return prev;
					return [...prev, { date: data.date, hasEntry: true }];
				});

				// Update journal entry count
				setJournals((prev) =>
					prev.map((j) =>
						j.id === data.journalId
							? { ...j, entryCount: j.entryCount + (saved ? 1 : 0) }
							: j,
					),
				);
			} catch (err) {
				if (mountedRef.current) {
					setError(err instanceof Error ? err.message : "Failed to save entry");
				}
			}
		},
		[],
	);

	const deleteEntryAction = useCallback(
		async (date: string) => {
			if (!activeJournal) return;
			try {
				await journalApi.deleteEntry(activeJournal.id, date);
				if (!mountedRef.current) return;

				if (selectedDate === date) setCurrentEntry(null);
				setCalendarDays((prev) => prev.filter((d) => d.date !== date));
			} catch (err) {
				if (mountedRef.current) {
					setError(err instanceof Error ? err.message : "Failed to delete entry");
				}
			}
		},
		[activeJournal, selectedDate],
	);

	const dismissError = useCallback(() => setError(null), []);

	return {
		view,
		loading,
		error,
		journals,
		activeJournal,
		calendarDays,
		selectedDate,
		currentEntry,
		entryLoading,
		pendingUnlockJournal,
		createJournal: createJournalAction,
		openJournal: openJournalAction,
		deleteJournal: deleteJournalAction,
		renameJournal: renameJournalAction,
		unlockJournal: unlockJournalAction,
		lockJournal: lockJournalAction,
		selectDate: selectDateAction,
		loadMonth,
		saveEntry: saveEntryAction,
		deleteEntry: deleteEntryAction,
		dismissError,
	};
}
