import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { type Editor } from "@tiptap/react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Trash2, Type, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useEditorFont } from "@/components/editor-font-provider";
import type { FontOption } from "@/lib/fonts/registry";
import { cn } from "@/lib/utils";

const ACCEPTED_FONT_TYPES = ".ttf,.otf,.woff,.woff2,.ttc";

interface FontPickerProps {
	/** Compact trigger for the editor toolbar; otherwise a full-width control. */
	compact?: boolean;
	className?: string;
	/**
	 * When provided, the picker applies the font to the current selection / typing
	 * position via TipTap's FontFamily mark (inline). When omitted, it sets the
	 * global default editor font instead.
	 */
	editor?: Editor | null;
}

export function FontPicker({ compact = false, className, editor }: FontPickerProps) {
	const { t } = useTranslation("journal");
	const { fontId, setFontId, builtinFonts, customFonts, uploadFont, removeCustomFont } =
		useEditorFont();
	const [open, setOpen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const inlineMode = Boolean(editor);
	const sansFonts = builtinFonts.filter((f) => f.category === "sans");
	const serifFonts = builtinFonts.filter((f) => f.category === "serif");
	const monoFonts = builtinFonts.filter((f) => f.category === "mono");
	const allFonts = [...builtinFonts, ...customFonts];

	// In inline mode the "current" font is the one applied at the cursor/selection.
	const activeStack = editor?.getAttributes("textStyle").fontFamily as string | undefined;
	const current = inlineMode
		? allFonts.find((f) => f.stack === activeStack)
		: allFonts.find((f) => f.id === fontId);
	const currentLabel = inlineMode
		? (current?.label ?? t("editorFont.useDefault", "Predeterminada"))
		: (current?.label ?? builtinFonts[0]?.label);

	const isSelected = (option: FontOption) =>
		inlineMode ? option.stack === activeStack : option.id === fontId;

	const applyFont = (option: FontOption) => {
		if (editor) {
			editor.chain().focus().setFontFamily(option.stack).run();
		} else {
			setFontId(option.id);
		}
		setOpen(false);
	};

	const clearFont = () => {
		editor?.chain().focus().unsetFontFamily().run();
		setOpen(false);
	};

	const handleUploadClick = () => fileInputRef.current?.click();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setUploading(true);
		try {
			const option = await uploadFont(file);
			applyFont(option);
			toast.success(
				t("editorFont.uploadSuccess", "Fuente añadida: {{name}}", { name: option.label })
			);
		} catch (err) {
			console.error(err);
			toast.error(t("editorFont.uploadError", "No se pudo añadir la fuente"));
		} finally {
			setUploading(false);
		}
	};

	const handleDelete = async (e: React.MouseEvent, option: FontOption) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await removeCustomFont(option.id);
			toast.success(t("editorFont.deleted", "Fuente eliminada"));
		} catch (err) {
			console.error(err);
			toast.error(t("editorFont.deleteError", "No se pudo eliminar la fuente"));
		}
	};

	const renderItem = (option: FontOption, deletable = false) => (
		<CommandItem
			key={option.id}
			value={`${option.label} ${option.category} ${option.id}`}
			onSelect={() => applyFont(option)}
			className="group/font justify-between gap-2"
		>
			<span className="flex min-w-0 items-center gap-2">
				<Check
					className={cn(
						"size-4 shrink-0",
						isSelected(option) ? "text-primary opacity-100" : "opacity-0"
					)}
				/>
				<span className="truncate text-base" style={{ fontFamily: option.stack }}>
					{option.label}
				</span>
			</span>
			{deletable && (
				<button
					type="button"
					aria-label={t("editorFont.delete", "Eliminar fuente")}
					title={t("editorFont.delete", "Eliminar fuente")}
					onClick={(e) => void handleDelete(e, option)}
					onPointerDown={(e) => e.stopPropagation()}
					className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover/font:opacity-100"
				>
					<Trash2 className="size-3.5" />
				</button>
			)}
		</CommandItem>
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				{compact ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						role="combobox"
						aria-expanded={open}
						title={t("editorFont.tooltip", "Fuente del texto")}
						className={cn("h-7 max-w-[150px] gap-1.5 px-2 font-normal", className)}
					>
						<Type className="size-3.5 shrink-0" />
						<span className="truncate text-xs">{currentLabel}</span>
						<ChevronsUpDown className="size-3 shrink-0 opacity-50" />
					</Button>
				) : (
					<Button
						type="button"
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className={cn("w-full justify-between font-normal", className)}
					>
						<span
							className="truncate text-foreground"
							style={{ fontFamily: current?.stack }}
						>
							{currentLabel}
						</span>
						<ChevronsUpDown className="size-4 shrink-0 opacity-50" />
					</Button>
				)}
			</PopoverTrigger>
			<PopoverContent className="w-[280px] p-0" align="start">
				<Command>
					<CommandInput placeholder={t("editorFont.search", "Buscar fuente...")} />
					<CommandList>
						<CommandEmpty>{t("editorFont.empty", "Sin resultados")}</CommandEmpty>
						{inlineMode && (
							<CommandGroup>
								<CommandItem
									value={t("editorFont.useDefault", "Predeterminada")}
									onSelect={clearFont}
									className="gap-2"
								>
									<Check
										className={cn(
											"size-4 shrink-0",
											!activeStack ? "text-primary opacity-100" : "opacity-0"
										)}
									/>
									<span className="text-muted-foreground">
										{t("editorFont.useDefault", "Predeterminada del editor")}
									</span>
								</CommandItem>
							</CommandGroup>
						)}
						{customFonts.length > 0 && (
							<CommandGroup heading={t("editorFont.custom", "Tus fuentes")}>
								{customFonts.map((f) => renderItem(f, true))}
							</CommandGroup>
						)}
						<CommandGroup heading={t("editorFont.sans", "Sans-serif")}>
							{sansFonts.map((f) => renderItem(f))}
						</CommandGroup>
						<CommandGroup heading={t("editorFont.serif", "Serif")}>
							{serifFonts.map((f) => renderItem(f))}
						</CommandGroup>
						<CommandGroup heading={t("editorFont.mono", "Monoespaciada")}>
							{monoFonts.map((f) => renderItem(f))}
						</CommandGroup>
					</CommandList>
				</Command>
				<div className="border-t p-1">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={uploading}
						onClick={handleUploadClick}
						className="w-full justify-start gap-2 font-normal"
					>
						{uploading ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Upload className="size-4" />
						)}
						{uploading
							? t("editorFont.uploading", "Subiendo...")
							: t("editorFont.upload", "Subir fuente...")}
					</Button>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					accept={ACCEPTED_FONT_TYPES}
					onChange={(e) => void handleFileChange(e)}
					className="hidden"
				/>
			</PopoverContent>
		</Popover>
	);
}
