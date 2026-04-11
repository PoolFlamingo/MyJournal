import { useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

	const setLink = useCallback(() => {
		const previousUrl = editor.getAttributes("link").href as string | undefined;
		const url = window.prompt(t("toolbar.linkPrompt"), previousUrl ?? "");
		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}, [editor, t]);

	const addImage = useCallback(() => {
		const url = window.prompt(t("toolbar.imagePrompt"));
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	}, [editor, t]);

	return (
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
				action={setLink}
				active={editor.isActive("link")}
				title={t("toolbar.link")}
				icon={<Link2 className="size-3.5" />}
			/>
			<ToolbarButton
				action={addImage}
				active={false}
				title={t("toolbar.image")}
				icon={<Image className="size-3.5" />}
			/>
		</div>
	);
}
