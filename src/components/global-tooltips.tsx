import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Tooltips globales con estilo shadcn SIN tocar cada componente.
 *
 * Un MutationObserver detecta cualquier atributo `title` del DOM, lo traslada a
 * `data-tooltip` y elimina el `title` nativo (así nunca aparece el tooltip feo
 * del SO). Si el elemento no tenía nombre accesible, conserva el texto en un
 * `aria-label`. Un único elemento flotante (portal) muestra el tooltip al pasar
 * el ratón; se MIDE tras renderizar y se recoloca para que nunca se corte:
 * clamp horizontal a los bordes y flip arriba/abajo según el espacio.
 */
const ATTR = "data-tooltip";
const SHOW_DELAY = 350;
const MARGIN = 8;

interface AnchorRect {
	top: number;
	bottom: number;
	left: number;
	width: number;
}

export function GlobalTooltips() {
	const [tip, setTip] = useState<{ text: string; rect: AnchorRect } | null>(null);
	const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const timerRef = useRef<number | null>(null);
	const targetRef = useRef<Element | null>(null);

	// ── title -> data-tooltip + listeners de hover ──────────────────────
	useEffect(() => {
		const convert = (el: Element) => {
			const title = el.getAttribute("title");
			if (title === null) return;
			if (title.trim().length > 0) {
				el.setAttribute(ATTR, title);
				if (!el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby")) {
					el.setAttribute("aria-label", title);
				}
			}
			el.removeAttribute("title");
		};

		const scan = (root: Element | ParentNode) => {
			if (root instanceof Element && root.hasAttribute("title")) convert(root);
			root.querySelectorAll?.("[title]").forEach(convert);
		};

		scan(document.body);

		const observer = new MutationObserver((mutations) => {
			for (const m of mutations) {
				if (m.type === "attributes" && m.attributeName === "title") {
					if (m.target instanceof Element) convert(m.target);
				} else if (m.type === "childList") {
					m.addedNodes.forEach((n) => {
						if (n instanceof Element) scan(n);
					});
				}
			}
		});
		observer.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ["title"],
		});

		const clearTimer = () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};

		const hide = () => {
			clearTimer();
			targetRef.current = null;
			setTip(null);
			setPos(null);
		};

		const show = (el: Element) => {
			const text = el.getAttribute(ATTR);
			if (!text) return;
			const r = el.getBoundingClientRect();
			if (r.width === 0 && r.height === 0) return;
			targetRef.current = el;
			setPos(null); // se recalcula al medir
			setTip({
				text,
				rect: { top: r.top, bottom: r.bottom, left: r.left, width: r.width },
			});
		};

		const onOver = (e: MouseEvent) => {
			const el = (e.target as Element | null)?.closest?.(`[${ATTR}]`);
			if (!el || el === targetRef.current) return;
			clearTimer();
			timerRef.current = window.setTimeout(() => show(el), SHOW_DELAY);
		};

		const onOut = (e: MouseEvent) => {
			const el = (e.target as Element | null)?.closest?.(`[${ATTR}]`);
			if (!el) return;
			const related = e.relatedTarget as Node | null;
			if (related && el.contains(related)) return;
			hide();
		};

		document.addEventListener("mouseover", onOver, true);
		document.addEventListener("mouseout", onOut, true);
		document.addEventListener("mousedown", hide, true);
		window.addEventListener("scroll", hide, true);
		window.addEventListener("blur", hide);

		return () => {
			observer.disconnect();
			clearTimer();
			document.removeEventListener("mouseover", onOver, true);
			document.removeEventListener("mouseout", onOut, true);
			document.removeEventListener("mousedown", hide, true);
			window.removeEventListener("scroll", hide, true);
			window.removeEventListener("blur", hide);
		};
	}, []);

	// ── Medir el tooltip y recolocarlo dentro del viewport ──────────────
	useLayoutEffect(() => {
		if (!tip || !tooltipRef.current) return;
		const el = tooltipRef.current;
		const tw = el.offsetWidth;
		const th = el.offsetHeight;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const { rect } = tip;

		// Horizontal: centrado sobre el objetivo, recortado a los bordes.
		const centerX = rect.left + rect.width / 2;
		const left = Math.max(MARGIN, Math.min(centerX - tw / 2, vw - tw - MARGIN));

		// Vertical: preferimos arriba; si no cabe, abajo; si tampoco, lo pegamos.
		let top = rect.top - th - MARGIN;
		if (top < MARGIN) {
			const below = rect.bottom + MARGIN;
			top = below + th <= vh - MARGIN ? below : Math.max(MARGIN, vh - th - MARGIN);
		}

		setPos({ left, top });
	}, [tip]);

	if (!tip) return null;

	return createPortal(
		<div
			ref={tooltipRef}
			role="tooltip"
			className="pointer-events-none fixed z-[100] w-fit max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background shadow-md"
			style={{
				left: pos ? pos.left : 0,
				top: pos ? pos.top : 0,
				// Mientras medimos (pos === null) lo dejamos invisible para evitar el salto.
				opacity: pos ? 1 : 0,
				transition: "opacity 120ms ease-out",
			}}
		>
			{tip.text}
		</div>,
		document.body
	);
}
