/**
 * Theme transition effects using the View Transitions API.
 *
 * Inspired by https://github.com/PoolFlamingo/theme-toggle-effect
 *
 * Only `circle-with-blur` is currently wired; the rest are registered
 * as stubs so they can be activated later by switching `ACTIVE_VARIANT`
 * and filling in their CSS in `src/index.css`.
 */

export type ThemeTransitionVariant =
	| "circle"
	| "circle-with-blur"
	| "circle-blur-top-left"
	| "polygon"
	| "polygon-gradient"
	| "gif-1"
	| "gif-2";

interface VariantSpec {
	/** CSS class added to <html> while the transition runs. */
	cssClass: string;
	/** Whether this variant has a real CSS implementation yet. */
	implemented: boolean;
}

export const THEME_TRANSITIONS: Record<ThemeTransitionVariant, VariantSpec> = {
	circle: { cssClass: "theme-transition-circle", implemented: false },
	"circle-with-blur": {
		cssClass: "theme-transition-circle-with-blur",
		implemented: true,
	},
	"circle-blur-top-left": {
		cssClass: "theme-transition-circle-blur-top-left",
		implemented: false,
	},
	polygon: { cssClass: "theme-transition-polygon", implemented: false },
	"polygon-gradient": {
		cssClass: "theme-transition-polygon-gradient",
		implemented: false,
	},
	"gif-1": { cssClass: "theme-transition-gif-1", implemented: false },
	"gif-2": { cssClass: "theme-transition-gif-2", implemented: false },
};

/** Variant used by the app today. Change this constant to swap effect. */
export const ACTIVE_VARIANT: ThemeTransitionVariant = "circle-with-blur";

type StartViewTransitionFn = (cb: () => void) => { finished: Promise<void> };

function getStartViewTransition(): StartViewTransitionFn | undefined {
	const fn = (document as unknown as { startViewTransition?: StartViewTransitionFn })
		.startViewTransition;
	return typeof fn === "function" ? fn.bind(document) : undefined;
}

function prefersReducedMotion(): boolean {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Run `swap` (which mutates the DOM to apply the new theme) wrapped in a
 * view transition. Cursor coordinates expose `--theme-toggle-x/y` CSS vars
 * so the active variant can anchor its animation to the click point.
 */
export function runThemeTransition(
	variant: ThemeTransitionVariant,
	x: number,
	y: number,
	swap: () => void
): void {
	const start = getStartViewTransition();
	const spec = THEME_TRANSITIONS[variant];

	if (!start || !spec.implemented || prefersReducedMotion()) {
		swap();
		return;
	}

	const root = document.documentElement;
	root.style.setProperty("--theme-toggle-x", `${x}px`);
	root.style.setProperty("--theme-toggle-y", `${y}px`);
	root.classList.add(spec.cssClass);

	const transition = start(swap);
	transition.finished.finally(() => {
		root.classList.remove(spec.cssClass);
	});
}
