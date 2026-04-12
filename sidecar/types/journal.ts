/**
 * Journal domain types for the sidecar layer.
 * These are the canonical types for persistence and IPC handlers.
 */

/** Privacy mode for a journal */
export type JournalPrivacy = "public" | "private";

/** Summary of a journal for listing (minimal info, safe for locked journals) */
export interface JournalSummary {
	id: string;
	name: string;
	privacy: JournalPrivacy;
	isLocked: boolean;
	entryCount: number;
	createdAt: number;
	updatedAt: number;
}

/** Full journal details (only available when unlocked) */
export interface JournalDetails extends JournalSummary {
	description: string | null;
	titleRequired: boolean;
	storagePath: string;
}

/** Params for journal.create */
export interface CreateJournalParams {
	name: string;
	description?: string;
	privacy: JournalPrivacy;
	password?: string;
	titleRequired?: boolean;
}

/** Params for journal.rename */
export interface RenameJournalParams {
	id: string;
	name: string;
}

/** Params for journal.delete */
export interface DeleteJournalParams {
	id: string;
	password?: string;
}

/** Params for journal.unlock */
export interface UnlockJournalParams {
	id: string;
	password: string;
}

/** Params for journal.lock */
export interface LockJournalParams {
	id: string;
}

/** Params for journal.password.change */
export interface ChangePasswordParams {
	id: string;
	currentPassword: string;
	newPassword: string;
}

/** A single calendar day state (has entry / has draft) */
export interface CalendarDayState {
	date: string;
	hasEntry: boolean;
}

/** Params for entry.getByDate */
export interface GetEntryByDateParams {
	journalId: string;
	date: string;
}

/** Params for entry.save */
export interface SaveEntryParams {
	journalId: string;
	date: string;
	title: string;
	content: string;
}

/** Params for entry.delete */
export interface DeleteEntryParams {
	journalId: string;
	date: string;
}

/** Params for entry.listMonth */
export interface ListMonthParams {
	journalId: string;
	year: number;
	month: number;
}

/** Summary of an entry (metadata only, no body) */
export interface EntrySummary {
	id: string;
	journalId: string;
	date: string;
	title: string;
	contentHash: string;
	createdAt: number;
	updatedAt: number;
}

/** Full entry document (metadata + body) */
export interface EntryDocument extends EntrySummary {
	content: string;
}

/** Result of app.bootstrap */
export interface BootstrapResult {
	lastJournalId: string | null;
	journals: JournalSummary[];
}
