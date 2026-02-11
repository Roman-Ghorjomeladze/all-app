import React, { useCallback, useMemo, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
	initDatabase,
	getCurrentStreak,
	getWeekStats,
	getMonthStats,
	getMostUsedWorkout,
} from "../database";
import { useColors, Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";
import StatsCard from "../components/StatsCard";

type StatsData = {
	streak: number;
	weekCount: number;
	weekSeconds: number;
	monthCount: number;
	monthSeconds: number;
	mostUsed: string | null;
};

export default function StatsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const [stats, setStats] = useState<StatsData>({
		streak: 0,
		weekCount: 0,
		weekSeconds: 0,
		monthCount: 0,
		monthSeconds: 0,
		mostUsed: null,
	});

	const loadData = useCallback(async () => {
		await initDatabase();
		const [streak, week, month, mostUsed] = await Promise.all([
			getCurrentStreak(),
			getWeekStats(),
			getMonthStats(),
			getMostUsedWorkout(),
		]);
		setStats({
			streak,
			weekCount: week.count,
			weekSeconds: week.totalSeconds,
			monthCount: month.count,
			monthSeconds: month.totalSeconds,
			mostUsed,
		});
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	const formatTime = useCallback((totalSeconds: number) => {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
		if (hours > 0) return `${hours}h`;
		return `${minutes}m`;
	}, []);

	const hasStats =
		stats.streak > 0 ||
		stats.weekCount > 0 ||
		stats.monthCount > 0 ||
		stats.mostUsed !== null;

	return (
		<SafeAreaView style={styles.safeArea} edges={["top"]}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title} numberOfLines={1}>
					{t("fitStats")}
				</Text>
			</View>

			{!hasStats ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyEmoji}>{"\u{1F4CA}"}</Text>
					<Text style={styles.emptyText}>{t("fitNoStats")}</Text>
				</View>
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					<View style={styles.grid}>
						<View style={styles.gridItem}>
							<StatsCard
								icon={"\u{1F525}"}
								label={t("fitCurrentStreak")}
								value={`${stats.streak} ${t("fitDays")}`}
								colors={colors}
							/>
						</View>
						<View style={styles.gridItem}>
							<StatsCard
								icon={"\u{1F4C5}"}
								label={t("fitThisWeek")}
								value={`${stats.weekCount} \u00B7 ${formatTime(stats.weekSeconds)}`}
								colors={colors}
							/>
						</View>
						<View style={styles.gridItem}>
							<StatsCard
								icon={"\u{1F4C6}"}
								label={t("fitThisMonth")}
								value={`${stats.monthCount} \u00B7 ${formatTime(stats.monthSeconds)}`}
								colors={colors}
							/>
						</View>
						<View style={styles.gridItem}>
							<StatsCard
								icon={"\u2B50"}
								label={t("fitMostUsed")}
								value={stats.mostUsed ?? t("fitNone")}
								colors={colors}
							/>
						</View>
					</View>
				</ScrollView>
			)}
		</SafeAreaView>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				safeArea: {
					flex: 1,
					backgroundColor: colors.background,
				},
				header: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					paddingTop: spacing.md,
					paddingBottom: spacing.xs,
				},
				title: {
					...typography.largeTitle,
					color: colors.textPrimary,
					flex: 1,
				},
				content: {
					padding: spacing.lg,
					paddingBottom: spacing.xl,
				},
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					marginHorizontal: -spacing.xs,
				},
				gridItem: {
					width: "50%",
					paddingHorizontal: spacing.xs,
					marginBottom: spacing.sm,
				},
				emptyContainer: {
					flex: 1,
					alignItems: "center",
					paddingHorizontal: spacing.xl,
					paddingTop: spacing.xl * 3,
				},
				emptyEmoji: {
					fontSize: 64,
					marginBottom: spacing.md,
				},
				emptyText: {
					...typography.body,
					color: colors.textSecondary,
					textAlign: "center",
				},
			}),
		[colors]
	);
}
