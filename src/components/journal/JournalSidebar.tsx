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
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitch } from "@/components/language-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, Plus, Lock, Unlock } from "lucide-react";
import type { JournalSummary, CalendarDayState } from "@/types/journal";

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

	const datesWithEntries = new Set(
		calendarDays.filter((d) => d.hasEntry).map((d) => d.date),
	);

	const selectedDateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();

	function handleDateSelect(date: Date | undefined) {
		if (!date) return;
		const iso = date.toISOString().split("T")[0];
		onSelectDate(iso);
	}

	function handleMonthChange(month: Date) {
		onMonthChange(month.getFullYear(), month.getMonth() + 1);
	}

	return (
		<Sidebar>
			<SidebarHeader className="p-4">
				<h1 className="text-lg font-bold text-foreground">My Journal</h1>
			</SidebarHeader>

			<SidebarContent>
				{/* Calendar section */}
				<SidebarGroup>
					<SidebarGroupLabel>{t("sidebar.calendar")}</SidebarGroupLabel>
					<SidebarGroupContent className="px-2">
						<Calendar
							mode="single"
							selected={selectedDateObj}
							onSelect={handleDateSelect}
							onMonthChange={handleMonthChange}
							modifiers={{
								hasEntry: (date) => {
									const iso = date.toISOString().split("T")[0];
									return datesWithEntries.has(iso);
								},
							}}
							modifiersClassNames={{
								hasEntry:
									"bg-primary/20 font-bold text-primary",
							}}
							className="w-full"
						/>
					</SidebarGroupContent>
				</SidebarGroup>

				<Separator />

				{/* Journals section */}
				<SidebarGroup>
					<SidebarGroupLabel>
						<span className="flex-1">{t("sidebar.journals")}</span>
						<Button
							variant="ghost"
							size="icon"
							className="size-6"
							onClick={onCreateJournal}
							title={t("sidebar.newJournal")}
						>
							<Plus className="size-4" />
						</Button>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{journals.map((journal) => (
								<SidebarMenuItem key={journal.id}>
									<SidebarMenuButton
										isActive={journal.id === activeJournalId}
										onClick={() => onOpenJournal(journal.id)}
									>
										<BookOpen className="size-4" />
										<span className="flex-1 truncate">
											{journal.name}
										</span>
										{journal.privacy === "private" && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													if (!journal.isLocked) {
														onLockJournal(journal.id);
													}
												}}
												className="text-muted-foreground hover:text-foreground"
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
											</button>
										)}
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="flex flex-row items-center gap-2 p-4">
				<ThemeToggle />
				<LanguageSwitch />
			</SidebarFooter>
		</Sidebar>
	);
}
