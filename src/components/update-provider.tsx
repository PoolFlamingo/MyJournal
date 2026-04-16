import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { getVersion } from "@tauri-apps/api/app";
import * as updaterApi from "@/services/updaterApi";
import type { UpdateMode, UpdateProgress } from "@/types/updater";

const STORAGE_FILE = "settings.json";
const UPDATE_MODE_KEY = "updateMode";
const LAST_CHECK_KEY = "updateLastCheck";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

interface UpdateContextValue {
	/** Current app version from Tauri config */
	currentVersion: string;
	/** User preference: "notify" | "background" */
	mode: UpdateMode;
	setMode: (mode: UpdateMode) => Promise<void>;
	/** Whether we're currently checking for updates */
	checking: boolean;
	/** Available update version, null if up-to-date */
	availableVersion: string | null;
	/** Release notes for the available update */
	releaseNotes: string | null;
	/** Whether the update has been downloaded and is ready to install */
	downloaded: boolean;
	/** Download progress (only during active download) */
	progress: UpdateProgress | null;
	/** Whether a download is in progress */
	downloading: boolean;
	/** Last error message from update operations */
	error: string | null;
	/** Manually trigger an update check */
	checkNow: () => Promise<void>;
	/** Download the available update */
	downloadUpdate: () => Promise<void>;
	/** Install the downloaded update and restart */
	installAndRestart: () => Promise<void>;
	/** Dismiss error */
	dismissError: () => void;
}

const UpdateContext = createContext<UpdateContextValue | undefined>(undefined);

async function readSavedMode(): Promise<UpdateMode> {
	try {
		const store = await Store.load(STORAGE_FILE);
		const saved = await store.get<string>(UPDATE_MODE_KEY);
		return saved === "background" ? "background" : "notify";
	} catch {
		return "notify";
	}
}

async function saveMode(mode: UpdateMode): Promise<void> {
	try {
		const store = await Store.load(STORAGE_FILE);
		await store.set(UPDATE_MODE_KEY, mode);
		await store.save();
	} catch {
		// Ignore persistence failures in development mode.
	}
}

async function readLastCheck(): Promise<number> {
	try {
		const store = await Store.load(STORAGE_FILE);
		const ts = await store.get<number>(LAST_CHECK_KEY);
		return ts ?? 0;
	} catch {
		return 0;
	}
}

async function saveLastCheck(): Promise<void> {
	try {
		const store = await Store.load(STORAGE_FILE);
		await store.set(LAST_CHECK_KEY, Date.now());
		await store.save();
	} catch {
		// Ignore
	}
}

export function UpdateProvider({ children }: { children: React.ReactNode }) {
	const mountedRef = useRef(true);
	const [currentVersion, setCurrentVersion] = useState("0.0.0");
	const [mode, setModeState] = useState<UpdateMode>("notify");
	const [checking, setChecking] = useState(false);
	const [availableVersion, setAvailableVersion] = useState<string | null>(null);
	const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
	const [downloaded, setDownloaded] = useState(false);
	const [progress, setProgress] = useState<UpdateProgress | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// ── Read current version ────────────────────────────────────────
	useEffect(() => {
		mountedRef.current = true;

		getVersion()
			.then((v) => {
				if (mountedRef.current) setCurrentVersion(v);
			})
			.catch(() => {
				// Fallback stays at 0.0.0
			});

		return () => {
			mountedRef.current = false;
		};
	}, []);

	// ── Core check logic ────────────────────────────────────────────
	const performCheck = useCallback(async (autoDownload: boolean) => {
		if (!mountedRef.current) return;
		setChecking(true);
		setError(null);

		try {
			const update = await updaterApi.checkForUpdate();
			if (!mountedRef.current) return;

			if (update) {
				setAvailableVersion(update.version);
				setReleaseNotes(update.body ?? null);

				if (autoDownload) {
					setDownloading(true);
					setProgress(null);
					try {
						await updaterApi.downloadAndInstall((p) => {
							if (mountedRef.current) setProgress(p);
						});
						if (mountedRef.current) {
							setDownloaded(true);
							setDownloading(false);
						}
					} catch (err) {
						if (mountedRef.current) {
							setError(err instanceof Error ? err.message : "Download failed");
							setDownloading(false);
						}
					}
				}
			} else {
				setAvailableVersion(null);
				setReleaseNotes(null);
			}

			await saveLastCheck();
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Update check failed");
			}
		} finally {
			if (mountedRef.current) setChecking(false);
		}
	}, []);

	// ── Startup auto-check with throttle ────────────────────────────
	useEffect(() => {
		let cancelled = false;

		async function startupCheck() {
			const savedMode = await readSavedMode();
			if (cancelled) return;
			setModeState(savedMode);

			const lastCheck = await readLastCheck();
			const elapsed = Date.now() - lastCheck;
			if (elapsed < CHECK_INTERVAL_MS) return;

			// Delay startup check so it doesn't race with bootstrap
			await new Promise((r) => setTimeout(r, 5000));
			if (cancelled) return;

			await performCheck(savedMode === "background");
		}

		startupCheck();
		return () => {
			cancelled = true;
		};
	}, [performCheck]);

	// ── Public actions ──────────────────────────────────────────────
	const setMode = useCallback(async (next: UpdateMode) => {
		setModeState(next);
		await saveMode(next);
	}, []);

	const checkNow = useCallback(async () => {
		await performCheck(mode === "background");
	}, [performCheck, mode]);

	const downloadUpdate = useCallback(async () => {
		if (!availableVersion || downloading || downloaded) return;
		setDownloading(true);
		setProgress(null);
		setError(null);

		try {
			await updaterApi.downloadAndInstall((p) => {
				if (mountedRef.current) setProgress(p);
			});
			if (mountedRef.current) {
				setDownloaded(true);
				setDownloading(false);
			}
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Download failed");
				setDownloading(false);
			}
		}
	}, [availableVersion, downloading, downloaded]);

	const installAndRestart = useCallback(async () => {
		try {
			await updaterApi.installAndRelaunch();
		} catch (err) {
			if (mountedRef.current) {
				setError(err instanceof Error ? err.message : "Install failed");
			}
		}
	}, []);

	const dismissError = useCallback(() => setError(null), []);

	return (
		<UpdateContext.Provider
			value={{
				currentVersion,
				mode,
				setMode,
				checking,
				availableVersion,
				releaseNotes,
				downloaded,
				progress,
				downloading,
				error,
				checkNow,
				downloadUpdate,
				installAndRestart,
				dismissError,
			}}
		>
			{children}
		</UpdateContext.Provider>
	);
}

export function useUpdate() {
	const context = useContext(UpdateContext);
	if (!context) {
		throw new Error("useUpdate must be used within an UpdateProvider");
	}
	return context;
}
