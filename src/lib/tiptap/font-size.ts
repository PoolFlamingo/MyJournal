import { Extension } from "@tiptap/core";

export interface FontSizeOptions {
	/** Marks the font size attribute attaches to. */
	types: string[];
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		fontSize: {
			/** Set the inline font size (e.g. "18px") on the current selection. */
			setFontSize: (size: string) => ReturnType;
			/** Remove the inline font size from the current selection. */
			unsetFontSize: () => ReturnType;
		};
	}
}

/**
 * Adds an inline `font-size` to the `textStyle` mark, mirroring how the official
 * FontFamily extension works. Requires `@tiptap/extension-text-style`.
 */
export const FontSize = Extension.create<FontSizeOptions>({
	name: "fontSize",

	addOptions() {
		return { types: ["textStyle"] };
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						parseHTML: (element) => element.style.fontSize || null,
						renderHTML: (attributes) => {
							if (!attributes.fontSize) return {};
							return { style: `font-size: ${attributes.fontSize}` };
						},
					},
				},
			},
		];
	},

	addCommands() {
		return {
			setFontSize:
				(size) =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: size }).run(),
			unsetFontSize:
				() =>
				({ chain }) =>
					chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
		};
	},
});
