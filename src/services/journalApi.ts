import { sidecar } from "./sidecar";
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
	return sidecar.request<BootstrapResult>("app.bootstrap");
}

export async function setSetting(key: string, value: string): Promise<void> {
	return sidecar.request("app.setSetting", { key, value });
}

export async function getSetting(key: string): Promise<string | null> {
	return sidecar.request<string | null>("app.getSetting", { key });
}

// ── Journal CRUD ──────────────────────────────────────────────────────

export async function listJournals(): Promise<JournalSummary[]> {
	return sidecar.request<JournalSummary[]>("journal.list");
}

export async function createJournal(data: CreateJournalDto): Promise<JournalSummary> {
	return sidecar.request<JournalSummary>(
		"journal.create",
		data as unknown as Record<string, unknown>,
	);
}

export async function openJournal(id: string): Promise<JournalDetails> {
	return sidecar.request<JournalDetails>("journal.open", { id });
}

export async function renameJournal(id: string, name: string): Promise<JournalSummary> {
	return sidecar.request<JournalSummary>("journal.rename", { id, name });
}

export async function deleteJournal(id: string, password?: string): Promise<void> {
	return sidecar.request("journal.delete", { id, password });
}

// ── Unlock / Lock ─────────────────────────────────────────────────────

export async function unlockJournal(id: string, password: string): Promise<JournalSummary> {
	return sidecar.request<JournalSummary>("journal.unlock", { id, password });
}

export async function lockJournal(id: string): Promise<void> {
	return sidecar.request("journal.lock", { id });
}

// ── Entry CRUD ────────────────────────────────────────────────────────

export async function getEntryByDate(
	journalId: string,
	date: string,
): Promise<EntryDocument | null> {
	return sidecar.request<EntryDocument | null>("entry.getByDate", { journalId, date });
}

export async function saveEntry(data: SaveEntryDto): Promise<EntrySummary> {
	return sidecar.request<EntrySummary>(
		"entry.save",
		data as unknown as Record<string, unknown>,
	);
}

export async function deleteEntry(journalId: string, date: string): Promise<void> {
	return sidecar.request("entry.delete", { journalId, date });
}

export async function listMonth(
	journalId: string,
	year: number,
	month: number,
): Promise<CalendarDayState[]> {
	return sidecar.request<CalendarDayState[]>("entry.listMonth", {
		journalId,
		year,
		month,
	});
}
