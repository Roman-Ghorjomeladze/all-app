import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	View,
	Text,
	Modal,
	Pressable,
	TouchableOpacity,
	StyleSheet,
	Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../theme";
import { useLanguage } from "../i18n";

type CalendarPickerProps = {
	visible: boolean;
	value: Date;
	onSelect: (date: Date) => void;
	onCancel: () => void;
	accentColor: string;
	minimumDate?: Date;
	maximumDate?: Date;
};

const MONTH_KEYS = [
	"january", "february", "march", "april", "may", "june",
	"july", "august", "september", "october", "november", "december",
];

const WEEKDAY_KEYS = ["mo", "tu", "we", "th", "fr", "sa", "su"];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 48, 360);
const GRID_PADDING = 16;
const DAY_GAP = 4;
const DAY_SIZE = Math.floor((MODAL_WIDTH - GRID_PADDING * 2 - DAY_GAP * 6) / 7);

function stripTime(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function buildWeeks(year: number, month: number): (number | null)[][] {
	const firstDay = new Date(year, month, 1);
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	// Monday-first: getDay() returns 0=Sun, we want Mon=0
	let startOffset = firstDay.getDay() - 1;
	if (startOffset < 0) startOffset = 6;

	const weeks: (number | null)[][] = [];
	let week: (number | null)[] = [];

	for (let i = 0; i < startOffset; i++) week.push(null);

	for (let day = 1; day <= daysInMonth; day++) {
		week.push(day);
		if (week.length === 7) {
			weeks.push(week);
			week = [];
		}
	}

	if (week.length > 0) {
		while (week.length < 7) week.push(null);
		weeks.push(week);
	}

	return weeks;
}

export default function CalendarPicker({
	visible,
	value,
	onSelect,
	onCancel,
	accentColor,
	minimumDate,
	maximumDate,
}: CalendarPickerProps) {
	const { mode } = useThemeMode();
	const { t } = useLanguage();
	const isDark = mode === "dark";

	const palette = useMemo(() => ({
		overlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)",
		cardBackground: isDark ? "#2A273F" : "#FFFFFF",
		textPrimary: isDark ? "#D9E0EE" : "#1C1C1E",
		textSecondary: isDark ? "#6C6F93" : "#8E8E93",
		border: isDark ? "#3A375C" : "#E5E5EA",
		todayRing: isDark ? "#8BE9FD" : "#2196F3",
		white: "#FFFFFF",
		navBackground: isDark ? "#3A375C" : "#F2F2F7",
	}), [isDark]);

	const [displayYear, setDisplayYear] = useState(value.getFullYear());
	const [displayMonth, setDisplayMonth] = useState(value.getMonth());
	const [selectedDate, setSelectedDate] = useState<Date>(stripTime(value));

	useEffect(() => {
		if (visible) {
			setDisplayYear(value.getFullYear());
			setDisplayMonth(value.getMonth());
			setSelectedDate(stripTime(value));
		}
	}, [visible]);

	const weeks = useMemo(() => buildWeeks(displayYear, displayMonth), [displayYear, displayMonth]);

	const today = useMemo(() => stripTime(new Date()), []);

	const minDay = minimumDate ? stripTime(minimumDate) : null;
	const maxDay = maximumDate ? stripTime(maximumDate) : null;

	const canGoBack = useMemo(() => {
		if (!minDay) return true;
		return displayYear > minDay.getFullYear() || (displayYear === minDay.getFullYear() && displayMonth > minDay.getMonth());
	}, [displayYear, displayMonth, minDay]);

	const canGoForward = useMemo(() => {
		if (!maxDay) return true;
		return displayYear < maxDay.getFullYear() || (displayYear === maxDay.getFullYear() && displayMonth < maxDay.getMonth());
	}, [displayYear, displayMonth, maxDay]);

	const goBack = useCallback(() => {
		if (!canGoBack) return;
		if (displayMonth === 0) {
			setDisplayMonth(11);
			setDisplayYear((y) => y - 1);
		} else {
			setDisplayMonth((m) => m - 1);
		}
	}, [canGoBack, displayMonth]);

	const goForward = useCallback(() => {
		if (!canGoForward) return;
		if (displayMonth === 11) {
			setDisplayMonth(0);
			setDisplayYear((y) => y + 1);
		} else {
			setDisplayMonth((m) => m + 1);
		}
	}, [canGoForward, displayMonth]);

	const isDayDisabled = useCallback(
		(day: number): boolean => {
			const d = new Date(displayYear, displayMonth, day);
			if (minDay && d < minDay) return true;
			if (maxDay && d > maxDay) return true;
			return false;
		},
		[displayYear, displayMonth, minDay, maxDay],
	);

	const handleDayPress = useCallback(
		(day: number) => {
			if (isDayDisabled(day)) return;
			setSelectedDate(new Date(displayYear, displayMonth, day));
		},
		[displayYear, displayMonth, isDayDisabled],
	);

	const handleSelect = useCallback(() => {
		onSelect(selectedDate);
	}, [onSelect, selectedDate]);

	const styles = useStyles(palette, accentColor);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			supportedOrientations={["portrait", "landscape"]}
			onRequestClose={onCancel}
		>
			<Pressable style={styles.overlay} onPress={onCancel}>
				<Pressable style={styles.card} onPress={() => {}}>
					{/* Month/Year Header */}
					<View style={styles.header}>
						<TouchableOpacity
							onPress={goBack}
							activeOpacity={0.7}
							style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
							disabled={!canGoBack}
						>
							<Ionicons
								name="chevron-back"
								size={20}
								color={canGoBack ? accentColor : palette.textSecondary}
							/>
						</TouchableOpacity>

						<Text style={styles.headerTitle}>
							{t(MONTH_KEYS[displayMonth])} {displayYear}
						</Text>

						<TouchableOpacity
							onPress={goForward}
							activeOpacity={0.7}
							style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
							disabled={!canGoForward}
						>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={canGoForward ? accentColor : palette.textSecondary}
							/>
						</TouchableOpacity>
					</View>

					{/* Weekday Labels */}
					<View style={styles.weekdayRow}>
						{WEEKDAY_KEYS.map((key) => (
							<View key={key} style={styles.weekdayCell}>
								<Text style={styles.weekdayText}>{t(key)}</Text>
							</View>
						))}
					</View>

					{/* Calendar Grid */}
					<View style={styles.grid}>
						{weeks.map((week, weekIndex) => (
							<View key={weekIndex} style={styles.weekRow}>
								{week.map((day, dayIndex) => {
									if (day === null) {
										return <View key={dayIndex} style={styles.emptyCell} />;
									}

									const cellDate = new Date(displayYear, displayMonth, day);
									const isToday = isSameDay(cellDate, today);
									const isSelected = isSameDay(cellDate, selectedDate);
									const disabled = isDayDisabled(day);

									return (
										<TouchableOpacity
											key={dayIndex}
											style={[
												styles.dayCell,
												isToday && !isSelected && styles.todayCell,
												isSelected && styles.selectedCell,
											]}
											onPress={() => handleDayPress(day)}
											activeOpacity={0.7}
											disabled={disabled}
										>
											<Text
												style={[
													styles.dayText,
													isToday && !isSelected && styles.todayText,
													isSelected && styles.selectedText,
													disabled && styles.disabledText,
												]}
											>
												{day}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						))}
					</View>

					{/* Bottom Buttons */}
					<View style={styles.buttonRow}>
						<TouchableOpacity onPress={onCancel} activeOpacity={0.7} style={styles.button}>
							<Text style={styles.cancelText}>{t("cancel")}</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={handleSelect} activeOpacity={0.7} style={styles.button}>
							<Text style={styles.selectText}>{t("calendarSelect")}</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

type Palette = {
	overlay: string;
	cardBackground: string;
	textPrimary: string;
	textSecondary: string;
	border: string;
	todayRing: string;
	white: string;
	navBackground: string;
};

function useStyles(palette: Palette, accentColor: string) {
	return useMemo(
		() =>
			StyleSheet.create({
				overlay: {
					flex: 1,
					backgroundColor: palette.overlay,
					justifyContent: "center",
					alignItems: "center",
				},
				card: {
					width: MODAL_WIDTH,
					backgroundColor: palette.cardBackground,
					borderRadius: 20,
					paddingTop: 20,
					paddingBottom: 16,
					paddingHorizontal: GRID_PADDING,
					shadowColor: "#000",
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.15,
					shadowRadius: 20,
					elevation: 10,
				},
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
					paddingHorizontal: 4,
				},
				navButton: {
					width: 36,
					height: 36,
					borderRadius: 18,
					backgroundColor: palette.navBackground,
					justifyContent: "center",
					alignItems: "center",
				},
				navButtonDisabled: {
					opacity: 0.4,
				},
				headerTitle: {
					fontSize: 17,
					fontWeight: "600",
					color: palette.textPrimary,
				},
				weekdayRow: {
					flexDirection: "row",
					marginBottom: 8,
				},
				weekdayCell: {
					width: DAY_SIZE,
					alignItems: "center",
					marginHorizontal: DAY_GAP / 2,
				},
				weekdayText: {
					fontSize: 12,
					fontWeight: "600",
					color: palette.textSecondary,
					textTransform: "uppercase",
				},
				grid: {
					marginBottom: 16,
				},
				weekRow: {
					flexDirection: "row",
					marginBottom: DAY_GAP,
				},
				emptyCell: {
					width: DAY_SIZE,
					height: DAY_SIZE,
					marginHorizontal: DAY_GAP / 2,
				},
				dayCell: {
					width: DAY_SIZE,
					height: DAY_SIZE,
					borderRadius: DAY_SIZE / 2,
					alignItems: "center",
					justifyContent: "center",
					marginHorizontal: DAY_GAP / 2,
				},
				todayCell: {
					borderWidth: 2,
					borderColor: palette.todayRing,
				},
				selectedCell: {
					backgroundColor: accentColor,
				},
				dayText: {
					fontSize: 15,
					fontWeight: "500",
					color: palette.textPrimary,
				},
				todayText: {
					color: palette.todayRing,
					fontWeight: "700",
				},
				selectedText: {
					color: palette.white,
					fontWeight: "700",
				},
				disabledText: {
					color: palette.textSecondary,
					opacity: 0.4,
				},
				buttonRow: {
					flexDirection: "row",
					justifyContent: "flex-end",
					alignItems: "center",
					gap: 24,
					paddingTop: 8,
					borderTopWidth: StyleSheet.hairlineWidth,
					borderTopColor: palette.border,
				},
				button: {
					paddingVertical: 8,
					paddingHorizontal: 4,
				},
				cancelText: {
					fontSize: 16,
					fontWeight: "500",
					color: palette.textSecondary,
				},
				selectText: {
					fontSize: 16,
					fontWeight: "600",
					color: accentColor,
				},
			}),
		[palette, accentColor],
	);
}
