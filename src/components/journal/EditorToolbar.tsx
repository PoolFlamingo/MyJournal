import { useCallback, useState } from "react";
import { type Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FontPicker } from "./FontPicker";
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Heading1,
	Heading2,
	Heading3,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	List,
	ListOrdered,
	ListChecks,
	Quote,
	Code,
	Code2,
	Minus,
	Link2,
	Image,
	Highlighter,
	Undo2,
	Redo2,
	Table,
	Unlink,
} from "lucide-react";

interface ToolbarButtonProps {
	action: () => void;
	active: boolean;
	title: string;
	icon: React.ReactNode;
	disabled?: boolean;
}

function ToolbarButton({ action, active, title, icon, disabled }: ToolbarButtonProps) {
	return (
		<Button
			type="button"
			variant={active ? "secondary" : "ghost"}
			size="icon"
			className="size-7 shrink-0"
			title={title}
			disabled={disabled}
			onMouseDown={(e) => {
				e.preventDefault();
				action();
			}}
		>
			{icon}
		</Button>
	);
}

interface EditorToolbarProps {
	editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
	const { t } = useTranslation("journal");

	// Link dialog
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkExisting, setLinkExisting] = useState(false);

	// Image dialog
	const [imageOpen, setImageOpen] = useState(false);
	const [imageUrl, setImageUrl] = useState("");

	// Table dialog
	const [tableOpen, setTableOpen] = useState(false);
	const [tableRows, setTableRows] = useState("3");
	const [tableCols, setTableCols] = useState("3");

	const openLink = useCallback(() => {
		const previousUrl = editor.getAttributes("link").href as string | undefined;
		setLinkExisting(Boolean(previousUrl) || editor.isActive("link"));
		setLinkUrl(previousUrl ?? "");
		setLinkOpen(true);
	}, [editor]);

	const applyLink = useCallback(() => {
		const url = linkUrl.trim();
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
		} else {
			editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
		}
		setLinkOpen(false);
	}, [editor, linkUrl]);

	const removeLink = useCallback(() => {
		editor.chain().focus().extendMarkRange("link").unsetLink().run();
		setLinkOpen(false);
	}, [editor]);

	const openImage = useCallback(() => {
		setImageUrl("");
		setImageOpen(true);
	}, []);

	const applyImage = useCallback(() => {
		const url = imageUrl.trim();
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
		setImageOpen(false);
	}, [editor, imageUrl]);

	const openTable = useCallback(() => {
		setTableRows("3");
		setTableCols("3");
		setTableOpen(true);
	}, []);

	const applyTable = useCallback(() => {
		const rows = Math.min(50, Math.max(1, parseInt(tableRows, 10) || 3));
		const cols = Math.min(20, Math.max(1, parseInt(tableCols, 10) || 3));
		editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
		setTableOpen(false);
	}, [editor, tableRows, tableCols]);

	return (
		<>
			<div className="flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5">
				{/* History */}
				<ToolbarButton
					action={() => editor.chain().focus().undo().run()}
					active={false}
					title={t("toolbar.undo")}
					icon={<Undo2 className="size-3.5" />}
					disabled={!editor.can().undo()}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().redo().run()}
					active={false}
					title={t("toolbar.redo")}
					icon={<Redo2 className="size-3.5" />}
					disabled={!editor.can().redo()}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Editor font */}
				<FontPicker compact editor={editor} />

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Headings */}
				<ToolbarButton
					action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					active={editor.isActive("heading", { level: 1 })}
					title={t("toolbar.h1")}
					icon={<Heading1 className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					active={editor.isActive("heading", { level: 2 })}
					title={t("toolbar.h2")}
					icon={<Heading2 className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					active={editor.isActive("heading", { level: 3 })}
					title={t("toolbar.h3")}
					icon={<Heading3 className="size-3.5" />}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Inline formatting */}
				<ToolbarButton
					action={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive("bold")}
					title={t("toolbar.bold")}
					icon={<Bold className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive("italic")}
					title={t("toolbar.italic")}
					icon={<Italic className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleUnderline().run()}
					active={editor.isActive("underline")}
					title={t("toolbar.underline")}
					icon={<Underline className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleStrike().run()}
					active={editor.isActive("strike")}
					title={t("toolbar.strike")}
					icon={<Strikethrough className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleHighlight().run()}
					active={editor.isActive("highlight")}
					title={t("toolbar.highlight")}
					icon={<Highlighter className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleCode().run()}
					active={editor.isActive("code")}
					title={t("toolbar.code")}
					icon={<Code className="size-3.5" />}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Text alignment */}
				<ToolbarButton
					action={() => editor.chain().focus().setTextAlign("left").run()}
					active={editor.isActive({ textAlign: "left" })}
					title={t("toolbar.alignLeft")}
					icon={<AlignLeft className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().setTextAlign("center").run()}
					active={editor.isActive({ textAlign: "center" })}
					title={t("toolbar.alignCenter")}
					icon={<AlignCenter className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().setTextAlign("right").run()}
					active={editor.isActive({ textAlign: "right" })}
					title={t("toolbar.alignRight")}
					icon={<AlignRight className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().setTextAlign("justify").run()}
					active={editor.isActive({ textAlign: "justify" })}
					title={t("toolbar.alignJustify")}
					icon={<AlignJustify className="size-3.5" />}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Lists */}
				<ToolbarButton
					action={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive("bulletList")}
					title={t("toolbar.bulletList")}
					icon={<List className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive("orderedList")}
					title={t("toolbar.orderedList")}
					icon={<ListOrdered className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleTaskList().run()}
					active={editor.isActive("taskList")}
					title={t("toolbar.taskList")}
					icon={<ListChecks className="size-3.5" />}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Blocks */}
				<ToolbarButton
					action={() => editor.chain().focus().toggleBlockquote().run()}
					active={editor.isActive("blockquote")}
					title={t("toolbar.blockquote")}
					icon={<Quote className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().toggleCodeBlock().run()}
					active={editor.isActive("codeBlock")}
					title={t("toolbar.codeBlock")}
					icon={<Code2 className="size-3.5" />}
				/>
				<ToolbarButton
					action={() => editor.chain().focus().setHorizontalRule().run()}
					active={false}
					title={t("toolbar.hr")}
					icon={<Minus className="size-3.5" />}
				/>

				<Separator orientation="vertical" className="mx-1 h-5" />

				{/* Media & links */}
				<ToolbarButton
					action={openLink}
					active={editor.isActive("link")}
					title={t("toolbar.link")}
					icon={<Link2 className="size-3.5" />}
				/>
				<ToolbarButton
					action={openImage}
					active={false}
					title={t("toolbar.image")}
					icon={<Image className="size-3.5" />}
				/>
				<ToolbarButton
					action={openTable}
					active={editor.isActive("table")}
					title={t("toolbar.table")}
					icon={<Table className="size-3.5" />}
				/>
			</div>

			{/* Link dialog */}
			<Dialog open={linkOpen} onOpenChange={setLinkOpen}>
				<DialogContent className="sm:max-w-md">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							applyLink();
						}}
					>
						<DialogHeader>
							<DialogTitle>{t("toolbar.linkTitle", "Insertar enlace")}</DialogTitle>
							<DialogDescription>
								{t("toolbar.linkDescription", "Pega o escribe la dirección del enlace.")}
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-2 py-4">
							<Label htmlFor="editor-link-url">{t("toolbar.linkLabel", "URL")}</Label>
							<Input
								id="editor-link-url"
								type="url"
								inputMode="url"
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								placeholder="https://ejemplo.com"
								autoFocus
							/>
						</div>
						<DialogFooter className="gap-2 sm:gap-2">
							{linkExisting && (
								<Button
									type="button"
									variant="ghost"
									onClick={removeLink}
									className="mr-auto gap-2 text-destructive hover:text-destructive"
								>
									<Unlink className="size-4" />
									{t("toolbar.linkRemove", "Quitar enlace")}
								</Button>
							)}
							<Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>
								{t("menu.cancel", "Cancelar")}
							</Button>
							<Button type="submit">{t("toolbar.insert", "Insertar")}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Image dialog */}
			<Dialog open={imageOpen} onOpenChange={setImageOpen}>
				<DialogContent className="sm:max-w-md">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							applyImage();
						}}
					>
						<DialogHeader>
							<DialogTitle>{t("toolbar.imageTitle", "Insertar imagen")}</DialogTitle>
							<DialogDescription>
								{t("toolbar.imageDescription", "Introduce la dirección de la imagen.")}
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-2 py-4">
							<Label htmlFor="editor-image-url">
								{t("toolbar.imageLabel", "URL de la imagen")}
							</Label>
							<Input
								id="editor-image-url"
								type="url"
								inputMode="url"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								placeholder="https://ejemplo.com/imagen.png"
								autoFocus
							/>
						</div>
						<DialogFooter className="gap-2 sm:gap-2">
							<Button type="button" variant="ghost" onClick={() => setImageOpen(false)}>
								{t("menu.cancel", "Cancelar")}
							</Button>
							<Button type="submit" disabled={!imageUrl.trim()}>
								{t("toolbar.insert", "Insertar")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Table dialog */}
			<Dialog open={tableOpen} onOpenChange={setTableOpen}>
				<DialogContent className="sm:max-w-md">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							applyTable();
						}}
					>
						<DialogHeader>
							<DialogTitle>{t("toolbar.tableTitle", "Insertar tabla")}</DialogTitle>
							<DialogDescription>
								{t("toolbar.tableDescription", "Elige el número de filas y columnas.")}
							</DialogDescription>
						</DialogHeader>
						<div className="grid grid-cols-2 gap-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="editor-table-rows">{t("toolbar.rows", "Filas")}</Label>
								<Input
									id="editor-table-rows"
									type="number"
									min={1}
									max={50}
									value={tableRows}
									onChange={(e) => setTableRows(e.target.value)}
									autoFocus
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="editor-table-cols">
									{t("toolbar.columns", "Columnas")}
								</Label>
								<Input
									id="editor-table-cols"
									type="number"
									min={1}
									max={20}
									value={tableCols}
									onChange={(e) => setTableCols(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter className="gap-2 sm:gap-2">
							<Button type="button" variant="ghost" onClick={() => setTableOpen(false)}>
								{t("menu.cancel", "Cancelar")}
							</Button>
							<Button type="submit">{t("toolbar.insert", "Insertar")}</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
