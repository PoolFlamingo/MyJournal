/**
 * Journal domain types for the frontend.
 * Mirrors sidecar types for frontend consumption.
 */

export type JournalPrivacy = "public" | "private";

export interface JournalSummary {
	id: string;
	name: string;
	description?: string | null;
	privacy: JournalPrivacy;
	isLocked: boolean;
	entryCount: number;
	createdAt: number;
	updatedAt: number;
}

export interface JournalDetails extends JournalSummary {
	storagePath: string;
}

export interface CreateJournalDto {
	name: string;
	description?: string;
	privacy: JournalPrivacy;
	password?: string;
}

export interface CalendarDayState {
	date: string;
	hasEntry: boolean;
}

export interface EntrySummary {
	id: string;
	journalId: string;
	date: string;
	title: string;
	contentHash: string;
	createdAt: number;
	updatedAt: number;
}

export interface EntryDocument extends EntrySummary {
	content: string;
}

export interface SaveEntryDto {
	journalId: string;
	date: string;
	title: string;
	content: string;
}

export interface BootstrapResult {
	lastJournalId: string | null;
	journals: JournalSummary[];
}
