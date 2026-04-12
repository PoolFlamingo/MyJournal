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
import { Save, Trash2, CalendarHeart, Loader2, Edit2 } from "lucide-react";
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

function renderReadOnlyContent(content: string): React.ReactNode {
	if (!content) return null;
	try {
		const parsed = JSON.parse(content) as any;
		if (!parsed.content || !Array.isArray(parsed.content)) {
			return <p className="text-foreground">{content}</p>;
		}

		return parsed.content.map((node: any, idx: number) => {
			if (node.type === "paragraph") {
				const text = node.content?.map((mark: any) => mark.text).join("") || "";
				return (
					<p key={idx} className="mb-4 text-foreground">
						{text}
					</p>
				);
			}
			if (node.type === "heading") {
				const level = (node.attrs?.level || 2) as number;
				const text = node.content?.map((mark: any) => mark.text).join("") || "";
				const classMap: Record<number, string> = {
					1: "text-2xl font-bold mb-4",
					2: "text-xl font-bold mb-3",
					3: "text-lg font-bold mb-3",
				};
				const className = classMap[level] || "text-lg font-bold mb-3";
				return (
					<div key={idx} className={className}>
						{text}
					</div>
				);
			}
			if (node.type === "bulletList" || node.type === "orderedList") {
				const isOrdered = node.type === "orderedList";
				return (
					<ul key={idx} className={`mb-4 ${isOrdered ? "list-decimal" : "list-disc"} list-inside text-foreground`}>
						{node.content?.map((item: any, i: number) => (
							<li key={i} className="mb-1">
								{item.content?.map((mark: any) => mark.text).join("")}
							</li>
						))}
					</ul>
				);
			}
			if (node.type === "blockquote") {
				const text = node.content?.map((para: any) => para.content?.map((mark: any) => mark.text).join("")).join(" ") || "";
				return (
					<blockquote key={idx} className="mb-4 border-l-4 border-primary pl-4 italic text-muted-foreground">
						{text}
					</blockquote>
				);
			}
			if (node.type === "codeBlock") {
				const text = node.content?.map((mark: any) => mark.text).join("") || "";
				return (
					<pre key={idx} className="mb-4 bg-muted p-4 rounded overflow-auto text-sm">
						<code className="text-foreground">{text}</code>
					</pre>
				);
			}
			return null;
		});
	} catch {
		return <p className="text-foreground">{content}</p>;
	}
}

interface EntryEditorProps {
	journalId: string;
	selectedDate: string;
	entry: EntryDocument | null;
	loading: boolean;
	titleRequired: boolean;
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
	titleRequired,
	onSave,
	onDelete,
	onCommandsChange,
}: EntryEditorProps) {
	const { t } = useTranslation("journal");
	const [title, setTitle] = useState("");
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [editorEpoch, setEditorEpoch] = useState(0);
	const [isEditMode, setIsEditMode] = useState(!entry); // Start in edit mode only if new entry

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
		setIsEditMode(!entry); // Start in edit mode only if new entry
		if (editor) {
			editor.commands.setContent(parseContent(entry?.content ?? ""), false);
		}
	}, [entry, selectedDate, editor]);

	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setTitle(e.target.value);
		setDirty(true);
	}, []);

	const handleSave = useCallback(async () => {
		// Validate title requirement
		const hasContent = editor && !editor.isEmpty;
		const hasTitle = title.trim().length > 0;
		
		if (titleRequired && !hasTitle) return; // Title is required
		if (!hasTitle && !hasContent) return; // Must have either title or content

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
	}, [journalId, selectedDate, title, editor, onSave, titleRequired]);

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
		<div className="flex flex-col h-full bg-background overflow-hidden" onKeyDown={isEditMode ? handleKeyDown : undefined}>
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
					{isEditMode ? (
						<>
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
									disabled={saving || (titleRequired ? !title.trim() : !title.trim() && (!editor || editor.isEmpty))}
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
						</>
					) : (
						<div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl">
							<Button
								size="sm"
								variant="ghost"
								onClick={() => void onDelete(selectedDate)}
								className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
								title={t("entry.delete", "Eliminar entrada")}
							>
								<Trash2 className="size-4" />
							</Button>
							<Button
								size="sm"
								onClick={() => setIsEditMode(true)}
								className="h-8 rounded-lg font-medium tracking-wide shadow-sm"
							>
								<Edit2 className="mr-2 size-4" />
								{t("entry.edit", "Editar")}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 px-8 pb-8 overflow-y-auto">
				<div className="mx-auto max-w-4xl min-h-full flex flex-col bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden ring-1 ring-border/5">
					{isEditMode ? (
						<>
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
						</>
					) : (
						// Read-only view
						<div className="flex flex-col flex-1 p-8 md:p-12">
							<h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-foreground leading-tight tracking-tight">
								{title || t("entry.noTitle", "Sin título")}
							</h1>
							
							<div className="flex-1">
								{entry?.content ? renderReadOnlyContent(entry.content) : <p className="text-muted-foreground">{t("entry.noEntry", "No hay contenido")}</p>}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
