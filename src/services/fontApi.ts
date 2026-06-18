import { invoke } from "@tauri-apps/api/core";

/** Metadata for a user-uploaded font, mirrors the Rust `CustomFont` DTO. */
export interface CustomFontDto {
	id: string;
	family: string;
	format: string;
}

/** Upload a font file: detect its family name and persist it under appDataDir. */
export async function registerFont(
	fileName: string,
	bytes: Uint8Array
): Promise<CustomFontDto> {
	return invoke<CustomFontDto>("font_register", {
		fileName,
		bytes: Array.from(bytes),
	});
}

/** List every stored custom font (family re-detected from each file). */
export async function listFonts(): Promise<CustomFontDto[]> {
	return invoke<CustomFontDto[]>("font_list");
}

/** Read the raw bytes of a stored font, to register a `FontFace`. */
export async function readFont(id: string): Promise<Uint8Array> {
	const bytes = await invoke<number[]>("font_read", { id });
	return new Uint8Array(bytes);
}

/** Delete a stored custom font. */
export async function deleteFont(id: string): Promise<void> {
	return invoke("font_delete", { id });
}
