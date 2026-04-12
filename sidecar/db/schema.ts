import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ── Legacy TODO (preserved for migration safety) ──────────────────────

export const todos = sqliteTable("todos", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull(),
	description: text("description"),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

// ── Journal domain ────────────────────────────────────────────────────

export const journals = sqliteTable("journals", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	privacy: text("privacy", { enum: ["public", "private"] })
		.notNull()
		.default("public"),
	/** Argon2id hash of the user-facing password (private journals only) */
	passwordHash: text("password_hash"),
	/** Wrapped master key, encrypted with key derived from password (private only) */
	wrappedKey: text("wrapped_key"),
	/** Salt used for key derivation (private only) */
	keySalt: text("key_salt"),
	/** Whether entry titles are required in this journal */
	titleRequired: integer("title_required", { mode: "boolean" })
		.notNull()
		.default(true),
	storagePath: text("storage_path").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Journal = typeof journals.$inferSelect;
export type NewJournal = typeof journals.$inferInsert;

export const entries = sqliteTable("entries", {
	id: text("id").primaryKey(),
	journalId: text("journal_id")
		.notNull()
		.references(() => journals.id, { onDelete: "cascade" }),
	/** Calendar date as ISO string YYYY-MM-DD */
	date: text("date").notNull(),
	title: text("title").notNull(),
	/** Relative path to .myj file within journal storage */
	filePath: text("file_path").notNull(),
	/** SHA-256 hash of file content for integrity checks */
	contentHash: text("content_hash").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

export const tags = sqliteTable("tags", {
	id: text("id").primaryKey(),
	journalId: text("journal_id")
		.notNull()
		.references(() => journals.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
});

export type Tag = typeof tags.$inferSelect;

export const entryTags = sqliteTable("entry_tags", {
	entryId: text("entry_id")
		.notNull()
		.references(() => entries.id, { onDelete: "cascade" }),
	tagId: text("tag_id")
		.notNull()
		.references(() => tags.id, { onDelete: "cascade" }),
});

/** App-level settings stored in the global database */
export const appSettings = sqliteTable("app_settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});
