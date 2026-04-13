import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarMenuAction,
} from "@/components/ui/sidebar";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookText, Plus, Lock, Unlock, LayoutDashboard } from "lucide-react";
import type { JournalSummary, CalendarDayState } from "@/types/journal";
import { useWeekStart } from "@/hooks/useWeekStart";
import { cn } from "@/lib/utils";

interface JournalSidebarProps {
	journals: JournalSummary[];
	activeJournalId: string | null;
	calendarDays: CalendarDayState[];
	selectedDate: string;
	onSelectDate: (date: string) => void;
	onMonthChange: (year: number, month: number) => void;
	onOpenJournal: (id: string) => void;
	onLockJournal: (id: string) => void;
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
	onCreateJournal,
}: JournalSidebarProps) {
	const { t } = useTranslation("journal");
	const { weekStart } = useWeekStart();

	const datesWithEntries = new Set(
		calendarDays.filter((d) => d.hasEntry).map((d) => d.date),
	);

	const selectedDateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();

	function handleDateSelect(date: Date | undefined) {
		if (!date) return;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		onSelectDate(`${year}-${month}-${day}`);
	}

	function handleMonthChange(month: Date) {
		onMonthChange(month.getFullYear(), month.getMonth() + 1);
	}

	// Create formatters for translated calendar
	const formatters = {
		formatMonthDropdown: (date: Date) => {
			const month = date.getMonth();
			return t(`calendar.monthsShort.${month}`);
		},
		formatCaption: (date: Date) => {
			const month = t(`calendar.months.${date.getMonth()}`);
			return `${month} ${date.getFullYear()}`;
		},
		formatWeekdayName: (date: Date) => {
			const dayIndex = date.getDay();
			return t(`calendar.weekDaysShort.${dayIndex}`);
		},
		formatYearDropdown: (date: Date) => {
			return date.getFullYear().toString();
		},
	};

	return (
		<Sidebar className="border-r border-border/40 bg-sidebar">
			<SidebarHeader className="flex flex-row items-center gap-2 p-5 pb-2">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<LayoutDashboard className="size-4" />
				</div>
				<div className="flex flex-col gap-0.5 leading-none">
					<span className="font-bold tracking-tight text-sidebar-foreground">My Journal</span>
				<span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t("sidebar.workspace")}</span>
				</div>
			</SidebarHeader>

			<SidebarContent className="px-3 pb-4">
				{/* Calendar section */}
				<SidebarGroup className="mt-4">
					<SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
						{t("sidebar.calendar", "Calendario")}
					</SidebarGroupLabel>
					<SidebarGroupContent className="mt-2 rounded-xl border border-border/50 bg-background/50 shadow-sm">
						<Calendar
							mode="single"
							selected={selectedDateObj}
							onSelect={handleDateSelect}
							onMonthChange={handleMonthChange}
							modifiers={{
								hasEntry: (date) => {
									const y = date.getFullYear();
									const m = String(date.getMonth() + 1).padStart(2, "0");
									const d = String(date.getDate()).padStart(2, "0");
									return datesWithEntries.has(`${y}-${m}-${d}`);
								},
							}}
							animate={true}
							weekStartsOn={weekStart}
							captionLayout="dropdown"
							formatters={formatters}
							modifiersClassNames={{
								hasEntry: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary font-medium text-primary",
							}}
							className="w-full p-2"
						/>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Journals section */}
				<SidebarGroup className="mt-6">
					<SidebarGroupLabel className="flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
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
					</SidebarGroupLabel>
					<SidebarGroupContent className="mt-2 space-y-1">
						<SidebarMenu>
							{journals.map((journal) => (
								<SidebarMenuItem className="flex items-center" key={journal.id}>
									<SidebarMenuButton
										isActive={journal.id === activeJournalId}
										onClick={() => onOpenJournal(journal.id)}
										className={cn(
											"h-10 rounded-lg border border-transparent px-3 text-sm transition-all",
											journal.id === activeJournalId
												? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary hover:text-primary-foreground"
												: "hover:bg-muted/60 text-sidebar-foreground group"
										)}
									>
										<BookText className={cn("size-4 shrink-0 transition-colors", journal.id === activeJournalId ? "" : "text-muted-foreground group-hover:text-primary")} />
										<span className="flex-1 truncate">{journal.name}</span>
									</SidebarMenuButton>
									{journal.privacy === "private" && (
										<SidebarMenuAction
											showOnHover
											onClick={(e) => {
												e.stopPropagation();
												if (!journal.isLocked) {
													onLockJournal(journal.id);
												}
											}}
											className={cn("top-[50%]! translate-y-[-50%]",
												journal.id === activeJournalId
													? "hover:bg-primary-foreground/20 text-primary-foreground/80"
													: "hover:bg-muted-foreground/20 text-muted-foreground"
											)}
											title={
												journal.isLocked
													? t("journal.locked")
													: t("journal.lock")
											}
										>
											{journal.isLocked ? (
												<Lock className="size-3.5" />
											) : (
												<Unlock className="size-3.5" />
											)}
										</SidebarMenuAction>
									)}
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="flex flex-row items-center justify-between border-t border-border/40 p-4 bg-sidebar">
				<div className="flex gap-1.5">
					<ThemeToggle />
					<LanguageSwitch />
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}
