import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
	const [show, setShow] = useState(false);

	return (
		<div className="relative">
			<Input
				type={show ? "text" : "password"}
				className={cn("pr-10", className)}
				{...props}
			/>
			<button
				type="button"
				tabIndex={-1}
				onClick={() => setShow((s) => !s)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
			>
				{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
			</button>
		</div>
	);
}
