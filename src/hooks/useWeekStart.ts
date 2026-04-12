import { useState, useEffect } from "react";

const WEEK_START_KEY = "journal:weekStart";

export function useWeekStart() {
	const [weekStart, setWeekStartState] = useState<0 | 1>(() => {
		if (typeof window === "undefined") return 1;
		const saved = localStorage.getItem(WEEK_START_KEY);
		return saved === "0" ? 0 : 1;
	});

	useEffect(() => {
		localStorage.setItem(WEEK_START_KEY, weekStart.toString());
	}, [weekStart]);

	const setWeekStart = (value: 0 | 1) => {
		setWeekStartState(value);
	};

	return { weekStart, setWeekStart };
}
