export type UpdateMode = "notify" | "background";

export interface UpdateStatus {
	available: boolean;
	version: string | null;
	body: string | null;
	date: string | null;
	currentVersion: string;
}

export interface UpdateProgress {
	contentLength: number;
	downloaded: number;
}
