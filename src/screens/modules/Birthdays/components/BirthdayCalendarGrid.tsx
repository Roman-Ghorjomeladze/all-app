import React, { useMemo } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from "react-native";
import { useColors, Colors, typography, spacing } from "../theme";
import { useLanguage } from "../../../../i18n";
import { BirthdayEvent, EventType } from "../database";

type Props = {
	year: number;
	month: number;
	events: BirthdayEvent[];
	selectedDay: number | null;
	onDayPress: (day: number) => void;
};

const { width } = Dimensions.get("window");
const DAY_SIZE = (width - spacing.lg * 2 - spacing.xs * 6) / 7;
const WEEKDAY_KEYS = ["mo", "tu", "we", "th", "fr", "sa", "su"];

function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export default function BirthdayCalendarGrid({ year, month, events, selectedDay, onDayPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = formatDate(today);

	const firstDayOfMonth = new Date(year, month - 1, 1);
	const daysInMonth = new Date(year, month, 0).getDate();

	let startDay = firstDayOfMonth.getDay() - 1;
	if (startDay < 0) startDay = 6;

	// Build a map: day → list of event types
	const dayEventsMap = useMemo(() => {
		const map = new Map<number, EventType[]>();
		for (const event of events) {
			if (event.event_month === month) {
				const existing = map.get(event.event_day) || [];
				existing.push(event.event_type);
				map.set(event.event_day, existing);
			}
		}
		return map;
	}, [events, month]);

	const weeks: (number | null)[][] = [];
	let currentWeek: (number | null)[] = [];

	for (let i = 0; i < startDay; i++) {
		currentWeek.push(null);
	}

	for (let day = 1; day <= daysInMonth; day++) {
		currentWeek.push(day);
		if (currentWeek.length === 7) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
	}

	if (currentWeek.length > 0) {
		while (currentWeek.length < 7) {
			currentWeek.push(null);
		}
		weeks.push(currentWeek);
	}

	const getDateString = (day: number): string => {
		return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
	};

	return (
		<View style={styles.container}>
			<View style={styles.weekdayRow}>
				{WEEKDAY_KEYS.map((key) => (
					<View key={key} style={styles.weekdayCell}>
						<Text style={styles.weekdayText}>{t(key)}</Text>
					</View>
				))}
			</View>

			{weeks.map((week, weekIndex) => (
				<View key={weekIndex} style={styles.weekRow}>
					{week.map((day, dayIndex) => {
						if (day === null) {
							return <View key={dayIndex} style={styles.emptyDay} />;
						}

						const dateStr = getDateString(day);
						const isToday = dateStr === todayStr;
						const isSelected = day === selectedDay;
						const eventTypes = dayEventsMap.get(day);

						return (
							<TouchableOpacity
								key={dayIndex}
								style={[
									styles.day,
									isToday && styles.today,
									isSelected && styles.selected,
								]}
								onPress={() => onDayPress(day)}
								activeOpacity={0.7}
							>
								<Text
									style={[
										styles.dayText,
										isToday && { color: colors.today, fontWeight: "700" },
										isSelected && { color: colors.white, fontWeight: "700" },
									]}
								>
									{day}
								</Text>
								{eventTypes && eventTypes.length > 0 && (
									<View style={styles.dotRow}>
										{eventTypes.slice(0, 3).map((type, i) => {
											const dotColor = colors[type as keyof Colors] as string || colors.accent;
											return <View key={i} style={[styles.dot, { backgroundColor: dotColor }]} />;
										})}
									</View>
								)}
							</TouchableOpacity>
						);
					})}
				</View>
			))}
		</View>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
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
				},
				emptyDay: {
					width: DAY_SIZE,
					height: DAY_SIZE,
					marginHorizontal: spacing.xs / 2,
				},
				today: {
					borderWidth: 2,
					borderColor: colors.today,
				},
				selected: {
					backgroundColor: colors.accent,
				},
				dayText: {
					...typography.callout,
					color: colors.textPrimary,
				},
				dotRow: {
					flexDirection: "row",
					position: "absolute",
					bottom: 4,
					gap: 2,
				},
				dot: {
					width: 5,
					height: 5,
					borderRadius: 2.5,
				},
			}),
		[colors]
	);
}
