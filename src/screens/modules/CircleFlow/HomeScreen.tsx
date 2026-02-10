import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import CircleWheel from "./components/CircleWheel";
import CalendarGrid from "./components/CalendarGrid";
import { useColors, Colors, typography, spacing } from "./theme";
import { useLanguage } from "../../../i18n";
import {
	initDatabase,
	getCurrentCycle,
	startNewCycle,
	endCurrentPeriod,
	getSettings,
	getLogsForMonth,
	Cycle,
	DailyLog,
	Settings,
} from "./database";
import {
	getCycleInfo,
	formatDate,
	getDaysUntilNextPeriod,
	CycleInfo,
} from "./utils/cycleCalculations";

type ViewMode = "circle" | "calendar";

function useStyles(colors: Colors) {
	return useMemo(() => StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		scrollContent: {
			paddingBottom: spacing.xl,
		},
		loadingContainer: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},
		loadingText: {
			...typography.body,
			color: colors.textSecondary,
		},
		header: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			paddingVertical: spacing.md,
		},
		headerTitle: {
			...typography.largeTitle,
			color: colors.textPrimary,
			flex: 1,
			marginRight: spacing.sm,
		},
		addButton: {
			padding: spacing.xs,
		},
		dateHeader: {
			alignItems: "center",
			paddingBottom: spacing.md,
		},
		dateText: {
			...typography.title2,
			color: colors.textPrimary,
		},
		cycleDay: {
			...typography.subhead,
			color: colors.textSecondary,
			marginTop: spacing.xs,
		},
		toggleContainer: {
			flexDirection: "row",
			marginHorizontal: spacing.lg,
			marginBottom: spacing.lg,
			backgroundColor: colors.cardBackground,
			borderRadius: 10,
			padding: 4,
		},
		toggleButton: {
			flex: 1,
			paddingVertical: spacing.sm,
			alignItems: "center",
			borderRadius: 8,
		},
		toggleButtonActive: {
			backgroundColor: colors.period,
		},
		toggleText: {
			...typography.subhead,
			color: colors.textSecondary,
		},
		toggleTextActive: {
			color: colors.white,
			fontWeight: "600",
		},
		circleContainer: {
			alignItems: "center",
			paddingVertical: spacing.lg,
		},
		calendarContainer: {
			paddingVertical: spacing.md,
		},
		monthNav: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			paddingHorizontal: spacing.lg,
			marginBottom: spacing.md,
		},
		monthNavButton: {
			padding: spacing.sm,
		},
		monthNavText: {
			fontSize: 28,
			color: colors.period,
		},
		monthTitle: {
			...typography.title3,
			color: colors.textPrimary,
		},
		legend: {
			flexDirection: "row",
			justifyContent: "center",
			gap: spacing.lg,
			marginTop: spacing.lg,
			marginBottom: spacing.md,
		},
		legendItem: {
			flexDirection: "row",
			alignItems: "center",
			gap: spacing.xs,
		},
		legendDot: {
			width: 12,
			height: 12,
			borderRadius: 6,
		},
		legendText: {
			...typography.caption1,
			color: colors.textSecondary,
		},
		infoCard: {
			marginHorizontal: spacing.lg,
			marginTop: spacing.md,
			padding: spacing.md,
			backgroundColor: colors.cardBackground,
			borderRadius: 12,
			shadowColor: colors.shadow,
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.05,
			shadowRadius: 8,
			elevation: 2,
		},
		infoTitle: {
			...typography.headline,
			color: colors.textPrimary,
			textAlign: "center",
		},
		infoSubtitle: {
			...typography.subhead,
			color: colors.textSecondary,
			textAlign: "center",
			marginTop: spacing.xs,
		},
		actionButton: {
			marginHorizontal: spacing.lg,
			marginTop: spacing.lg,
			paddingVertical: spacing.md,
			backgroundColor: colors.textSecondary,
			borderRadius: 12,
			alignItems: "center",
		},
		startButton: {
			backgroundColor: colors.period,
		},
		actionButtonText: {
			...typography.headline,
			color: colors.white,
		},
	}), [colors]);
}

export default function HomeScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();
	const [viewMode, setViewMode] = useState<ViewMode>("circle");
	const [settings, setSettings] = useState<Settings | null>(null);
	const [currentCycle, setCurrentCycle] = useState<Cycle | null>(null);
	const [cycleInfo, setCycleInfo] = useState<CycleInfo | null>(null);
	const [logs, setLogs] = useState<DailyLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const today = new Date();
	const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
	const [calendarYear, setCalendarYear] = useState(today.getFullYear());

	const loadData = useCallback(async () => {
		try {
			await initDatabase();
			const [settingsData, cycleData, logsData] = await Promise.all([
				getSettings(),
				getCurrentCycle(),
				getLogsForMonth(calendarYear, calendarMonth),
			]);

			setSettings(settingsData);
			setCurrentCycle(cycleData);
			setLogs(logsData);

			if (settingsData) {
				const info = getCycleInfo(
					settingsData.last_period_start,
					settingsData.average_cycle_length,
					settingsData.average_period_length,
					cycleData?.end_date || null
				);
				setCycleInfo(info);
			}
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [calendarYear, calendarMonth]);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	useEffect(() => {
		loadData();
	}, [calendarYear, calendarMonth]);

	const handleStartPeriod = async () => {
		Alert.alert(t("startPeriodTitle"), t("startPeriodMessage"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("yes"),
				onPress: async () => {
					await startNewCycle(formatDate(new Date()));
					loadData();
				},
			},
		]);
	};

	const handleEndPeriod = async () => {
		Alert.alert(t("endPeriodTitle"), t("endPeriodMessage"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("yes"),
				onPress: async () => {
					await endCurrentPeriod(formatDate(new Date()));
					loadData();
				},
			},
		]);
	};

	const handleDayPress = (date: string) => {
		console.log("Day pressed:", date);
	};

	const changeMonth = (delta: number) => {
		let newMonth = calendarMonth + delta;
		let newYear = calendarYear;

		if (newMonth > 12) {
			newMonth = 1;
			newYear++;
		} else if (newMonth < 1) {
			newMonth = 12;
			newYear--;
		}

		setCalendarMonth(newMonth);
		setCalendarYear(newYear);
	};

	const getMonthName = (month: number): string => {
		const monthKeys = [
			"january", "february", "march", "april", "may", "june",
			"july", "august", "september", "october", "november", "december"
		];
		return t(monthKeys[month - 1]);
	};

	const formatDisplayDate = (date: Date): string => {
		const day = date.getDate();
		const month = getMonthName(date.getMonth() + 1);
		const year = date.getFullYear();
		return `${day} ${month}, ${year}`;
	};

	const formatShortDate = (date: Date): string => {
		const day = date.getDate();
		const month = getMonthName(date.getMonth() + 1);
		return `${day} ${month}`;
	};

	if (isLoading) {
		return (
			<SafeAreaView style={styles.container} edges={["top"]}>
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>{t("loading")}</Text>
				</View>
			</SafeAreaView>
		);
	}

	const cycleLength = settings?.average_cycle_length || 28;
	const periodLength = settings?.average_period_length || 5;
	const daysUntilPeriod = getDaysUntilNextPeriod(settings?.last_period_start || null, cycleLength);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle} numberOfLines={1}>{t("cfTitle")}</Text>
				<TouchableOpacity
					onPress={cycleInfo?.isPeriodActive ? handleEndPeriod : handleStartPeriod}
					activeOpacity={0.7}
					style={styles.addButton}
				>
					<Ionicons
						name={cycleInfo?.isPeriodActive ? "stop-circle" : "add-circle"}
						size={32}
						color={colors.period}
					/>
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* Date Info */}
				<View style={styles.dateHeader}>
					<Text style={styles.dateText}>{formatDisplayDate(today)}</Text>
					{cycleInfo && cycleInfo.currentDay > 0 && (
						<Text style={styles.cycleDay}>
							{t("dayOf", { current: cycleInfo.currentDay, total: cycleLength })}
						</Text>
					)}
				</View>

				{/* View Mode Toggle */}
				<View style={styles.toggleContainer}>
					<TouchableOpacity
						style={[styles.toggleButton, viewMode === "circle" && styles.toggleButtonActive]}
						onPress={() => setViewMode("circle")}
					>
						<Text style={[styles.toggleText, viewMode === "circle" && styles.toggleTextActive]}>
							{t("circle")}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.toggleButton, viewMode === "calendar" && styles.toggleButtonActive]}
						onPress={() => setViewMode("calendar")}
					>
						<Text style={[styles.toggleText, viewMode === "calendar" && styles.toggleTextActive]}>
							{t("calendar")}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Main View */}
				{viewMode === "circle" ? (
					<View style={styles.circleContainer}>
						<CircleWheel
							currentDay={cycleInfo?.currentDay || 0}
							cycleLength={cycleLength}
							periodLength={periodLength}
							phase={cycleInfo?.phase || "regular"}
						/>
					</View>
				) : (
					<View style={styles.calendarContainer}>
						{/* Month Navigation */}
						<View style={styles.monthNav}>
							<TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
								<Text style={styles.monthNavText}>&#8249;</Text>
							</TouchableOpacity>
							<Text style={styles.monthTitle}>
								{getMonthName(calendarMonth)} {calendarYear}
							</Text>
							<TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
								<Text style={styles.monthNavText}>&#8250;</Text>
							</TouchableOpacity>
						</View>

						<CalendarGrid
							year={calendarYear}
							month={calendarMonth}
							lastPeriodStart={settings?.last_period_start || null}
							cycleLength={cycleLength}
							periodLength={periodLength}
							logs={logs}
							onDayPress={handleDayPress}
						/>
					</View>
				)}

				{/* Legend */}
				<View style={styles.legend}>
					<View style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: colors.period }]} />
						<Text style={styles.legendText}>{t("period")}</Text>
					</View>
					<View style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: colors.fertile }]} />
						<Text style={styles.legendText}>{t("fertile")}</Text>
					</View>
					<View style={styles.legendItem}>
						<View style={[styles.legendDot, { backgroundColor: colors.ovulation }]} />
						<Text style={styles.legendText}>{t("ovulation")}</Text>
					</View>
				</View>

				{/* Info Card */}
				<View style={styles.infoCard}>
					{cycleInfo && cycleInfo.currentDay > 0 ? (
						<>
							<Text style={styles.infoTitle}>
								{daysUntilPeriod > 0
									? t("nextPeriodIn", { days: daysUntilPeriod })
									: t("periodMayStart")}
							</Text>
							{cycleInfo.fertileWindowStart && cycleInfo.fertileWindowEnd && (
								<Text style={styles.infoSubtitle}>
									{t("fertileWindow", {
										start: formatShortDate(cycleInfo.fertileWindowStart),
										end: formatShortDate(cycleInfo.fertileWindowEnd),
									})}
								</Text>
							)}
						</>
					) : (
						<Text style={styles.infoTitle}>{t("logToStart")}</Text>
					)}
				</View>

				{/* Action Button */}
				{cycleInfo?.isPeriodActive ? (
					<TouchableOpacity style={styles.actionButton} onPress={handleEndPeriod}>
						<Text style={styles.actionButtonText}>{t("endPeriod")}</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={handleStartPeriod}>
						<Text style={styles.actionButtonText}>{t("logPeriodStart")}</Text>
					</TouchableOpacity>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
