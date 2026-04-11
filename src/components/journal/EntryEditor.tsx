import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CharacterCount from "@tiptap/extension-character-count";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { createLowlight, common } from "lowlight";
import { Button } from "@/components/ui/button";
import { Save, Trash2, CalendarHeart, Loader2 } from "lucide-react";
import type { EntryDocument, SaveEntryDto } from "@/types/journal";
import { EditorToolbar } from "./EditorToolbar";
import TextareaAutosize from "react-textarea-autosize";

const lowlight = createLowlight(common);

function parseContent(content: string): object | string {
	if (!content) return "";
	try {
		return JSON.parse(content) as object;
	} catch {
		// Legacy plain-text fallback
		return content;
	}
}

interface EntryEditorProps {
	journalId: string;
	selectedDate: string;
	entry: EntryDocument | null;
	loading: boolean;
	onSave: (data: SaveEntryDto) => Promise<void>;
	onDelete: (date: string) => Promise<void>;
	onCommandsChange?: (commands: EntryEditorCommands) => void;
}

export interface EntryEditorCommands {
	save: () => Promise<void>;
	deleteEntry: () => Promise<void>;
	undo: () => void;
	redo: () => void;
	toggleBold: () => void;
	toggleItalic: () => void;
	toggleUnderline: () => void;
	canUndo: boolean;
	canRedo: boolean;
	canSave: boolean;
	canDelete: boolean;
}

export function EntryEditor({
	journalId,
	selectedDate,
	entry,
	loading,
	onSave,
	onDelete,
	onCommandsChange,
}: EntryEditorProps) {
	const { t } = useTranslation("journal");
	const [title, setTitle] = useState("");
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [editorEpoch, setEditorEpoch] = useState(0);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({ codeBlock: false }),
			Underline,
			Link.configure({ openOnClick: false }),
			Image,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Highlight,
			Placeholder.configure({ placeholder: t("entry.editorPlaceholder", "Empieza a escribir...") }),
			TaskList,
			TaskItem.configure({ nested: true }),
			CodeBlockLowlight.configure({ lowlight }),
			CharacterCount,
			Table.configure({ resizable: true }),
			TableRow,
			TableHeader,
			TableCell,
		],
		content: "",
		onUpdate: () => {
			setDirty(true);
			setEditorEpoch((prev) => prev + 1);
		},
		onSelectionUpdate: () => {
			setEditorEpoch((prev) => prev + 1);
		},
		editorProps: {
			attributes: {
				class: "prose prose-slate dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold prose-a:text-primary max-w-none focus:outline-none min-h-[400px]",
			},
		}
	});

	// Sync editor content + title when entry/date changes
	useEffect(() => {
		setTitle(entry?.title ?? "");
		setDirty(false);
		if (editor) {
			editor.commands.setContent(parseContent(entry?.content ?? ""), false);
		}
	}, [entry, selectedDate, editor]);

	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setTitle(e.target.value);
		setDirty(true);
	}, []);

	const handleSave = useCallback(async () => {
		// Allow saving empty titles if there is content, or empty content if there is title
		const hasContent = editor && !editor.isEmpty;
		const hasTitle = title.trim().length > 0;
		if (!hasTitle && !hasContent) return;

		setSaving(true);
		try {
			await onSave({
				journalId,
				date: selectedDate,
				title: title.trim(),
				content: JSON.stringify(editor?.getJSON() || {}),
			});
			setDirty(false);
		} finally {
			setSaving(false);
		}
	}, [journalId, selectedDate, title, editor, onSave]);

	useEffect(() => {
		if (!onCommandsChange) return;

		const canUndo = editor ? editor.can().chain().focus().undo().run() : false;
		const canRedo = editor ? editor.can().chain().focus().redo().run() : false;
		const hasContent = editor ? !editor.isEmpty : false;
		const hasTitle = title.trim().length > 0;

		onCommandsChange({
			save: handleSave,
			deleteEntry: async () => {
				if (!entry) return;
				await onDelete(selectedDate);
			},
			undo: () => {
				editor?.chain().focus().undo().run();
			},
			redo: () => {
				editor?.chain().focus().redo().run();
			},
			toggleBold: () => {
				editor?.chain().focus().toggleBold().run();
			},
			toggleItalic: () => {
				editor?.chain().focus().toggleItalic().run();
			},
			toggleUnderline: () => {
				editor?.chain().focus().toggleUnderline().run();
			},
			canUndo,
			canRedo,
			canSave: !saving && (hasTitle || hasContent),
			canDelete: Boolean(entry),
		});
	}, [
		editor,
		editorEpoch,
		entry,
		handleSave,
		onCommandsChange,
		onDelete,
		selectedDate,
		saving,
		title,
	]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				void handleSave();
			}
		},
		[handleSave],
	);

	const formattedDate = new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	if (loading) {
		return (
			<div className="flex absolute inset-0 items-center justify-center bg-background/50 backdrop-blur-sm z-10">
				<div className="flex flex-col items-center gap-4 text-primary">
					<Loader2 className="size-10 animate-spin text-primary" />
					<p className="text-sm font-medium animate-pulse">{t("common.loading", "Cargando...")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-background overflow-hidden" onKeyDown={handleKeyDown}>
			{/* Top Actions Bar */}
			<div className="flex items-center justify-between px-6 py-4 bg-background z-20">
				<div className="flex items-center gap-2">
					<div className="flex h-8 items-center rounded-lg bg-muted/30 px-3 border border-border/40">
						<CalendarHeart className="mr-2 size-4 text-primary" />
						<span className="text-sm font-medium capitalize text-muted-foreground tracking-tight">
							{formattedDate}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					{dirty ? (
						<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 hidden sm:inline-block">
							{t("entry.save", "Sin guardar (Ctrl+S)")}
						</span>
					) : (
						entry && (
							<span className="text-xs font-semibold uppercase tracking-wider text-emerald-500/80 hidden sm:inline-block">
								{t("entry.saved", "Guardado")}
							</span>
						)
					)}
					<div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl">
						{entry && (
							<Button
								size="sm"
								variant="ghost"
								onClick={() => void onDelete(selectedDate)}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								title={t("entry.delete", "Eliminar entrada")}
							>
								<Trash2 className="size-4" />
							</Button>
						)}
						<Button
							size="sm"
							onClick={() => void handleSave()}
							disabled={saving || (!title.trim() && (!editor || editor.isEmpty))}
							className="h-8 rounded-lg font-medium tracking-wide shadow-sm"
						>
							{saving ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<Save className="mr-2 size-4" />
							)}
							{saving ? t("entry.saving", "Guardando...") : t("entry.saveBtn", "Guardar")}
						</Button>
					</div>
				</div>
			</div>

			{/* Main Editor Container with Border */}
			<div className="flex-1 px-8 pb-8 overflow-y-auto">
				<div className="mx-auto max-w-4xl min-h-full flex flex-col bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden ring-1 ring-border/5">
					{editor && (
						<div className="border-b border-border/40 bg-muted/10">
							<EditorToolbar editor={editor} />
						</div>
					)}
					
					<div className="flex flex-col flex-1 p-8 md:p-12">
						<TextareaAutosize
							placeholder={t("entry.titlePlaceholder", "¿Qué quieres escribir hoy?")}
							value={title}
							onChange={handleTitleChange}
							className="w-full bg-transparent border-none text-4xl md:text-5xl font-extrabold focus:outline-none placeholder:text-muted-foreground/20 mb-8 resize-none leading-tight tracking-tight"
						/>
						
						<div className="flex-1">
							<EditorContent editor={editor} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
