import React, { useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from "react-native";
import { useColors, Colors, typography, spacing } from "../theme";
import { useLanguage } from "../../../../i18n";
import { CyclePhase, getPhaseForDate, formatDate } from "../utils/cycleCalculations";
import { DailyLog } from "../database";

type CalendarGridProps = {
	year: number;
	month: number;
	lastPeriodStart: string | null;
	cycleLength: number;
	periodLength: number;
	logs: DailyLog[];
	onDayPress: (date: string) => void;
};

const { width } = Dimensions.get("window");
const DAY_SIZE = (width - spacing.lg * 2 - spacing.xs * 6) / 7;

const WEEKDAY_KEYS = ["mo", "tu", "we", "th", "fr", "sa", "su"];

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			paddingHorizontal: spacing.lg,
		},
		weekdayRow: {
			flexDirection: "row",
			marginBottom: spacing.sm,
		},
		weekdayCell: {
			width: DAY_SIZE,
			alignItems: "center",
			marginHorizontal: spacing.xs / 2,
		},
		weekdayText: {
			...typography.caption1,
			color: colors.textSecondary,
			textTransform: "uppercase",
		},
		weekRow: {
			flexDirection: "row",
			marginBottom: spacing.xs,
		},
		day: {
			width: DAY_SIZE,
			height: DAY_SIZE,
			borderRadius: DAY_SIZE / 2,
			alignItems: "center",
			justifyContent: "center",
			marginHorizontal: spacing.xs / 2,
			backgroundColor: "transparent",
		},
		emptyDay: {
			width: DAY_SIZE,
			height: DAY_SIZE,
			marginHorizontal: spacing.xs / 2,
		},
		periodDay: {
			backgroundColor: colors.period,
		},
		fertileDay: {
			backgroundColor: colors.fertile,
		},
		ovulationDay: {
			backgroundColor: colors.ovulation,
		},
		today: {
			borderWidth: 2,
			borderColor: colors.textPrimary,
		},
		dayText: {
			...typography.callout,
			color: colors.textPrimary,
		},
		dayTextActive: {
			color: colors.white,
			fontWeight: "600",
		},
		logIndicator: {
			position: "absolute",
			bottom: 4,
			width: 4,
			height: 4,
			borderRadius: 2,
			backgroundColor: colors.textSecondary,
		},
	}), [colors]);
}

export default function CalendarGrid({
	year,
	month,
	lastPeriodStart,
	cycleLength,
	periodLength,
	logs,
	onDayPress,
}: CalendarGridProps) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = formatDate(today);

	const firstDayOfMonth = new Date(year, month - 1, 1);
	const lastDayOfMonth = new Date(year, month, 0);
	const daysInMonth = lastDayOfMonth.getDate();

	// Get the day of week (0 = Sunday, adjust for Monday start)
	let startDay = firstDayOfMonth.getDay() - 1;
	if (startDay < 0) startDay = 6;

	const logsMap = new Map(logs.map((log) => [log.date, log]));

	const weeks: (number | null)[][] = [];
	let currentWeek: (number | null)[] = [];

	// Add empty cells for days before the 1st
	for (let i = 0; i < startDay; i++) {
		currentWeek.push(null);
	}

	// Add days of the month
	for (let day = 1; day <= daysInMonth; day++) {
		currentWeek.push(day);
		if (currentWeek.length === 7) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
	}

	// Fill the last week with empty cells
	if (currentWeek.length > 0) {
		while (currentWeek.length < 7) {
			currentWeek.push(null);
		}
		weeks.push(currentWeek);
	}

	const getPhaseForDay = (day: number): CyclePhase => {
		const date = new Date(year, month - 1, day);
		return getPhaseForDate(date, lastPeriodStart, cycleLength, periodLength);
	};

	const getDateString = (day: number): string => {
		return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
	};

	const getDayStyle = (day: number, phase: CyclePhase, isToday: boolean) => {
		const baseStyle: any[] = [styles.day];

		if (phase === "period") {
			baseStyle.push(styles.periodDay);
		} else if (phase === "fertile") {
			baseStyle.push(styles.fertileDay);
		} else if (phase === "ovulation") {
			baseStyle.push(styles.ovulationDay);
		}

		if (isToday) {
			baseStyle.push(styles.today);
		}

		return baseStyle;
	};

	const getDayTextStyle = (phase: CyclePhase, isToday: boolean) => {
		const baseStyle: any[] = [styles.dayText];

		if (phase !== "regular" || isToday) {
			baseStyle.push(styles.dayTextActive);
		}

		return baseStyle;
	};

	return (
		<View style={styles.container}>
			{/* Weekday headers */}
			<View style={styles.weekdayRow}>
				{WEEKDAY_KEYS.map((key) => (
					<View key={key} style={styles.weekdayCell}>
						<Text style={styles.weekdayText}>{t(key)}</Text>
					</View>
				))}
			</View>

			{/* Calendar grid */}
			{weeks.map((week, weekIndex) => (
				<View key={weekIndex} style={styles.weekRow}>
					{week.map((day, dayIndex) => {
						if (day === null) {
							return <View key={dayIndex} style={styles.emptyDay} />;
						}

						const dateStr = getDateString(day);
						const phase = getPhaseForDay(day);
						const isToday = dateStr === todayStr;
						const hasLog = logsMap.has(dateStr);

						return (
							<TouchableOpacity
								key={dayIndex}
								style={getDayStyle(day, phase, isToday)}
								onPress={() => onDayPress(dateStr)}
								activeOpacity={0.7}
							>
								<Text style={getDayTextStyle(phase, isToday)}>{day}</Text>
								{hasLog && <View style={styles.logIndicator} />}
							</TouchableOpacity>
						);
					})}
				</View>
			))}
		</View>
	);
}
