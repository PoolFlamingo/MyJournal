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
}

export function EntryEditor({
	journalId,
	selectedDate,
	entry,
	loading,
	onSave,
	onDelete,
}: EntryEditorProps) {
	const { t } = useTranslation("journal");
	const [title, setTitle] = useState("");
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);

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
		],
		content: "",
		onUpdate: () => {
			setDirty(true);
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
		<div className="flex flex-col h-full bg-background" onKeyDown={handleKeyDown}>
			{/* Top Actions Bar */}
			<div className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur z-20 border-b border-border/40">
				<div className="flex items-center gap-2">
					<div className="flex h-8 items-center rounded-lg bg-muted/50 px-3 border border-border/50">
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
					<div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl">
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
							className="h-8 rounded-lg font-medium tracking-wide"
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

			<div className="flex-1 overflow-y-auto w-full mx-auto pb-32">
				<div className="mx-auto max-w-3xl w-full px-6 md:px-12 mt-12 transition-all">
					{/* Title Input as Auto-resizing Textarea */}
					<TextareaAutosize
						value={title}
						onChange={handleTitleChange}
						placeholder={t("entry.titlePlaceholder", "Título de hoy...")}
						className="w-full resize-none border-none bg-transparent p-0 text-4xl font-extrabold tracking-tight text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 sm:text-5xl"
						minRows={1}
					/>

					{/* Formatting toolbar floating/sticky */}
					<div className="sticky top-0 z-30 -mx-2 mt-8 mb-4">
						<div className="rounded-xl border border-border/50 bg-background/95 p-1 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60">
							{editor && <EditorToolbar editor={editor} />}
						</div>
					</div>

					{/* TipTap rich text editor content */}
					<div className="mt-4">
						<EditorContent editor={editor} />
					</div>
				</div>
			</div>
		</div>
	);
}
