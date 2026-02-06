export type CyclePhase = "period" | "fertile" | "ovulation" | "regular";

export type CycleInfo = {
	currentDay: number;
	phase: CyclePhase;
	nextPeriodDate: Date | null;
	ovulationDate: Date | null;
	fertileWindowStart: Date | null;
	fertileWindowEnd: Date | null;
	isPeriodActive: boolean;
};

export function calculateCycleDay(lastPeriodStart: string | null): number {
	if (!lastPeriodStart) return 0;

	const start = new Date(lastPeriodStart);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	start.setHours(0, 0, 0, 0);

	const diffTime = today.getTime() - start.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	return diffDays + 1; // Day 1 is the first day of period
}

export function getCyclePhase(
	cycleDay: number,
	cycleLength: number,
	periodLength: number
): CyclePhase {
	if (cycleDay <= 0) return "regular";
	if (cycleDay <= periodLength) return "period";

	const ovulationDay = cycleLength - 14;
	const fertileStart = ovulationDay - 5;
	const fertileEnd = ovulationDay + 1;

	if (cycleDay === ovulationDay) return "ovulation";
	if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return "fertile";

	return "regular";
}

export function calculateOvulationDate(
	lastPeriodStart: string | null,
	cycleLength: number
): Date | null {
	if (!lastPeriodStart) return null;

	const start = new Date(lastPeriodStart);
	const ovulationDay = cycleLength - 14;
	const ovulationDate = new Date(start);
	ovulationDate.setDate(start.getDate() + ovulationDay - 1);

	return ovulationDate;
}

export function calculateFertileWindow(
	lastPeriodStart: string | null,
	cycleLength: number
): { start: Date; end: Date } | null {
	if (!lastPeriodStart) return null;

	const ovulationDate = calculateOvulationDate(lastPeriodStart, cycleLength);
	if (!ovulationDate) return null;

	const fertileStart = new Date(ovulationDate);
	fertileStart.setDate(ovulationDate.getDate() - 5);

	const fertileEnd = new Date(ovulationDate);
	fertileEnd.setDate(ovulationDate.getDate() + 1);

	return { start: fertileStart, end: fertileEnd };
}

export function calculateNextPeriodDate(
	lastPeriodStart: string | null,
	cycleLength: number
): Date | null {
	if (!lastPeriodStart) return null;

	const start = new Date(lastPeriodStart);
	const nextPeriod = new Date(start);
	nextPeriod.setDate(start.getDate() + cycleLength);

	return nextPeriod;
}

export function getDaysUntilNextPeriod(
	lastPeriodStart: string | null,
	cycleLength: number
): number {
	const nextPeriod = calculateNextPeriodDate(lastPeriodStart, cycleLength);
	if (!nextPeriod) return 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const diffTime = nextPeriod.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return Math.max(0, diffDays);
}

export function getCycleInfo(
	lastPeriodStart: string | null,
	cycleLength: number,
	periodLength: number,
	periodEndDate: string | null
): CycleInfo {
	const currentDay = calculateCycleDay(lastPeriodStart);
	const phase = getCyclePhase(currentDay, cycleLength, periodLength);
	const nextPeriodDate = calculateNextPeriodDate(lastPeriodStart, cycleLength);
	const ovulationDate = calculateOvulationDate(lastPeriodStart, cycleLength);
	const fertileWindow = calculateFertileWindow(lastPeriodStart, cycleLength);

	// Period is active if we're in period phase AND period hasn't been ended
	const isPeriodActive = phase === "period" && !periodEndDate;

	return {
		currentDay,
		phase,
		nextPeriodDate,
		ovulationDate,
		fertileWindowStart: fertileWindow?.start || null,
		fertileWindowEnd: fertileWindow?.end || null,
		isPeriodActive,
	};
}

export function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

export function formatDisplayDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function getPhaseForDate(
	date: Date,
	lastPeriodStart: string | null,
	cycleLength: number,
	periodLength: number
): CyclePhase {
	if (!lastPeriodStart) return "regular";

	const start = new Date(lastPeriodStart);
	start.setHours(0, 0, 0, 0);
	date.setHours(0, 0, 0, 0);

	const diffTime = date.getTime() - start.getTime();
	const cycleDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

	// Handle dates before period start
	if (cycleDay <= 0) return "regular";

	// Handle dates beyond current cycle (wrap around)
	const adjustedDay = ((cycleDay - 1) % cycleLength) + 1;

	return getCyclePhase(adjustedDay, cycleLength, periodLength);
}
