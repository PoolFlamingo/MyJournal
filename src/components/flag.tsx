import { cn } from "@/lib/utils";

/**
 * Bandera renderizada con `flag-icons` (SVG local empaquetado, sin URLs).
 * Se usa en lugar del emoji de bandera porque WebKitGTK (Linux) no dibuja las
 * secuencias de "regional indicators". `code` es el ISO-3166 alpha-2 en
 * minúsculas (p. ej. "es", "gb", "jp").
 */
export function Flag({ code, className }: { code: string; className?: string }) {
	return (
		<span
			className={cn("fi shrink-0 rounded-[2px]", `fi-${code}`, className)}
			style={{ width: "1.3em", height: "0.95em", backgroundSize: "cover" }}
			aria-hidden="true"
		/>
	);
}
