/**
 * Release script — bumps the version in all manifest files, commits, tags and pushes.
 *
 * Usage:
 *   node scripts/release.mjs patch          → 0.1.0 → 0.1.1
 *   node scripts/release.mjs minor          → 0.1.0 → 0.2.0
 *   node scripts/release.mjs major          → 0.1.0 → 1.0.0
 *   node scripts/release.mjs 1.2.3          → explicit version
 *   node scripts/release.mjs patch --dry-run  → preview only, no git ops
 *
 * Files updated:
 *   package.json                 "version"
 *   src-tauri/tauri.conf.json    "version"
 *   src-tauri/Cargo.toml         version = "..."
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
	const result = execSync(cmd, { cwd: ROOT, stdio: "pipe", ...opts });
	return result ? result.toString().trim() : "";
}

function bump(current, type) {
	const parts = current.split(".").map(Number);
	if (parts.length !== 3 || parts.some(isNaN)) {
		throw new Error(`Cannot parse current version: ${current}`);
	}
	switch (type) {
		case "major":
			return `${parts[0] + 1}.0.0`;
		case "minor":
			return `${parts[0]}.${parts[1] + 1}.0`;
		case "patch":
			return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
		default:
			// Explicit version — validate semver-ish
			if (!/^\d+\.\d+\.\d+$/.test(type)) {
				throw new Error(
					`Invalid version or bump type: "${type}". Use patch | minor | major | x.y.z`
				);
			}
			return type;
	}
}

function confirm(question) {
	return new Promise((resolve) => {
		const rl = createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase());
		});
	});
}

// ── file updaters ─────────────────────────────────────────────────────────────

function updatePackageJson(next) {
	const path = resolve(ROOT, "package.json");
	const obj = JSON.parse(readFileSync(path, "utf8"));
	const prev = obj.version;
	obj.version = next;
	writeFileSync(path, JSON.stringify(obj, null, "\t") + "\n");
	return prev;
}

function updateTauriConf(next) {
	const path = resolve(ROOT, "src-tauri/tauri.conf.json");
	const obj = JSON.parse(readFileSync(path, "utf8"));
	obj.version = next;
	writeFileSync(path, JSON.stringify(obj, null, "\t") + "\n");
}

function updateCargoToml(next) {
	const path = resolve(ROOT, "src-tauri/Cargo.toml");
	let content = readFileSync(path, "utf8");
	// Replace the first `version = "x.y.z"` line in [package]
	content = content.replace(/^(version\s*=\s*)"[^"]*"/m, `$1"${next}"`);
	writeFileSync(path, content);
}

// ── main ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bumpArg = args.find((a) => a !== "--dry-run");

if (!bumpArg) {
	console.error(
		"Usage: node scripts/release.mjs <patch|minor|major|x.y.z> [--dry-run]"
	);
	process.exit(1);
}

// Read current version from package.json
const currentVersion = JSON.parse(
	readFileSync(resolve(ROOT, "package.json"), "utf8")
).version;

const nextVersion = bump(currentVersion, bumpArg);
const tag = `v${nextVersion}`;

console.log(`\n  Current : ${currentVersion}`);
console.log(`  Next    : ${nextVersion}`);
console.log(`  Tag     : ${tag}`);
if (dryRun) {
	console.log("\n  [dry-run] No changes written.\n");
	process.exit(0);
}

// Confirm before proceeding
const answer = await confirm(`\n  Continue? [y/N] `);
if (answer !== "y" && answer !== "yes") {
	console.log("  Aborted.\n");
	process.exit(0);
}

// Check working tree is clean (warn, don't block)
try {
	const status = run("git status --porcelain");
	if (status) {
		console.warn(
			"\n  Warning: working tree has uncommitted changes. They will be included in the release commit."
		);
	}
} catch {
	// git not available or not a repo — continue anyway
}

// Apply version bumps
updatePackageJson(nextVersion);
updateTauriConf(nextVersion);
updateCargoToml(nextVersion);
console.log(`\n  Updated package.json, tauri.conf.json, Cargo.toml → ${nextVersion}`);

// Git commit + tag + push
try {
	run("git add -A", { stdio: "inherit" });
	run(`git commit -m "chore: release ${tag}"`, { stdio: "inherit" });
	run(`git tag ${tag}`, { stdio: "inherit" });
	console.log(`\n  Pushing commit and tag ${tag}…`);
	run("git push", { stdio: "inherit" });
	run(`git push origin ${tag}`, { stdio: "inherit" });
	console.log(`\n  Done! GitHub Actions will build and publish the release.\n`);
} catch (err) {
	console.error("\n  Git operation failed:", err.message);
	console.error(
		"  Version files were updated locally. Commit and push manually.\n"
	);
	process.exit(1);
}
