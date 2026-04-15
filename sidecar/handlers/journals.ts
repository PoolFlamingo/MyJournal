import { eq, and, gte, lt } from "drizzle-orm";
import { db } from "../db";
import { journals, entries, appSettings } from "../db/schema";
import type {
  CreateJournalParams,
  RenameJournalParams,
  DeleteJournalParams,
  UnlockJournalParams,
  LockJournalParams,
  JournalSummary,
  JournalDetails,
  BootstrapResult,
} from "../types/journal";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * In-memory set of unlocked journal IDs for the current session.
 * Private journals must be unlocked before their entries are accessible.
 */
const unlockedJournals = new Set<string>();

function generateId(): string {
  return crypto.randomUUID();
}

function getDataDir(): string {
  return process.argv[2]?.replace(/[/\\][^/\\]+$/, "") ?? ".";
}

function getJournalStoragePath(journalId: string): string {
  return join(getDataDir(), "journals", journalId);
}

function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function countEntries(journalId: string): number {
  const result = db
    .select()
    .from(entries)
    .where(eq(entries.journalId, journalId))
    .all();
  return result.length;
}

function toJournalSummary(row: typeof journals.$inferSelect): JournalSummary {
  return {
    id: row.id,
    name: row.name,
    privacy: row.privacy as JournalSummary["privacy"],
    isLocked: row.privacy === "private" && !unlockedJournals.has(row.id),
    entryCount: countEntries(row.id),
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Number(row.updatedAt),
  };
}

// ── App bootstrap ─────────────────────────────────────────────────────

export async function bootstrap(): Promise<BootstrapResult> {
  const allJournals = db.select().from(journals).all();
  const lastSetting = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "lastJournalId"))
    .get();

  return {
    lastJournalId: lastSetting?.value ?? null,
    journals: allJournals.map(toJournalSummary),
  };
}

export async function setSetting(params: { key: string; value: string }): Promise<void> {
  if (!params.key?.trim()) throw new Error("Setting key is required");

  db.insert(appSettings)
    .values({ key: params.key, value: params.value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: params.value },
    })
    .run();
}

export async function getSetting(params: { key: string }): Promise<string | null> {
  const result = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, params.key))
    .get();
  return result?.value ?? null;
}

// ── Journal CRUD ──────────────────────────────────────────────────────

export async function listJournals(): Promise<JournalSummary[]> {
  const all = db.select().from(journals).all();
  return all.map(toJournalSummary);
}

export async function createJournal(params: CreateJournalParams): Promise<JournalSummary> {
  if (!params.name?.trim()) throw new Error("Journal name is required");

  if (params.privacy === "private" && !params.password?.trim()) {
    throw new Error("Password is required for private journals");
  }

  const id = generateId();
  const storagePath = getJournalStoragePath(id);
  ensureDirectory(storagePath);
  ensureDirectory(join(storagePath, "entries"));
  ensureDirectory(join(storagePath, "assets"));

  const now = new Date();

  // TODO: Phase 4 — implement Argon2id hashing + key wrapping for private journals
  const passwordHash = params.privacy === "private" ? params.password : null;

  db.insert(journals)
    .values({
      id,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      privacy: params.privacy,
      passwordHash,
      wrappedKey: null,
      keySalt: null,
      titleRequired: params.titleRequired !== false,
      storagePath,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // If private, auto-unlock it for this session
  if (params.privacy === "private") {
    unlockedJournals.add(id);
  }

  // Set as last opened journal
  await setSetting({ key: "lastJournalId", value: id });

  const created = db.select().from(journals).where(eq(journals.id, id)).get();
  return toJournalSummary(created!);
}

export async function openJournal(params: { id: string }): Promise<JournalDetails> {
  const journal = db.select().from(journals).where(eq(journals.id, params.id)).get();
  if (!journal) throw new Error(`Journal not found: ${params.id}`);

  if (journal.privacy === "private" && !unlockedJournals.has(journal.id)) {
    throw new Error("JOURNAL_LOCKED");
  }

  await setSetting({ key: "lastJournalId", value: journal.id });

  return {
    ...toJournalSummary(journal),
    description: journal.description,
    titleRequired: journal.titleRequired,
    storagePath: journal.storagePath,
  };
}

export async function renameJournal(params: RenameJournalParams): Promise<JournalSummary> {
  if (!params.name?.trim()) throw new Error("Journal name is required");

  const journal = db.select().from(journals).where(eq(journals.id, params.id)).get();
  if (!journal) throw new Error(`Journal not found: ${params.id}`);

  db.update(journals)
    .set({ name: params.name.trim(), updatedAt: new Date() })
    .where(eq(journals.id, params.id))
    .run();

  const updated = db.select().from(journals).where(eq(journals.id, params.id)).get();
  return toJournalSummary(updated!);
}

export async function deleteJournal(params: DeleteJournalParams): Promise<void> {
  const journal = db.select().from(journals).where(eq(journals.id, params.id)).get();
  if (!journal) throw new Error(`Journal not found: ${params.id}`);

  // TODO: Phase 4 — verify password for private journals before deletion

  // Delete all entries from DB (cascade should handle it, but be explicit)
  db.delete(entries).where(eq(entries.journalId, params.id)).run();

  // Delete journal record
  db.delete(journals).where(eq(journals.id, params.id)).run();
  unlockedJournals.delete(params.id);

  // Delete journal storage directory and all files
  if (journal.storagePath && existsSync(journal.storagePath)) {
    rmSync(journal.storagePath, { recursive: true, force: true });
  }

  // If this was the last opened journal, clear the setting
  const lastSetting = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "lastJournalId"))
    .get();
  if (lastSetting?.value === params.id) {
    db.delete(appSettings).where(eq(appSettings.key, "lastJournalId")).run();
  }
}

// ── Unlock / Lock ─────────────────────────────────────────────────────

export async function unlockJournal(params: UnlockJournalParams): Promise<JournalSummary> {
  const journal = db.select().from(journals).where(eq(journals.id, params.id)).get();
  if (!journal) throw new Error(`Journal not found: ${params.id}`);

  if (journal.privacy !== "private") {
    throw new Error("Journal is not private");
  }

  // TODO: Phase 4 — verify against Argon2id hash instead of plaintext
  if (journal.passwordHash !== params.password) {
    throw new Error("INVALID_PASSWORD");
  }

  unlockedJournals.add(params.id);
  return toJournalSummary(journal);
}

export async function lockJournal(params: LockJournalParams): Promise<void> {
  unlockedJournals.delete(params.id);
}
