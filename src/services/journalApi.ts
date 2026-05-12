import { invoke } from "@tauri-apps/api/core";
import type {
	JournalSummary,
	JournalDetails,
	CreateJournalDto,
	BootstrapResult,
	CalendarDayState,
	EntrySummary,
	EntryDocument,
	SaveEntryDto,
} from "@/types/journal";

// ── App lifecycle ─────────────────────────────────────────────────────

export async function appBootstrap(): Promise<BootstrapResult> {
	return invoke<BootstrapResult>("app_bootstrap");
}

export async function setSetting(key: string, value: string): Promise<void> {
	return invoke("app_set_setting", { key, value });
}

export async function getSetting(key: string): Promise<string | null> {
	return invoke<string | null>("app_get_setting", { key });
}

// ── Journal CRUD ──────────────────────────────────────────────────────

export async function listJournals(): Promise<JournalSummary[]> {
	return invoke<JournalSummary[]>("journal_list");
}

export async function createJournal(data: CreateJournalDto): Promise<JournalSummary> {
	return invoke<JournalSummary>("journal_create", { data });
}

export async function openJournal(id: string): Promise<JournalDetails> {
	return invoke<JournalDetails>("journal_open", { id });
}

export async function renameJournal(id: string, name: string): Promise<JournalSummary> {
	return invoke<JournalSummary>("journal_rename", { id, name });
}

export async function deleteJournal(id: string): Promise<void> {
	return invoke("journal_delete", { id });
}

// ── Unlock / Lock ─────────────────────────────────────────────────────

export async function unlockJournal(id: string, password: string): Promise<JournalSummary> {
	return invoke<JournalSummary>("journal_unlock", { id, password });
}

export async function lockJournal(id: string): Promise<void> {
	return invoke("journal_lock", { id });
}

// ── Entry CRUD ────────────────────────────────────────────────────────

export async function getEntryByDate(
	journalId: string,
	date: string,
): Promise<EntryDocument | null> {
	return invoke<EntryDocument | null>("entry_get_by_date", { journalId, date });
}

export async function saveEntry(data: SaveEntryDto): Promise<EntrySummary> {
	return invoke<EntrySummary>("entry_save", { data });
}

export async function deleteEntry(journalId: string, date: string): Promise<void> {
	return invoke("entry_delete", { journalId, date });
}

export async function listMonth(
	journalId: string,
	year: number,
	month: number,
): Promise<CalendarDayState[]> {
	return invoke<CalendarDayState[]>("entry_list_month", { journalId, year, month });
}
