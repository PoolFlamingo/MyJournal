import { type ReactNode, useMemo, useState } from "react";
import { type Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { platform } from "@tauri-apps/plugin-os";
import EmojiPicker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Scissors,
	Copy,
	ClipboardPaste,
	TextSelect,
	Smile,
	SpellCheck,
} from "lucide-react";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSpellcheck } from "@/components/spellcheck-provider";
import { useTheme } from "@/components/theme-provider";
import { openEmojiPicker } from "@/services/systemApi";
import { cn } from "@/lib/utils";

interface EditorContextMenuProps {
	editor: Editor;
	children: ReactNode;
}

interface StyleButtonProps {
	active: boolean;
	label: string;
	onToggle: () => void;
	children: ReactNode;
}

/** Botón cuadrado de estilo dentro del menú contextual. */
function StyleButton({ active, label, onToggle, children }: StyleButtonProps) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			data-tooltip={label}
			onClick={onToggle}
			className={cn(
				"flex size-8 items-center justify-center rounded-md border transition-colors",
				active
					? "border-primary bg-primary/15 text-primary"
					: "border-border/60 text-foreground hover:bg-accent hover:text-accent-foreground"
			)}
		>
			{children}
		</button>
	);
}

export function EditorContextMenu({ editor, children }: EditorContextMenuProps) {
	const { t } = useTranslation("journal");
	const { enabled: spellcheckEnabled, toggle: toggleSpellcheck } = useSpellcheck();
	const { resolvedTheme } = useTheme();
	const [emojiOpen, setEmojiOpen] = useState(false);

	// El selector nativo del SO es fiable en Windows/macOS. En Linux el atajo
	// (Ctrl+.) choca con el toggle del sidebar y no es fiable, así que usamos el
	// picker propio (emoji-mart, local). Si la detección falla, también usamos el
	// picker propio por seguridad.
	const useNativeEmoji = useMemo(() => {
		try {
			const p = platform();
			return p === "windows" || p === "macos";
		} catch {
			return false;
		}
	}, []);

	const hasSelection = !editor.state.selection.empty;

	// Re-enfoca el editor para que la selección se conserve y siga visible al
	// aplicar el estilo (el menú se cierra, como un menú nativo).
	const toggleMark = (run: (chain: ReturnType<Editor["chain"]>) => void) => {
		const chain = editor.chain().focus();
		run(chain);
	};

	const copy = () => {
		editor.chain().focus().run();
		document.execCommand("copy");
	};

	const cut = () => {
		editor.chain().focus().run();
		document.execCommand("cut");
	};

	const paste = async () => {
		editor.chain().focus().run();
		try {
			const text = await navigator.clipboard.readText();
			if (text) editor.chain().focus().insertContent(text).run();
		} catch {
			document.execCommand("paste");
		}
	};

	const selectAll = () => {
		editor.chain().focus().selectAll().run();
	};

	const insertEmoji = () => {
		if (useNativeEmoji) {
			editor.chain().focus().run();
			window.setTimeout(() => {
				void openEmojiPicker();
			}, 80);
		} else {
			setEmojiOpen(true);
		}
	};

	const onPickEmoji = (emoji: { native?: string }) => {
		if (emoji?.native) {
			editor.chain().focus().insertContent(emoji.native).run();
		}
		setEmojiOpen(false);
	};

	return (
		<>
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div data-context-zone className="flex flex-1 flex-col">
						{children}
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-56">
					{/* Sección superior: estilos de letra básicos (botones cuadrados) */}
					<div className="flex items-center gap-1 p-1">
						<StyleButton
							active={editor.isActive("bold")}
							label={t("context.bold", "Negrita")}
							onToggle={() => toggleMark((c) => c.toggleBold().run())}
						>
							<Bold className="size-4" />
						</StyleButton>
						<StyleButton
							active={editor.isActive("italic")}
							label={t("context.italic", "Cursiva")}
							onToggle={() => toggleMark((c) => c.toggleItalic().run())}
						>
							<Italic className="size-4" />
						</StyleButton>
						<StyleButton
							active={editor.isActive("underline")}
							label={t("context.underline", "Subrayado")}
							onToggle={() => toggleMark((c) => c.toggleUnderline().run())}
						>
							<Underline className="size-4" />
						</StyleButton>
						<StyleButton
							active={editor.isActive("strike")}
							label={t("context.strike", "Tachado")}
							onToggle={() => toggleMark((c) => c.toggleStrike().run())}
						>
							<Strikethrough className="size-4" />
						</StyleButton>
					</div>

					<ContextMenuSeparator />

					<ContextMenuItem onSelect={() => cut()} disabled={!hasSelection}>
						<Scissors />
						{t("context.cut", "Cortar")}
						<ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => copy()} disabled={!hasSelection}>
						<Copy />
						{t("context.copy", "Copiar")}
						<ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => void paste()}>
						<ClipboardPaste />
						{t("context.paste", "Pegar")}
						<ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem onSelect={() => selectAll()}>
						<TextSelect />
						{t("context.selectAll", "Seleccionar todo")}
						<ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
					</ContextMenuItem>

					<ContextMenuSeparator />

					<ContextMenuItem onSelect={() => insertEmoji()}>
						<Smile />
						{t("context.emoji", "Insertar emoji…")}
					</ContextMenuItem>
					<ContextMenuCheckboxItem
						checked={spellcheckEnabled}
						onCheckedChange={() => toggleSpellcheck()}
					>
						<SpellCheck />
						{t("context.spellcheck", "Corrector ortográfico")}
					</ContextMenuCheckboxItem>
				</ContextMenuContent>
			</ContextMenu>

			{/* Picker emoji propio (fallback / Linux) */}
			<Dialog open={emojiOpen} onOpenChange={setEmojiOpen}>
				<DialogContent
					showCloseButton={false}
					className="w-fit border-0 bg-transparent p-0 shadow-none"
				>
					<DialogTitle className="sr-only">
						{t("context.emoji", "Insertar emoji…")}
					</DialogTitle>
					<EmojiPicker
						data={emojiData}
						onEmojiSelect={onPickEmoji}
						theme={resolvedTheme === "dark" ? "dark" : "light"}
						previewPosition="none"
						autoFocus
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
