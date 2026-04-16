import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import type { UpdateProgress } from "@/types/updater";

let currentUpdate: Update | null = null;

export async function checkForUpdate(): Promise<Update | null> {
	const update = await check();
	currentUpdate = update;
	return update;
}

export async function downloadAndInstall(
	onProgress?: (progress: UpdateProgress) => void,
): Promise<void> {
	if (!currentUpdate) throw new Error("No update available");

	let downloaded = 0;
	let contentLength = 0;

	await currentUpdate.downloadAndInstall((event) => {
		switch (event.event) {
			case "Started":
				contentLength = event.data.contentLength ?? 0;
				onProgress?.({ contentLength, downloaded: 0 });
				break;
			case "Progress":
				downloaded += event.data.chunkLength;
				onProgress?.({ contentLength, downloaded });
				break;
			case "Finished":
				onProgress?.({ contentLength, downloaded: contentLength });
				break;
		}
	});
}

export async function installAndRelaunch(): Promise<void> {
	await relaunch();
}

export function clearUpdate(): void {
	currentUpdate = null;
}
