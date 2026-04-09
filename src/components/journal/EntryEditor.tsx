import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, Trash2 } from "lucide-react";
import type { EntryDocument, SaveEntryDto } from "@/types/journal";

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
	const [content, setContent] = useState("");
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);

	// Sync state when entry changes
	useEffect(() => {
		setTitle(entry?.title ?? "");
		setContent(entry?.content ?? "");
		setDirty(false);
	}, [entry, selectedDate]);

	const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		setDirty(true);
	}, []);

	const handleContentChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setContent(e.target.value);
			setDirty(true);
		},
		[],
	);

	const handleSave = useCallback(async () => {
		if (!title.trim()) return;
		setSaving(true);
		try {
			await onSave({
				journalId,
				date: selectedDate,
				title: title.trim(),
				content,
			});
			setDirty(false);
		} finally {
			setSaving(false);
		}
	}, [journalId, selectedDate, title, content, onSave]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
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
			<div className="flex flex-1 items-center justify-center">
				<div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<div className="flex flex-1 flex-col" onKeyDown={handleKeyDown}>
			{/* Header */}
			<div className="flex items-center justify-between border-b px-6 py-3">
				<div>
					<p className="text-sm font-medium capitalize text-muted-foreground">
						{formattedDate}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{dirty && (
						<span className="text-xs text-muted-foreground">
							{t("entry.save")} (Ctrl+S)
						</span>
					)}
					{saving ? (
						<span className="text-xs text-muted-foreground">
							{t("entry.saving")}
						</span>
					) : (
						!dirty &&
						entry && (
							<span className="text-xs text-green-600">
								{t("entry.saved")}
							</span>
						)
					)}
					<Button
						size="sm"
						onClick={handleSave}
						disabled={saving || !title.trim()}
					>
						<Save className="mr-1 size-4" />
						{t("entry.save")}
					</Button>
					{entry && (
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDelete(selectedDate)}
						>
							<Trash2 className="size-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Entry title */}
			<div className="px-6 pt-4">
				<Input
					value={title}
					onChange={handleTitleChange}
					placeholder={t("entry.titlePlaceholder")}
					className="border-none text-2xl font-bold shadow-none focus-visible:ring-0"
				/>
			</div>

			<Separator className="mx-6 my-2" />

			{/* Editor area — textarea placeholder for Phase 3 TipTap */}
			<div className="flex-1 px-6 pb-6">
				<textarea
					value={content}
					onChange={handleContentChange}
					placeholder={t("entry.editorPlaceholder")}
					className="h-full w-full resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
				/>
			</div>
		</div>
	);
}
