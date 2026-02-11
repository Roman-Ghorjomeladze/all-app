import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { WorkoutWithDetails } from "../database";
import { Colors, spacing, typography } from "../theme";
import { useLanguage } from "../../../../i18n";

type WorkoutCardProps = {
	workout: WorkoutWithDetails;
	onPress: (workout: WorkoutWithDetails) => void;
	onLongPress?: (workout: WorkoutWithDetails) => void;
	colors: Colors;
};

export default function WorkoutCard({ workout, onPress, onLongPress, colors }: WorkoutCardProps) {
	const styles = useStyles(colors);
	const { t } = useLanguage();

	const formattedDuration = useMemo(() => {
		const total = workout.total_duration;
		const minutes = Math.floor(total / 60);
		const seconds = total % 60;
		if (minutes > 0 && seconds > 0) return `${minutes}${t("fitMin")} ${seconds}${t("fitSec")}`;
		if (minutes > 0) return `${minutes}${t("fitMin")}`;
		return `${seconds}${t("fitSec")}`;
	}, [workout.total_duration, t]);

	return (
		<TouchableOpacity
			style={styles.card}
			onPress={() => onPress(workout)}
			onLongPress={() => onLongPress?.(workout)}
			activeOpacity={0.7}
		>
			<View style={[styles.accentBorder, { backgroundColor: colors.accent }]} />
			<View style={styles.content}>
				<View style={styles.topRow}>
					<Text style={styles.icon}>{workout.icon}</Text>
					<View style={styles.info}>
						<Text style={styles.name} numberOfLines={1}>{workout.name}</Text>
						<View style={styles.metaRow}>
							<Text style={styles.meta}>
								{workout.exercise_count} {t("fitExercises")}
							</Text>
							<Text style={styles.dot}>{"\u00B7"}</Text>
							<Text style={styles.meta}>{formattedDuration}</Text>
						</View>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
}

function useStyles(colors: Colors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					flexDirection: "row",
					backgroundColor: colors.cardBackground,
					borderRadius: 12,
					marginBottom: spacing.sm,
					overflow: "hidden",
					shadowColor: colors.shadow,
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 4,
					elevation: 2,
				},
				accentBorder: {
					width: 4,
				},
				content: {
					flex: 1,
					padding: spacing.md,
				},
				topRow: {
					flexDirection: "row",
					alignItems: "center",
				},
				icon: {
					fontSize: 28,
					marginRight: spacing.sm,
				},
				info: {
					flex: 1,
				},
				name: {
					...typography.headline,
					color: colors.textPrimary,
					marginBottom: 2,
				},
				metaRow: {
					flexDirection: "row",
					alignItems: "center",
				},
				meta: {
					...typography.footnote,
					color: colors.textSecondary,
				},
				dot: {
					...typography.footnote,
					color: colors.textSecondary,
					marginHorizontal: spacing.xs,
				},
			}),
		[colors]
	);
}
