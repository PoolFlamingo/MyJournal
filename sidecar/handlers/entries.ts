import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { entries, journals } from "../db/schema";
import type {
  GetEntryByDateParams,
  SaveEntryParams,
  DeleteEntryParams,
  ListMonthParams,
  EntrySummary,
  EntryDocument,
  CalendarDayState,
} from "../types/journal";
import { existsSync, writeFileSync, readFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

function generateId(): string {
  return crypto.randomUUID();
}

function computeHash(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

function toEntrySummary(row: typeof entries.$inferSelect): EntrySummary {
  return {
    id: row.id,
    journalId: row.journalId,
    date: row.date,
    title: row.title,
    contentHash: row.contentHash,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Number(row.updatedAt),
  };
}

function getJournalStoragePath(journalId: string): string | null {
  const journal = db.select().from(journals).where(eq(journals.id, journalId)).get();
  return journal?.storagePath ?? null;
}

function buildEntryFilePath(storagePath: string, date: string): string {
  return join(storagePath, "entries", `${date}.myj`);
}

// ── Entry CRUD ────────────────────────────────────────────────────────

export async function getEntryByDate(params: GetEntryByDateParams): Promise<EntryDocument | null> {
  if (!params.journalId || !params.date) {
    throw new Error("journalId and date are required");
  }

  const entry = db
    .select()
    .from(entries)
    .where(and(eq(entries.journalId, params.journalId), eq(entries.date, params.date)))
    .get();

  if (!entry) return null;

  const storagePath = getJournalStoragePath(params.journalId);
  if (!storagePath) throw new Error("Journal storage path not found");

  const filePath = buildEntryFilePath(storagePath, params.date);

  let content = "";
  if (existsSync(filePath)) {
    content = readFileSync(filePath, "utf-8");
  }

  return {
    ...toEntrySummary(entry),
    content,
  };
}

export async function saveEntry(params: SaveEntryParams): Promise<EntrySummary> {
  if (!params.journalId || !params.date) {
    throw new Error("journalId and date are required");
  }
  if (!params.title?.trim()) {
    throw new Error("Entry title is required");
  }

  const storagePath = getJournalStoragePath(params.journalId);
  if (!storagePath) throw new Error("Journal not found");

  const filePath = buildEntryFilePath(storagePath, params.date);
  const contentHash = computeHash(params.content ?? "");

  // Ensure entries directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Write content to .myj file
  writeFileSync(filePath, params.content ?? "", "utf-8");

  const now = new Date();

  // Upsert: check if entry exists for this journal+date
  const existing = db
    .select()
    .from(entries)
    .where(and(eq(entries.journalId, params.journalId), eq(entries.date, params.date)))
    .get();

  if (existing) {
    db.update(entries)
      .set({
        title: params.title.trim(),
        contentHash,
        updatedAt: now,
      })
      .where(eq(entries.id, existing.id))
      .run();

    const updated = db.select().from(entries).where(eq(entries.id, existing.id)).get();
    return toEntrySummary(updated!);
  }

  const id = generateId();
  const relativeFilePath = `entries/${params.date}.myj`;

  db.insert(entries)
    .values({
      id,
      journalId: params.journalId,
      date: params.date,
      title: params.title.trim(),
      filePath: relativeFilePath,
      contentHash,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const created = db.select().from(entries).where(eq(entries.id, id)).get();
  return toEntrySummary(created!);
}

export async function deleteEntry(params: DeleteEntryParams): Promise<void> {
  if (!params.journalId || !params.date) {
    throw new Error("journalId and date are required");
  }

  const entry = db
    .select()
    .from(entries)
    .where(and(eq(entries.journalId, params.journalId), eq(entries.date, params.date)))
    .get();

  if (!entry) throw new Error(`Entry not found for date ${params.date}`);

  const storagePath = getJournalStoragePath(params.journalId);
  if (storagePath) {
    const filePath = buildEntryFilePath(storagePath, params.date);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  db.delete(entries).where(eq(entries.id, entry.id)).run();
}

export async function listMonth(params: ListMonthParams): Promise<CalendarDayState[]> {
  if (!params.journalId || !params.year || !params.month) {
    throw new Error("journalId, year, and month are required");
  }

  const startDate = `${params.year}-${String(params.month).padStart(2, "0")}-01`;
  const nextMonth = params.month === 12 ? 1 : params.month + 1;
  const nextYear = params.month === 12 ? params.year + 1 : params.year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const monthEntries = db
    .select({ date: entries.date })
    .from(entries)
    .where(
      and(
        eq(entries.journalId, params.journalId),
        gte(entries.date, startDate),
        lt(entries.date, endDate),
      ),
    )
    .all();

  return monthEntries.map((e) => ({
    date: e.date,
    hasEntry: true,
  }));
}
