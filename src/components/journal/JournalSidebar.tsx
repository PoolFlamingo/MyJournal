import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	BookText,
	Plus,
	Lock,
	Unlock,
	LayoutDashboard,
	Trash2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import type { JournalSummary, CalendarDayState } from "@/types/journal";
import { useWeekStart } from "@/hooks/useWeekStart";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const journalListContainer = {
	hidden: {},
	show: { transition: { staggerChildren: 0.04 } },
};
const journalListItem = {
	hidden: { opacity: 0, x: -8 },
	show: {
		opacity: 1,
		x: 0,
		transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
	},
};

interface JournalSidebarProps {
	journals: JournalSummary[];
	activeJournalId: string | null;
	calendarDays: CalendarDayState[];
	selectedDate: string;
	onSelectDate: (date: string) => void;
	onMonthChange: (year: number, month: number) => void;
	onOpenJournal: (id: string) => void;
	onLockJournal: (id: string) => void;
	onDeleteJournal: (id: string) => void;
	onCreateJournal: () => void;
}

export function JournalSidebar({
	journals,
	activeJournalId,
	calendarDays,
	selectedDate,
	onSelectDate,
	onMonthChange,
	onOpenJournal,
	onLockJournal,
	onDeleteJournal,
	onCreateJournal,
}: JournalSidebarProps) {
	const { t } = useTranslation("journal");
	const { weekStart } = useWeekStart();
	const [journalToDelete, setJournalToDelete] = useState<JournalSummary | null>(null);

	const datesWithEntries = new Set(
		calendarDays.filter((d) => d.hasEntry).map((d) => d.date)
	);

	const selectedDateObj = selectedDate
		? new Date(selectedDate + "T12:00:00")
		: new Date();

	// The displayed month is controlled so it can be driven by our own shadcn
	// Select dropdowns and the prev/next arrows.
	const [displayMonth, setDisplayMonth] = useState<Date>(selectedDateObj);
	const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate);

	// Jump the visible month when the selected date moves to another month.
	// Adjusting state during render is React's recommended alternative to an effect.
	if (selectedDate !== prevSelectedDate) {
		setPrevSelectedDate(selectedDate);
		if (
			selectedDateObj.getFullYear() !== displayMonth.getFullYear() ||
			selectedDateObj.getMonth() !== displayMonth.getMonth()
		) {
			setDisplayMonth(selectedDateObj);
		}
	}

	const goToMonth = useCallback(
		(next: Date) => {
			setDisplayMonth(next);
			onMonthChange(next.getFullYear(), next.getMonth() + 1);
		},
		[onMonthChange]
	);

	function handleDateSelect(date: Date | undefined) {
		if (!date) return;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		onSelectDate(`${year}-${month}-${day}`);
	}

	const monthOptions = Array.from({ length: 12 }, (_, i) => ({
		value: i,
		label: t(`calendar.monthsShort.${i}`),
	}));

	const currentYear = new Date().getFullYear();
	// Newest first, reaching back far enough for old journals.
	const yearOptions = Array.from({ length: 106 }, (_, i) => currentYear + 5 - i);

	const formatters = {
		formatWeekdayName: (date: Date) => {
			const dayIndex = date.getDay();
			return t(`calendar.weekDaysShort.${dayIndex}`);
		},
	};

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
			{/* Header */}
			<div className="flex flex-row items-center gap-2 p-5 pb-2">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<LayoutDashboard className="size-4" />
				</div>
				<div className="flex min-w-0 flex-col gap-0.5 leading-none">
					<span className="truncate font-bold tracking-tight text-sidebar-foreground">
						My Journal
					</span>
					<span className="truncate text-[10px] text-muted-foreground uppercase tracking-widest">
						{t("sidebar.workspace")}
					</span>
				</div>
			</div>

			{/* Content */}
			<div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pb-4">
				{/* Calendar section */}
				<div className="mt-4">
					<div className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						{t("sidebar.calendar", "Calendario")}
					</div>
					<div className="mx-auto mt-2 w-full min-w-0 max-w-2xs rounded-xl border border-border/50 bg-background/50 p-2 shadow-sm">
						{/* Month / year navigation */}
						<div className="mb-1 flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
								onClick={() =>
									goToMonth(
										new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1)
									)
								}
								aria-label={t("calendar.prevMonth", "Mes anterior")}
							>
								<ChevronLeft className="size-4" />
							</Button>
							<div className="flex flex-1 items-center justify-center gap-1.5">
								<Select
									value={displayMonth.getMonth().toString()}
									onValueChange={(v) =>
										goToMonth(new Date(displayMonth.getFullYear(), Number(v), 1))
									}
								>
									<SelectTrigger
										size="sm"
										aria-label={t("calendar.month", "Mes")}
										className="gap-1 px-2 font-medium"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="max-h-72">
										{monthOptions.map((m) => (
											<SelectItem key={m.value} value={m.value.toString()}>
												{m.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select
									value={displayMonth.getFullYear().toString()}
									onValueChange={(v) =>
										goToMonth(new Date(Number(v), displayMonth.getMonth(), 1))
									}
								>
									<SelectTrigger
										size="sm"
										aria-label={t("calendar.year", "Año")}
										className="gap-1 px-2 font-medium"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="max-h-72">
										{yearOptions.map((y) => (
											<SelectItem key={y} value={y.toString()}>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
								onClick={() =>
									goToMonth(
										new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1)
									)
								}
								aria-label={t("calendar.nextMonth", "Mes siguiente")}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>

						<Calendar
							mode="single"
							month={displayMonth}
							onMonthChange={goToMonth}
							selected={selectedDateObj}
							onSelect={handleDateSelect}
							modifiers={{
								hasEntry: (date) => {
									const y = date.getFullYear();
									const m = String(date.getMonth() + 1).padStart(2, "0");
									const d = String(date.getDate()).padStart(2, "0");
									return datesWithEntries.has(`${y}-${m}-${d}`);
								},
							}}
							weekStartsOn={weekStart}
							formatters={formatters}
							modifiersClassNames={{
								hasEntry:
									"relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary font-medium text-primary",
							}}
							classNames={{
								month_grid: "block w-full border-collapse",
								weeks: "block",
								month_caption: "hidden",
								nav: "hidden",
							}}
							className="w-full p-0"
						/>
					</div>
				</div>

				{/* Journals section */}
				<div className="mt-6">
					<div className="flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						<span>{t("sidebar.journals", "Tus diarios")}</span>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
							onClick={onCreateJournal}
							title={t("sidebar.newJournal")}
						>
							<Plus className="size-3.5" />
						</Button>
					</div>
					<motion.ul
						className="mt-2 space-y-1"
						variants={journalListContainer}
						initial="hidden"
						animate="show"
					>
						{journals.map((journal) => {
							const isActive = journal.id === activeJournalId;
							return (
								<motion.li
									key={journal.id}
									variants={journalListItem}
									className="group/item relative flex items-center"
								>
									<button
										onClick={() => onOpenJournal(journal.id)}
										className={cn(
											"flex h-10 w-full items-center gap-2 rounded-lg border border-transparent px-3 text-left text-sm transition-all",
											isActive
												? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary hover:text-primary-foreground"
												: "hover:bg-muted/60 text-sidebar-foreground"
										)}
									>
										<BookText
											className={cn(
												"size-4 shrink-0 transition-colors",
												isActive
													? ""
													: "text-muted-foreground group-hover/item:text-primary"
											)}
										/>
										<span className="flex-1 truncate">{journal.name}</span>
									</button>
									{journal.privacy === "private" && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												if (!journal.isLocked) {
													onLockJournal(journal.id);
												}
											}}
											className={cn(
												"absolute right-6 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/item:opacity-100",
												isActive
													? "hover:bg-primary-foreground/20 text-primary-foreground/80"
													: "hover:bg-muted-foreground/20 text-muted-foreground"
											)}
											title={journal.isLocked ? t("journal.locked") : t("journal.lock")}
										>
											{journal.isLocked ? (
												<Lock className="size-3.5" />
											) : (
												<Unlock className="size-3.5" />
											)}
										</button>
									)}
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setJournalToDelete(journal);
										}}
										className={cn(
											"absolute right-1 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/item:opacity-100",
											isActive
												? "hover:bg-destructive/20 text-primary-foreground/80"
												: "hover:bg-destructive/20 text-muted-foreground"
										)}
										title={t("journal.delete")}
									>
										<Trash2 className="size-3.5" />
									</button>
								</motion.li>
							);
						})}
					</motion.ul>
				</div>
			</div>

			{/* Footer */}
			<div className="flex flex-row items-center justify-between border-t border-border/40 p-4 bg-sidebar">
				<div className="flex gap-1.5">
					<ThemeToggle />
					<LanguageSwitch />
				</div>
			</div>

			<AlertDialog
				open={!!journalToDelete}
				onOpenChange={(open) => !open && setJournalToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("journal.delete")}</AlertDialogTitle>
						<AlertDialogDescription>{t("journal.deleteConfirm")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("menu.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => {
								if (journalToDelete) {
									onDeleteJournal(journalToDelete.id);
									setJournalToDelete(null);
								}
							}}
						>
							{t("journal.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
